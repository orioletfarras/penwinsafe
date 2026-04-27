'use strict'

const { createClient } = require('@supabase/supabase-js')
const activation = require('./activation')
let wireguard = null
function getWireguard() {
  if (!wireguard) { try { wireguard = require('./wireguard') } catch {} }
  return wireguard
}

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const recentUrls = new Map()

// Cached filter config for this device
let cachedConfig = null

function getDeviceId() {
  return activation.loadActivation()?.deviceId || null
}

function getDeviceName() {
  return activation.loadActivation()?.deviceName || 'Dispositivo'
}

const CATEGORY_SEVERITY = {
  pornografia:      'critical',
  contenido_adulto: 'critical',
  violencia:        'danger',
  drogas:           'danger',
  odio:             'danger',
  apuestas:         'warning',
}

function severityForReason(reason) {
  for (const [cat, sev] of Object.entries(CATEGORY_SEVERITY)) {
    if (reason.includes(cat)) return sev
  }
  return 'warning'
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function extractEngine(url) {
  try {
    const h = new URL(url).hostname.replace('www.', '')
    if (h.startsWith('google.'))    return 'google'
    if (h === 'bing.com')           return 'bing'
    if (h === 'duckduckgo.com')     return 'duckduckgo'
    if (h === 'youtube.com')        return 'youtube'
    if (h === 'yahoo.com' || h.startsWith('yahoo.')) return 'yahoo'
    if (h === 'ecosia.org')         return 'ecosia'
    if (h === 'brave.com' || h === 'search.brave.com') return 'brave'
    if (h === 'qwant.com')          return 'qwant'
    if (h === 'startpage.com')      return 'startpage'
    if (h === 'ask.com')            return 'ask'
    if (h === 'yandex.com' || h.startsWith('yandex.')) return 'yandex'
    if (h === 'baidu.com')          return 'baidu'
    if (h === 'perplexity.ai')      return 'perplexity'
    if (h === 'you.com')            return 'you'
  } catch {}
  return 'other'
}

// Fetch active filter config for this device's group + org custom words
async function fetchFilterConfig() {
  const deviceId = getDeviceId()
  if (!deviceId) return null

  const { data: device } = await supabase
    .from('devices')
    .select('group_id, org_id, groups(active_categories, notify_categories), organizations(filter_config)')
    .eq('id', deviceId)
    .single()

  if (!device) return null

  const activeCategories = device.groups?.active_categories || [
    'pornografia','contenido_adulto','violencia','drogas','apuestas','odio'
  ]

  // Merge org custom words per category
  const filterConfig = device.organizations?.filter_config || {}
  const customWords = {}
  for (const cat of activeCategories) {
    customWords[cat] = filterConfig[cat]?.custom || []
  }

  cachedConfig = { activeCategories, customWords }
  return cachedConfig
}

async function getFilterConfig() {
  if (cachedConfig) return cachedConfig
  return await fetchFilterConfig()
}

async function logUrl(url, title) {
  const deviceId = getDeviceId()
  if (!deviceId || !url || url.startsWith('data:') || url === 'about:blank') return

  const now = Date.now()
  const last = recentUrls.get(url)
  if (last && now - last < 10000) return
  recentUrls.set(url, now)

  if (recentUrls.size > 200) {
    const cutoff = now - 30000
    for (const [k, v] of recentUrls) if (v < cutoff) recentUrls.delete(k)
  }

  await supabase.from('url_events').insert({
    device_id: deviceId,
    url,
    domain: extractDomain(url),
    title: title || null,
    visited_at: new Date().toISOString(),
  })
}

async function logSearch(query, url) {
  const deviceId = getDeviceId()
  if (!deviceId || !query) return
  await supabase.from('search_events').insert({
    device_id: deviceId,
    query,
    engine: extractEngine(url),
    searched_at: new Date().toISOString(),
  })
}

async function logBlocked(url, reason, query) {
  const deviceId = getDeviceId()
  if (!deviceId) { console.warn('[telemetry] logBlocked: no deviceId, skipping'); return }

  const logUrl = url && !url.startsWith('data:') ? url : `search:${query}`
  const domain = extractDomain(logUrl.startsWith('search:') ? 'search' : logUrl)

  const { error } = await supabase.from('blocked_events').insert({
    device_id: deviceId,
    url: logUrl,
    domain,
    reason,
    query: query || null,
    blocked_at: new Date().toISOString(),
  })
  if (error) console.error('[telemetry] logBlocked insert error:', error.message)

  // Create alert in panel
  const deviceName = getDeviceName()
  const isKeyword = reason === 'keyword_filter'
  const label = isKeyword
    ? `"${query}" bloqueado en ${deviceName}`
    : `Acceso bloqueado a ${domain} en ${deviceName}`
  await supabase.from('alerts').insert({
    device_id: deviceId,
    type: isKeyword ? 'concerning_search' : 'blocked_site',
    severity: severityForReason(reason),
    message: label,
  }).then(({ error: e }) => { if (e) console.error('[telemetry] alert insert error:', e.message) })

  // Fire-and-forget tutor notification
  supabase.functions.invoke('notify-blocked', {
    body: { device_id: deviceId, url: logUrl, domain, reason, category: reason }
  }).catch(() => {})
}

// Track which browsers have already been alerted this session (reset on restart)
const alertedBrowsers = new Set()

const BROWSERS = [
  { name: 'Google Chrome',    patterns: ['Google Chrome', 'chrome', 'Google\\ Chrome'] },
  { name: 'Firefox',          patterns: ['Firefox', 'firefox'] },
  { name: 'Safari',           patterns: ['Safari'] },
  { name: 'Microsoft Edge',   patterns: ['Microsoft Edge', 'msedge', 'Microsoft\\ Edge'] },
  { name: 'Opera',            patterns: ['Opera', 'opera'] },
  { name: 'Brave',            patterns: ['Brave Browser', 'brave'] },
  { name: 'Vivaldi',          patterns: ['Vivaldi', 'vivaldi'] },
  { name: 'Arc',              patterns: ['Arc'] },
  { name: 'Tor Browser',      patterns: ['Tor Browser', 'firefox.real'] },
]

async function checkOtherBrowsers() {
  const deviceId = getDeviceId()
  if (!deviceId) return

  const { exec } = require('child_process')
  const isWin = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  const cmd = isWin
    ? 'tasklist /FO CSV /NH'
    : 'ps aux'

  exec(cmd, { timeout: 5000 }, async (err, stdout) => {
    if (err || !stdout) return

    for (const browser of BROWSERS) {
      const key = browser.name
      if (alertedBrowsers.has(key)) continue

      const found = browser.patterns.some(p => {
        if (isWin) return stdout.toLowerCase().includes(p.toLowerCase())
        // macOS/Linux: exclude our own Electron process and grep itself
        const lines = stdout.split('\n').filter(l =>
          l.toLowerCase().includes(p.toLowerCase()) &&
          !l.includes('Electron') &&
          !l.includes('penwinsafe') &&
          !l.includes('grep') &&
          !l.includes('node ')
        )
        return lines.length > 0
      })

      if (found) {
        alertedBrowsers.add(key)
        const deviceName = getDeviceName()
        console.log(`[monitor] other browser detected: ${browser.name} on ${deviceName}`)
        await supabase.from('alerts').insert({
          device_id: deviceId,
          type: 'concerning_search',
          severity: 'danger',
          message: `${browser.name} abierto en ${deviceName} — posible evasión del filtro`,
        }).catch(() => {})
      }
    }
  })
}

async function heartbeat() {
  const deviceId = getDeviceId()
  if (!deviceId) return

  const os = require('os')
  const nets = os.networkInterfaces()
  let ip = '127.0.0.1'
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { ip = net.address; break }
    }
  }

  const networkMode = getWireguard()?.getNetworkMode() || null

  await supabase.from('devices').update({
    status: 'online',
    last_seen: new Date().toISOString(),
    ip_address: ip,
    ...(networkMode ? { network_mode: networkMode } : {}),
  }).eq('id', deviceId)

  // Refresh filter config every heartbeat so changes in panel apply within 30s
  await fetchFilterConfig()
}

module.exports = { logUrl, logSearch, logBlocked, heartbeat, getFilterConfig, checkOtherBrowsers }

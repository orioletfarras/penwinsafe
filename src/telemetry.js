'use strict'

const { createClient } = require('@supabase/supabase-js')
const activation = require('./activation')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const recentUrls = new Map()

// Cached filter config for this device
let cachedConfig = null

function getDeviceId() {
  return activation.loadActivation()?.deviceId || null
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function extractEngine(url) {
  try {
    const h = new URL(url).hostname.replace('www.', '')
    if (h.startsWith('google.'))  return 'google'
    if (h === 'bing.com')         return 'bing'
    if (h === 'duckduckgo.com')   return 'duckduckgo'
    if (h === 'youtube.com')      return 'youtube'
    if (h === 'yahoo.com')        return 'yahoo'
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
  if (!deviceId) return

  const logUrl = url && !url.startsWith('data:') ? url : `search:${query}`
  const domain = extractDomain(logUrl.startsWith('search:') ? 'search' : logUrl)

  await supabase.from('blocked_events').insert({
    device_id: deviceId,
    url: logUrl,
    domain,
    reason,
    blocked_at: new Date().toISOString(),
  })

  // Fire-and-forget tutor notification
  supabase.functions.invoke('notify-blocked', {
    body: { device_id: deviceId, url: logUrl, domain, reason, category: reason }
  }).catch(() => {})
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

  await supabase.from('devices').update({
    status: 'online',
    last_seen: new Date().toISOString(),
    ip_address: ip,
  }).eq('id', deviceId)

  // Refresh filter config every heartbeat so changes in panel apply within 30s
  await fetchFilterConfig()
}

module.exports = { logUrl, logSearch, logBlocked, heartbeat, getFilterConfig }

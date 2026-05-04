'use strict'

// ── Constants ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// ── Supabase helpers ───────────────────────────────────────────────────────
async function sbQuery(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, { headers: HEADERS })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
}

async function sbUpdate(table, body, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'count=exact' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  const count = parseInt(r.headers.get('content-range')?.split('/')[1] || '1')
  return count
}

async function sbRpc(fn, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
}

async function sbFunction(fn, body) {
  await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
}

// ── Activation ─────────────────────────────────────────────────────────────
async function getActivation() {
  return new Promise(resolve => chrome.storage.local.get(['activation'], r => resolve(r.activation || null)))
}

async function activate(centerCode, deviceName) {
  try {
    const orgs = await sbQuery('organizations', `?center_code=eq.${encodeURIComponent(centerCode.toUpperCase().trim())}&select=id,name`)
    if (!orgs.length) return { ok: false, error: 'Código de centro no válido' }
    const org = orgs[0]

    const hostname = navigator.userAgent.includes('CrOS') ? 'Chromebook' : 'Chrome-' + Math.random().toString(36).slice(-4)
    const name = deviceName || hostname

    const devices = await sbQuery('devices', '?select=id,name&limit=1') // dummy to check perms
    const [device] = await fetch(`${SUPABASE_URL}/rest/v1/devices`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=representation' },
      body: JSON.stringify({ org_id: org.id, name, status: 'online', platform: 'chrome' }),
    }).then(r => r.json())

    if (!device?.id) return { ok: false, error: 'Error al registrar dispositivo' }

    const activation = { deviceId: device.id, orgId: org.id, orgName: org.name, deviceName: name }
    await chrome.storage.local.set({ activation })
    return { ok: true, ...activation }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ── Filter config ──────────────────────────────────────────────────────────
let cachedFilter = null

async function fetchFilterConfig() {
  const act = await getActivation()
  if (!act) return null
  try {
    const [device] = await sbQuery('devices', `?id=eq.${act.deviceId}&select=group_id,org_id,groups(active_categories),organizations(filter_config)`)
    if (!device) return null

    const activeCategories = device.groups?.active_categories || [
      'pornografia', 'contenido_adulto', 'violencia', 'drogas', 'apuestas', 'odio'
    ]
    const filterConfig = device.organizations?.filter_config || {}
    const customWords = {}
    for (const cat of activeCategories) {
      customWords[cat] = filterConfig[cat]?.custom || []
    }
    cachedFilter = { activeCategories, customWords }
    await chrome.storage.local.set({ filterConfig: cachedFilter })
    return cachedFilter
  } catch {
    const r = await chrome.storage.local.get(['filterConfig'])
    return r.filterConfig || null
  }
}

async function getFilterConfig() {
  if (cachedFilter) return cachedFilter
  const r = await chrome.storage.local.get(['filterConfig'])
  if (r.filterConfig) { cachedFilter = r.filterConfig; return cachedFilter }
  return fetchFilterConfig()
}

// ── Keyword check ──────────────────────────────────────────────────────────
const BUILT_IN_KEYWORDS = {
  pornografia: ['porn','porno','pornografia','xxx','x-rated','adult film','sex video','sex tape','nude','naked','hentai','erotic','onlyfans','xvideos','xhamster','pornhub','redtube','youporn'],
  contenido_adulto: ['porn','porno','xxx','nude','naked','sex','erotic','hentai','onlyfans'],
  violencia: ['decapitation','gore','snuff','beheading','kill','murder tutorial','how to kill'],
  drogas: ['comprar droga','buy drugs','where to buy weed','como conseguir droga','drug dealer','buy cocaine','buy heroin','buy meth','darknet drugs'],
  apuestas: ['casino online','apuestas deportivas','bet365','sportium','pokerstars','888casino','betway'],
  odio: ['white supremacy','neo nazi','kill all','hate speech'],
}

async function isKeywordBlocked(text) {
  const cfg = await getFilterConfig()
  if (!cfg) return null
  const lc = text.toLowerCase()
  for (const cat of cfg.activeCategories) {
    const keywords = [...(BUILT_IN_KEYWORDS[cat] || []), ...(cfg.customWords[cat] || [])]
    for (const kw of keywords) {
      if (lc.includes(kw.toLowerCase())) return { blocked: true, keyword: kw, category: cat }
    }
  }
  return { blocked: false }
}

// ── Telemetry ──────────────────────────────────────────────────────────────
const recentUrls = new Map()

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function extractEngine(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    if (h.startsWith('google.')) return 'google'
    if (h === 'bing.com') return 'bing'
    if (h === 'duckduckgo.com') return 'duckduckgo'
    if (h === 'youtube.com') return 'youtube'
    if (h === 'yahoo.com') return 'yahoo'
    if (h === 'ecosia.org') return 'ecosia'
    if (h === 'brave.com' || h === 'search.brave.com') return 'brave'
  } catch {}
  return 'other'
}

function extractSearchQuery(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('search_query') || null
  } catch { return null }
}

async function logUrl(url, title) {
  const act = await getActivation()
  if (!act || !url || url.startsWith('chrome') || url.startsWith('data:') || url === 'about:blank') return
  const now = Date.now()
  const last = recentUrls.get(url)
  if (last && now - last < 10000) return
  recentUrls.set(url, now)
  if (recentUrls.size > 200) {
    const cutoff = now - 30000
    for (const [k, v] of recentUrls) if (v < cutoff) recentUrls.delete(k)
  }
  sbInsert('url_events', {
    device_id: act.deviceId,
    url,
    domain: extractDomain(url),
    title: title || null,
    visited_at: new Date().toISOString(),
  }).catch(() => {})
}

async function logSearch(query, url) {
  const act = await getActivation()
  if (!act || !query) return
  sbInsert('search_events', {
    device_id: act.deviceId,
    query,
    engine: extractEngine(url),
    searched_at: new Date().toISOString(),
  }).catch(() => {})
}

const CATEGORY_SEVERITY = {
  pornografia: 'critical', contenido_adulto: 'critical',
  violencia: 'danger', drogas: 'danger', odio: 'danger', apuestas: 'warning',
}

async function logBlocked(url, reason, query) {
  const act = await getActivation()
  if (!act) return
  const logUrl = url && !url.startsWith('data:') ? url : `search:${query}`
  const domain = extractDomain(logUrl.startsWith('search:') ? 'search' : logUrl)
  const severity = CATEGORY_SEVERITY[reason] || 'warning'
  const isKeyword = reason === 'keyword_filter'
  const message = isKeyword
    ? `"${query}" bloqueado en ${act.deviceName}`
    : `Acceso bloqueado a ${domain} en ${act.deviceName}`

  sbInsert('blocked_events', {
    device_id: act.deviceId, url: logUrl, domain, reason,
    query: query || null, blocked_at: new Date().toISOString(),
  }).catch(() => {})

  sbInsert('alerts', {
    device_id: act.deviceId,
    type: isKeyword ? 'concerning_search' : 'blocked_site',
    severity, message,
  }).catch(() => {})

  sbFunction('notify-blocked', {
    device_id: act.deviceId, url: logUrl, domain, reason, category: reason
  }).catch(() => {})
}

// ── Heartbeat ──────────────────────────────────────────────────────────────
async function heartbeat() {
  const act = await getActivation()
  if (!act) return
  try {
    const count = await sbUpdate('devices', {
      status: 'online',
      last_seen: new Date().toISOString(),
      platform: 'chrome',
    }, `?id=eq.${act.deviceId}`)

    // Device was deleted from panel → clear activation
    if (count === 0) {
      await chrome.storage.local.remove(['activation', 'filterConfig'])
      cachedFilter = null
      return
    }

    const today = new Date().toISOString().split('T')[0]
    sbRpc('increment_screen_time', { p_device_id: act.deviceId, p_date: today, p_seconds: 30 }).catch(() => {})
    fetchFilterConfig().catch(() => {})
  } catch {}
}

// ── URL blocking via webNavigation ─────────────────────────────────────────
const BLOCKED_DOMAINS = [
  'pornhub.com','xvideos.com','xhamster.com','redtube.com','youporn.com',
  'xnxx.com','xtwitter.com','porn.com','sex.com','onlyfans.com','chaturbate.com',
  'livejasmin.com','stripchat.com','cam4.com','bongacams.com',
]

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return
  const { url, tabId } = details

  // Log URL
  chrome.tabs.get(tabId, tab => {
    if (chrome.runtime.lastError) return
    logUrl(url, tab?.title)
  })

  // Check domain block
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')
    const cfg = await getFilterConfig()
    if (!cfg) return

    // Check if domain is in blocked list
    const isDomainBlocked = BLOCKED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))
    if (isDomainBlocked) {
      logBlocked(url, 'pornografia', null)
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(url)}&reason=pornografia`) })
      return
    }

    // Check search query
    const query = extractSearchQuery(url)
    if (query) {
      logSearch(query, url)
      const result = await isKeywordBlocked(query)
      if (result?.blocked) {
        logBlocked(url, 'keyword_filter', query)
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(url)}&reason=keyword_filter&q=${encodeURIComponent(query)}`) })
      }
    }
  } catch {}
})

// ── Message handler (from content script / popup) ──────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'activate') {
    activate(msg.code, msg.name).then(reply)
    return true
  }
  if (msg.type === 'get_activation') {
    getActivation().then(reply)
    return true
  }
  if (msg.type === 'check_keyword') {
    isKeywordBlocked(msg.text).then(reply)
    return true
  }
  if (msg.type === 'log_blocked') {
    logBlocked(msg.url, msg.reason, msg.query)
    return false
  }
})

// ── Alarms: heartbeat every 30s ────────────────────────────────────────────
chrome.alarms.create('heartbeat', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'heartbeat') heartbeat()
})

// Initial heartbeat
heartbeat()
getFilterConfig()

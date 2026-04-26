'use strict'

const { createClient } = require('@supabase/supabase-js')
const activation = require('./activation')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Throttle: don't log same URL more than once per 10s
const recentUrls = new Map()

function getDeviceId() {
  return activation.loadActivation()?.deviceId || null
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function extractEngine(url) {
  try {
    const h = new URL(url).hostname.replace('www.', '')
    if (h.startsWith('google.'))   return 'google'
    if (h === 'bing.com')          return 'bing'
    if (h === 'duckduckgo.com')    return 'duckduckgo'
    if (h === 'youtube.com')       return 'youtube'
    if (h === 'yahoo.com')         return 'yahoo'
  } catch {}
  return 'other'
}

async function logUrl(url, title) {
  const deviceId = getDeviceId()
  if (!deviceId || !url || url.startsWith('data:') || url === 'about:blank') return

  const now = Date.now()
  const last = recentUrls.get(url)
  if (last && now - last < 10000) return
  recentUrls.set(url, now)

  // Clean old entries
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

  // For keyword blocks url might be a search URL, for DNS blocks it's the blocked domain
  const logUrl = url && !url.startsWith('data:') ? url : `search:${query}`
  await supabase.from('blocked_events').insert({
    device_id: deviceId,
    url: logUrl,
    domain: extractDomain(logUrl.startsWith('search:') ? 'search' : logUrl),
    reason,
    blocked_at: new Date().toISOString(),
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
  await supabase.from('devices').update({
    status: 'online',
    last_seen: new Date().toISOString(),
    ip_address: ip,
  }).eq('id', deviceId)
}

module.exports = { logUrl, logSearch, logBlocked, heartbeat }

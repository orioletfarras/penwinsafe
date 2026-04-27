'use strict'

const { exec }             = require('child_process')
const { generateKeyPairSync, createPrivateKey, createPublicKey } = require('crypto')
const dns  = require('dns').promises
const fs   = require('fs')
const path = require('path')
const net  = require('net')
const { app } = require('electron')
const { createClient } = require('@supabase/supabase-js')
const activation = require('./activation')

const SUPABASE_URL         = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

// Hostnames to whitelist (Supabase project + pooler)
const SUPABASE_HOSTS = [
  'usmpicfqqiowdlridybh.supabase.co',
  'aws-0-eu-central-1.pooler.supabase.com',
]

const IS_WIN = process.platform === 'win32'
const WG_CONFIG_NAME = 'penwinsafe'
const WG_CONFIG_PATH = IS_WIN
  ? path.join('C:\\ProgramData\\WireGuard', `${WG_CONFIG_NAME}.conf`)
  : `/etc/wireguard/${WG_CONFIG_NAME}.conf`

// WireGuard binary path on Windows
const WG_EXE = IS_WIN
  ? (fs.existsSync('C:\\Program Files\\WireGuard\\wireguard.exe')
      ? '"C:\\Program Files\\WireGuard\\wireguard.exe"'
      : 'wireguard')
  : 'wg-quick'

let supabase = null
function getSupabase() {
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  return supabase
}

// ── Cache (userData/wg_cache.json) ────────────────────────────────────────

function getCachePath() {
  return path.join(app.getPath('userData'), 'wg_cache.json')
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(getCachePath(), 'utf8'))
  } catch { return {} }
}

function saveCache(patch) {
  const current = loadCache()
  const updated = { ...current, ...patch }
  fs.writeFileSync(getCachePath(), JSON.stringify(updated, null, 2))
  return updated
}

// ── Key management ────────────────────────────────────────────────────────

const KEY_FILE = () => path.join(app.getPath('userData'), 'wg_private.key')

function toWgB64(b64url) {
  return Buffer.from(
    (b64url + '==').replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('base64')
}

function generateKeypair() {
  const { privateKey, publicKey } = generateKeyPairSync('x25519')
  const privJwk = privateKey.export({ format: 'jwk' })
  const pubJwk  = publicKey.export({ format: 'jwk' })
  return { privateKey: toWgB64(privJwk.d), publicKey: toWgB64(pubJwk.x) }
}

function loadOrCreateKeypair() {
  const kf = KEY_FILE()
  if (fs.existsSync(kf)) {
    const privateKey = fs.readFileSync(kf, 'utf8').trim()
    try {
      const privDer = Buffer.concat([
        Buffer.from('302e020100300506032b656e04220420', 'hex'),
        Buffer.from(privateKey, 'base64'),
      ])
      const privKey = createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' })
      const pubJwk  = createPublicKey(privKey).export({ format: 'jwk' })
      return { privateKey, publicKey: toWgB64(pubJwk.x) }
    } catch {}
  }
  const kp = generateKeypair()
  fs.writeFileSync(kf, kp.privateKey, { mode: 0o600 })
  return kp
}

// ── Network helpers ───────────────────────────────────────────────────────

function tcpCheck(host, port, timeoutMs = 3000) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port })
    const timer  = setTimeout(() => { socket.destroy(); resolve(false) }, timeoutMs)
    socket.on('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true) })
    socket.on('error',   () => { clearTimeout(timer); resolve(false) })
  })
}

async function resolveSupabaseIps() {
  const ips = new Set()
  await Promise.allSettled(
    SUPABASE_HOSTS.map(async host => {
      const addrs = await dns.resolve4(host).catch(() => [])
      addrs.forEach(ip => ips.add(ip))
    })
  )
  return [...ips]
}

function run(cmd, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout.trim())
    })
  })
}

// ── WireGuard config file ─────────────────────────────────────────────────

async function writeWgConfig(privateKey, assignedIp, serverPubkey, presharedKey, endpoint) {
  const lines = [
    '[Interface]',
    `PrivateKey = ${privateKey}`,
    `Address = ${assignedIp}/32`,
    'DNS = 1.1.1.1',
    '',
    '[Peer]',
    `PublicKey = ${serverPubkey}`,
    presharedKey ? `PresharedKey = ${presharedKey}` : null,
    `Endpoint = ${endpoint}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    'PersistentKeepalive = 25',
  ].filter(l => l !== null).join('\n')

  if (IS_WIN) {
    fs.mkdirSync(path.dirname(WG_CONFIG_PATH), { recursive: true })
    fs.writeFileSync(WG_CONFIG_PATH, lines)
  } else {
    const tmp = path.join(app.getPath('temp'), `${WG_CONFIG_NAME}.conf`)
    fs.writeFileSync(tmp, lines, { mode: 0o600 })
    await run(`sudo mkdir -p /etc/wireguard && sudo mv "${tmp}" "${WG_CONFIG_PATH}" && sudo chmod 600 "${WG_CONFIG_PATH}"`)
  }
  console.log('[wg] config written')
}

// ── WireGuard tunnel up/down ──────────────────────────────────────────────

let wgActive = false
let networkMode = 'direct' // 'direct' | 'tunnel' | 'supabase_only' | 'no_internet'

async function reportNetworkMode(deviceId, mode) {
  networkMode = mode
  console.log('[wg] network mode:', mode)
  try {
    await getSupabase().from('devices').update({ network_mode: mode }).eq('id', deviceId)
  } catch {}
}

function getNetworkMode() { return networkMode }

async function wgUp() {
  if (IS_WIN) await run(`${WG_EXE} /installtunnelservice "${WG_CONFIG_PATH}"`)
  else        await run(`sudo wg-quick up ${WG_CONFIG_NAME}`)
  wgActive = true
  console.log('[wg] tunnel UP')
}

async function wgDown() {
  try {
    if (IS_WIN) await run(`${WG_EXE} /uninstalltunnelservice ${WG_CONFIG_NAME}`)
    else        await run(`sudo wg-quick down ${WG_CONFIG_NAME}`)
    wgActive = false
    console.log('[wg] tunnel DOWN')
  } catch (e) {
    console.warn('[wg] wgDown:', e.message)
  }
}

// ── Peer registration ─────────────────────────────────────────────────────

async function registerPeer(deviceId, publicKey) {
  const db = getSupabase()
  const { data: device } = await db.from('devices')
    .select('org_id, wg_assigned_ip, wg_public_key')
    .eq('id', deviceId).single()
  if (!device) throw new Error('Device not found')

  if (device.wg_public_key === publicKey && device.wg_assigned_ip)
    return device.wg_assigned_ip

  const { data: peers } = await db.from('devices')
    .select('wg_assigned_ip').eq('org_id', device.org_id)
    .not('wg_assigned_ip', 'is', null)

  const used = new Set((peers || []).map(p => p.wg_assigned_ip))
  let assigned = null
  for (let i = 2; i <= 254; i++) {
    const c = `10.99.1.${i}`
    if (!used.has(c)) { assigned = c; break }
  }
  if (!assigned) throw new Error('No IPs available')

  await db.from('devices').update({ wg_public_key: publicKey, wg_assigned_ip: assigned }).eq('id', deviceId)
  console.log('[wg] peer registered:', assigned)
  return assigned
}

// ── Fetch WG config from Supabase and update cache ────────────────────────

async function fetchAndCacheConfig(orgId) {
  const db = getSupabase()
  const { data: cfg } = await db.from('unifi_configs')
    .select('controller_url, wg_server_pubkey, wg_preshared_key, wg_server_ip, wg_port')
    .eq('org_id', orgId).single()

  if (!cfg?.wg_server_pubkey) return null

  const cached = {
    server_pubkey:      cfg.wg_server_pubkey,
    preshared_key:      cfg.wg_preshared_key || null,
    server_ip_external: cfg.wg_server_ip || null,
    server_ip_internal: cfg.controller_url ? new URL(cfg.controller_url).hostname : null,
    port:               cfg.wg_port || 51820,
  }
  saveCache({ wg_config: cached, wg_config_updated: new Date().toISOString() })
  console.log('[wg] config cached')
  return cached
}

// ── Update Supabase IP whitelist in UniFi (fire and forget) ───────────────

async function refreshUnifiWhitelist(ips) {
  try {
    const act = activation.loadActivation()
    if (!act?.deviceId) return
    const db = getSupabase()
    const { data: device } = await db.from('devices').select('org_id').eq('id', act.deviceId).single()
    if (!device) return

    // Call edge function to update the Supabase IP group in UniFi
    await fetch(`${SUPABASE_URL}/functions/v1/unifi-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ action: 'update_supabase_whitelist', org_id: device.org_id, ips }),
    })
    console.log('[wg] UniFi whitelist updated:', ips)
  } catch (e) {
    console.warn('[wg] whitelist update failed (non-critical):', e.message)
  }
}

// ── Refresh when 443 is free (cache + whitelist) ──────────────────────────

async function refreshWhenOnline(orgId) {
  // Resolve Supabase IPs and update cache
  const ips = await resolveSupabaseIps()
  if (ips.length) {
    saveCache({ supabase_ips: ips, supabase_ips_updated: new Date().toISOString() })
    console.log('[wg] Supabase IPs cached:', ips)
    // Update UniFi whitelist in background
    refreshUnifiWhitelist(ips)
  }

  // Refresh WG config from Supabase
  await fetchAndCacheConfig(orgId)
}

// ── Main init ─────────────────────────────────────────────────────────────

async function init() {
  const act = activation.loadActivation()
  if (!act?.deviceId) { console.log('[wg] not activated'); return }

  const db = getSupabase()
  const { data: device } = await db.from('devices').select('org_id').eq('id', act.deviceId).single()
  if (!device) { console.error('[wg] device not found'); return }

  const httpsOk = await tcpCheck('connectivitycheck.gstatic.com', 443, 3000)
  console.log('[wg] HTTPS reachable:', httpsOk)

  if (httpsOk) {
    if (wgActive) await wgDown()
    await reportNetworkMode(act.deviceId, 'direct')
    await refreshWhenOnline(device.org_id)
    return
  }

  console.log('[wg] HTTPS blocked — loading WireGuard config')
  const cache = loadCache()

  // Try to refresh config from Supabase (whitelist should allow it through 443 block)
  let wgCfg = null
  const supabaseOk = cache.supabase_ips?.length
    ? await tcpCheck(cache.supabase_ips[0], 443, 2000)
    : false

  if (supabaseOk) {
    console.log('[wg] Supabase reachable via whitelist — refreshing config')
    await reportNetworkMode(act.deviceId, 'supabase_only')
    wgCfg = await fetchAndCacheConfig(device.org_id).catch(() => null)
  }

  if (!wgCfg) {
    wgCfg = cache.wg_config || null
    if (wgCfg) {
      console.log('[wg] using cached config (updated:', cache.wg_config_updated, ')')
    } else {
      await reportNetworkMode(act.deviceId, 'no_internet')
      console.error('[wg] no config available — cannot start tunnel')
      return
    }
  }

  // Detect local vs external endpoint
  let serverIp = wgCfg.server_ip_external
  if (wgCfg.server_ip_internal) {
    const onLocal = await tcpCheck(wgCfg.server_ip_internal, 443, 1000)
    if (onLocal) { serverIp = wgCfg.server_ip_internal; console.log('[wg] using internal endpoint') }
  }
  if (!serverIp) {
    await reportNetworkMode(act.deviceId, 'no_internet')
    console.error('[wg] no server IP available')
    return
  }

  const endpoint = `${serverIp}:${wgCfg.port || 51820}`
  const { privateKey, publicKey } = loadOrCreateKeypair()

  let assignedIp
  try {
    assignedIp = await registerPeer(act.deviceId, publicKey)
  } catch (e) {
    await reportNetworkMode(act.deviceId, supabaseOk ? 'supabase_only' : 'no_internet')
    console.error('[wg] peer registration failed:', e.message)
    return
  }

  try {
    await writeWgConfig(privateKey, assignedIp, wgCfg.server_pubkey, wgCfg.preshared_key, endpoint)
    await wgUp()
    await reportNetworkMode(act.deviceId, 'tunnel')
  } catch (e) {
    await reportNetworkMode(act.deviceId, supabaseOk ? 'supabase_only' : 'no_internet')
    console.error('[wg] tunnel start failed:', e.message)
  }
}

// ── Monitor (every 60s) ───────────────────────────────────────────────────

function startMonitor() {
  setInterval(async () => {
    const httpsOk = await tcpCheck('connectivitycheck.gstatic.com', 443, 3000)
    if (httpsOk && wgActive) {
      console.log('[wg] HTTPS restored — bringing tunnel down')
      await wgDown()
    } else if (!httpsOk && !wgActive) {
      console.log('[wg] HTTPS blocked — re-initializing tunnel')
      await init()
    }
  }, 60000)
}

module.exports = { init, startMonitor, wgUp, wgDown, getNetworkMode }

'use strict'

const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function getActivationPath() {
  return path.join(app.getPath('userData'), 'activation.json')
}

function loadActivation() {
  try {
    const data = fs.readFileSync(getActivationPath(), 'utf8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

function saveActivation(data) {
  fs.writeFileSync(getActivationPath(), JSON.stringify(data, null, 2), 'utf8')
}

function isActivated() {
  const a = loadActivation()
  return !!(a && a.deviceId && a.orgId)
}

function getDeviceInfo() {
  const a = loadActivation()
  return a || {}
}

async function activate(centerCode, deviceName) {
  // Find org by center code
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('center_code', centerCode.toUpperCase().trim())
    .single()

  if (orgErr || !org) {
    return { ok: false, error: 'Código de centro no válido' }
  }

  const os = require('os')
  const name = deviceName || os.hostname()

  // Register device
  const { data: device, error: devErr } = await supabase
    .from('devices')
    .insert({
      org_id: org.id,
      name: name,
      status: 'online',
      os_info: `${process.platform} ${os.release()}`,
      ip_address: getLocalIP(),
      last_seen: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (devErr) {
    return { ok: false, error: 'Error al registrar el dispositivo: ' + devErr.message }
  }

  saveActivation({ deviceId: device.id, orgId: org.id, orgName: org.name, deviceName: name })
  return { ok: true, orgName: org.name }
}

function getLocalIP() {
  const os = require('os')
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

function clearActivation() {
  try { fs.unlinkSync(getActivationPath()) } catch {}
}

module.exports = { isActivated, getDeviceInfo, activate, loadActivation, clearActivation }

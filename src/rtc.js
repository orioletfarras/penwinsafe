'use strict'

const { createClient } = require('@supabase/supabase-js')
const { desktopCapturer, systemPreferences } = require('electron')
const activation = require('./activation')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { enabled: false }  // disable Realtime — use REST polling only
})

let mainWin = null
let pollInterval = null
let activeSessionId = null

function getDeviceId() {
  return activation.loadActivation()?.deviceId || null
}

function init(win) {
  mainWin = win
  const deviceId = getDeviceId()
  if (!deviceId) { console.log('[rtc] no deviceId, polling disabled'); return }
  console.log('[rtc] REST polling started for device', deviceId)

  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(() => {
    poll(deviceId)
    pollScreenshots(deviceId)
  }, 2000)
  poll(deviceId)
  pollScreenshots(deviceId)
}

async function poll(deviceId) {
  try {
    const { data } = await supabase
      .from('rtc_sessions')
      .select('id, offer_sdp')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data || data.id === activeSessionId) return

    activeSessionId = data.id
    console.log('[rtc] found pending session', data.id)
    mainWin?.webContents.send('rtc-offer', data.id, data.offer_sdp)
  } catch { /* no pending session */ }
}

async function submitAnswer(sessionId, answerSdp) {
  console.log('[rtc] submitting answer for session', sessionId)
  const { error } = await supabase
    .from('rtc_sessions')
    .update({ answer_sdp: answerSdp, status: 'active' })
    .eq('id', sessionId)
  if (error) console.error('[rtc] answer submit error:', error.message)
}

function closeSession() {
  activeSessionId = null
}

let activeScreenshotId = null

async function pollScreenshots(deviceId) {
  try {
    const { data } = await supabase
      .from('screenshot_requests')
      .select('id')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (!data || data.id === activeScreenshotId) return
    activeScreenshotId = data.id
    console.log('[rtc] screenshot request', data.id)

    // Check macOS screen recording permission
    if (process.platform === 'darwin') {
      const perm = systemPreferences.getMediaAccessStatus('screen')
      console.log('[rtc] screen permission:', perm)
      if (perm !== 'granted') {
        console.warn('[rtc] screen recording permission not granted — open System Settings > Privacy > Screen Recording and enable PenwinSafe')
        throw new Error(`screen permission: ${perm}`)
      }
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    })

    console.log('[rtc] sources found:', sources.length, sources.map(s => s.name))
    const thumb = sources[0]?.thumbnail
    console.log('[rtc] thumbnail empty?', thumb?.isEmpty())

    const png = thumb?.toPNG()
    if (!png || png.length < 100) throw new Error(`invalid png (${png?.length} bytes)`)

    await supabase.from('screenshot_requests').update({
      status: 'done',
      image_data: png.toString('base64'),
      taken_at: new Date().toISOString(),
    }).eq('id', data.id)

    console.log('[rtc] screenshot uploaded', Math.round(png.length / 1024), 'KB')
  } catch (e) {
    console.error('[rtc] screenshot error:', e?.message || e)
    if (activeScreenshotId) {
      try { await supabase.from('screenshot_requests').update({ status: 'error' }).eq('id', activeScreenshotId) } catch {}
    }
  }
}

module.exports = { init, submitAnswer, closeSession }

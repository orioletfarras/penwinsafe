'use strict'

const { createClient } = require('@supabase/supabase-js')
const activation = require('./activation')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

let mainWin = null
let channel = null

function init(win) {
  mainWin = win
  const deviceId = activation.loadActivation()?.deviceId
  if (!deviceId) { console.log('[rtc] no deviceId, skipping init'); return }

  console.log('[rtc] init for device', deviceId)
  if (channel) { supabase.removeChannel(channel); channel = null }

  channel = supabase.channel(`device-rtc:${deviceId}`, { config: { broadcast: { ack: false } } })
  channel
    .on('broadcast', { event: 'request-stream' }, () => {
      console.log('[rtc] received request-stream, sending rtc-start to renderer')
      mainWin?.webContents.send('rtc-start')
    })
    .on('broadcast', { event: 'answer' }, ({ payload }) => {
      console.log('[rtc] received answer from panel')
      mainWin?.webContents.send('rtc-remote-desc', payload.sdp)
    })
    .on('broadcast', { event: 'ice-panel' }, ({ payload }) => {
      mainWin?.webContents.send('rtc-remote-ice', payload.candidate)
    })
    .subscribe((status, err) => {
      console.log('[rtc] channel status:', status, err || '')
    })
}

function sendOffer(sdp) {
  console.log('[rtc] sending offer to panel')
  channel?.send({ type: 'broadcast', event: 'offer', payload: { sdp } })
}

function sendIce(candidate) {
  channel?.send({ type: 'broadcast', event: 'ice-device', payload: { candidate } })
}

module.exports = { init, sendOffer, sendIce }

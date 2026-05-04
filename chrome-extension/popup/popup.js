'use strict'

async function init() {
  const activation = await chrome.runtime.sendMessage({ type: 'get_activation' })

  if (activation?.deviceId) {
    document.getElementById('view-active').style.display = 'block'
    document.getElementById('info-device').textContent = activation.deviceName || '—'
    document.getElementById('info-org').textContent = activation.orgName || '—'
  } else {
    document.getElementById('view-inactive').style.display = 'block'
    document.getElementById('btn-activate').addEventListener('click', doActivate)
    document.getElementById('input-code').addEventListener('keydown', e => { if (e.key === 'Enter') doActivate() })
  }
}

async function doActivate() {
  const name = document.getElementById('input-name').value.trim()
  const code = document.getElementById('input-code').value.trim()
  const btn   = document.getElementById('btn-activate')
  const err   = document.getElementById('error-msg')

  if (!name || !code) {
    err.textContent = 'Rellena el nombre y el código de centro.'
    err.style.display = 'block'
    return
  }

  btn.disabled = true
  btn.textContent = 'Activando…'
  err.style.display = 'none'

  const result = await chrome.runtime.sendMessage({ type: 'activate', code, name })
  if (result.ok) {
    location.reload()
  } else {
    err.textContent = result.error || 'Error desconocido'
    err.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Activar'
  }
}

init()

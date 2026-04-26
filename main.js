'use strict'

const { app, BrowserWindow, session, ipcMain, nativeImage, desktopCapturer } = require('electron')
const path = require('path')
const proxy = require('./src/socks-proxy')
const activation = require('./src/activation')
const telemetry = require('./src/telemetry')
const rtc = require('./src/rtc')

app.setName('PenwinSafe')

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

let mainWindow = null

async function createWindow() {
  await proxy.start()

  // Set dock icon (macOS)
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'))
  if (process.platform === 'darwin') app.dock.setIcon(icon)

  await session.defaultSession.setProxy({
    proxyRules: `socks5://${proxy.PROXY_HOST}:${proxy.PROXY_PORT}`
  })

  // Auto-grant screen capture for WebRTC live view
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] })
      console.log('[rtc] desktopCapturer sources:', sources.map(s => s.name))
      if (sources.length > 0) callback({ video: sources[0] })
      else callback({})
    } catch (e) {
      console.error('[rtc] desktopCapturer error:', e.message)
      callback({})
    }
  })

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'PenwinSafe',
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      devTools: true
    }
  })

  mainWindow.webContents.on('context-menu', (e) => e.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.setMenu(null)

  mainWindow.loadFile('renderer/index.html')

  mainWindow.webContents.once('did-finish-load', () => {
    rtc.init(mainWindow)
  })
}

// IPC: check activation state
ipcMain.handle('check-activation', () => {
  return {
    activated: activation.isActivated(),
    ...activation.loadActivation()
  }
})

// IPC: activate device with center code
ipcMain.handle('activate', async (_, code, name) => {
  const result = await activation.activate(code, name)
  if (result.ok) rtc.init(mainWindow)
  return result
})

// IPC: telemetry
ipcMain.handle('log-url',          (_, url, title)        => telemetry.logUrl(url, title))
ipcMain.handle('log-search',       (_, query, url)         => telemetry.logSearch(query, url))
ipcMain.handle('log-blocked',      (_, url, reason, query) => telemetry.logBlocked(url, reason, query))
ipcMain.handle('get-filter-config',()                      => telemetry.getFilterConfig())

// IPC: WebRTC signaling
ipcMain.on('rtc-answer', (_, sessionId, answerSdp) => rtc.submitAnswer(sessionId, answerSdp))

// Heartbeat every 30s while app is running
setInterval(() => telemetry.heartbeat(), 30000)
telemetry.heartbeat()

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

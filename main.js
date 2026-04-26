'use strict'

const { app, BrowserWindow, session, ipcMain, nativeImage } = require('electron')
const path = require('path')
const proxy = require('./src/socks-proxy')
const activation = require('./src/activation')
const telemetry = require('./src/telemetry')

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
      devTools: false
    }
  })

  mainWindow.webContents.on('context-menu', (e) => e.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.setMenu(null)

  mainWindow.loadFile('renderer/index.html')
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
  return await activation.activate(code, name)
})

// IPC: telemetry
ipcMain.handle('log-url',     (_, url, title)         => telemetry.logUrl(url, title))
ipcMain.handle('log-search',  (_, query, url)          => telemetry.logSearch(query, url))
ipcMain.handle('log-blocked', (_, url, reason, query)  => telemetry.logBlocked(url, reason, query))

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

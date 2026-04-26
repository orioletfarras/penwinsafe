'use strict'

const { app, BrowserWindow, session, ipcMain } = require('electron')
const path = require('path')
const proxy = require('./src/socks-proxy')

// Disable GPU sandbox issues and enforce single instance
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

let mainWindow = null

async function createWindow() {
  await proxy.start()

  // Apply SOCKS5 proxy to ALL sessions — DNS resolved via CleanBrowsing DoH
  await session.defaultSession.setProxy({
    proxyRules: `socks5://${proxy.PROXY_HOST}:${proxy.PROXY_PORT}`
  })

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'PenwinSafe',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      // Disable DevTools access for end users
      devTools: false
    }
  })

  // Block context menu to prevent "Inspect Element"
  mainWindow.webContents.on('context-menu', (e) => e.preventDefault())

  // Prevent opening new windows / popups
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.loadFile('renderer/index.html')

  // Remove menu bar (hides File/Edit/View/etc.)
  mainWindow.setMenu(null)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

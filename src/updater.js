'use strict'

const { autoUpdater } = require('electron-updater')
const { ipcMain }     = require('electron')

let mainWin = null

autoUpdater.autoDownload    = true   // download silently in background
autoUpdater.autoInstallOnAppQuit = true  // install when user quits

autoUpdater.on('checking-for-update', () => {
  console.log('[updater] checking for update...')
})

autoUpdater.on('update-available', info => {
  console.log('[updater] update available:', info.version)
  mainWin?.webContents.send('update-available', info.version)
})

autoUpdater.on('update-not-available', () => {
  console.log('[updater] up to date')
})

autoUpdater.on('download-progress', progress => {
  const pct = Math.round(progress.percent)
  console.log(`[updater] downloading... ${pct}%`)
  mainWin?.webContents.send('update-progress', pct)
})

autoUpdater.on('update-downloaded', info => {
  console.log('[updater] update downloaded:', info.version)
  mainWin?.webContents.send('update-downloaded', info.version)
})

autoUpdater.on('error', err => {
  console.error('[updater] error:', err.message)
})

// IPC: renderer asks to install now and restart
ipcMain.on('update-install-now', () => {
  autoUpdater.quitAndInstall()
})

function init(win) {
  mainWin = win
  // Check on startup (delay 10s to let app finish loading)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(e => console.warn('[updater]', e.message))
  }, 10000)

  // Re-check every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 4 * 60 * 60 * 1000)
}

module.exports = { init }

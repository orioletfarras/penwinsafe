'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('penwinsafe', {
  // Activation
  checkActivation: () => ipcRenderer.invoke('check-activation'),
  activate: (code, name) => ipcRenderer.invoke('activate', code, name),

  // Telemetry
  logUrl:          (url, title)        => ipcRenderer.invoke('log-url', url, title),
  logSearch:       (query, url)         => ipcRenderer.invoke('log-search', query, url),
  logBlocked:      (url, reason, query) => ipcRenderer.invoke('log-blocked', url, reason, query),
  getFilterConfig: ()                   => ipcRenderer.invoke('get-filter-config'),

  // Browser navigation
  navigate: (url) => ipcRenderer.send('navigate', url),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  reload: () => ipcRenderer.send('reload'),
  onUrlChange: (cb) => ipcRenderer.on('url-changed', (_, url) => cb(url)),
  onTitleChange: (cb) => ipcRenderer.on('title-changed', (_, title) => cb(title)),
  onLoadingChange: (cb) => ipcRenderer.on('loading-changed', (_, loading) => cb(loading))
})

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getPreloadPath: () => ipcRenderer.sendSync('get-preload-path')
});
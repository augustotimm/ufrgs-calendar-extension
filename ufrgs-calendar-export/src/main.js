const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require("fs");
const { parsePDF } = require( './pdfParser/index.js');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 780,
    height: 480,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  // win.webContents.openDevTools()
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}


app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()
})

ipcMain.on("open-file-dialog", (_event) => {
  dialog
      .showOpenDialog({
        properties: ["openFile"],
      })
      .then((result) => {
        if (!result.canceled) {
          const filePath = result.filePaths[0];
          // ipcRenderer.send("file-updated", filePath);
          win.webContents.send("file-updated", filePath);
        }
      })
      .catch((err) => {
        console.log(err);
      });
});

ipcMain.on("save-file-dialog", (event, filePath, firstWord, separator, lastWord) => {
  dialog
      .showSaveDialog({
        properties: ["createDirectory"],
      })
      .then((result) => {
        console.log('saved')
        if (!result.canceled) {
          console.log('saved result')
          parsePDF(filePath, firstWord, separator, lastWord).then(calendar => {
            fs.writeFileSync(result.filePath+ ".ics", calendar.toString(), "utf-8");
            dialog.showMessageBox([ {
              type: 'info',
              buttons: ['OK'],
              defaultId: 2,
              title: 'Arquivo criado com sucesso',
              detail: `Arquivo criado com sucesso: ${result.filePath}`,
            }])        });
        }
      })
      .catch((err) => {
        console.log(err);
      });
});

// make sure this listener is set before your renderer.js code is called
ipcMain.on('get-preload-path', (e) => {
    e.returnValue = WINDOW_PRELOAD_WEBPACK_ENTRY;
});
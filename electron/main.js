import { app, BrowserWindow, ipcMain, dialog } from 'electron/main'
import path from 'node:path'
import fs from "fs";
import { parsePDF } from './pdfParser/index.js';

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
  win.loadFile("index.html");
}


app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()
})

ipcMain.on("open-file-dialog", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
    })
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, "utf-8");
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
        parsePDF(filePath,filePath, separator, lastWord).then(calendar => {
          fs.writeFileSync(result.filePath+ ".ics", calendar.toString(), "utf-8");
          dialog.showMessageBox([ {
            type: 'info',
            buttons: ['OK'],
            defaultId: 2,
            title: 'Arquivo criado com sucesso',
            detail: `Arquivo criado com sucesso: ${filePath}`,
          }])        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
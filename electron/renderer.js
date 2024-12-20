const { ipcRenderer } = require("electron");

const openBtn = document.getElementById("openBtn");
const startBtn = document.getElementById("startButton");
const filePathText = document.getElementById("filePathText");
const firstWordText = document.getElementById("firstWordText");
const separatorText = document.getElementById("separatorText");
const lastWordText = document.getElementById("lastWordText");

openBtn.addEventListener("click", () => {
    console.log("clicked");
  ipcRenderer.send("open-file-dialog");
});

startBtn.addEventListener("click", () => {

  ipcRenderer.send("save-file-dialog", filePathText.value, firstWordText.value, separatorText.value, lastWordText.value);
})

ipcRenderer.on("file-updated", (event, filePath, fileContent) => {
    filePathText.value = filePath
    console.log("open file");
});
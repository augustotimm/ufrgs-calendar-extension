const { ipcRenderer } = require("electron");

const openBtn = document.getElementById("openBtn");
const filePathText = document.getElementById("filePathText");

openBtn.addEventListener("click", () => {
    console.log("clicked");
  ipcRenderer.send("open-file-dialog");
});


ipcRenderer.on("file-updated", (event, filePath, fileContent) => {
    filePathText.value = filePath
    console.log("open file");
});
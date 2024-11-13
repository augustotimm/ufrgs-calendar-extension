const { ipcRenderer } = require("electron");

const openBtn = document.getElementById("openBtn");
openBtn.addEventListener("click", () => {
    console.log("clicked");
  ipcRenderer.send("open-file-dialog");
});

ipcRenderer.on("open-file", (event, filePath, fileContent) => {
    console.log("open file");
});
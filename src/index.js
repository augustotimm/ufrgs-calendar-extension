import { PdfReader, TableParser } from "pdfreader";
const filename = "/home/timm/repos/ufrgs-calendar-extension/files/calendario 24.pdf";
const nbCols = 2;
const cellPadding = 80;
const columnQuantitizer = (item) => parseFloat(item.x) >= 9;
// polyfill for String.prototype.padEnd()
// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String(padString || " ");
        if (this.length > targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0, targetLength);
        }
    };
}
const mergeCells = (cells) => (cells || []).map((cell) => cell.text).join("");
const formatMergedCell = (mergedCell) =>
    mergedCell.substr(0, cellPadding).padEnd(cellPadding, " ");
const renderMatrix = (matrix) =>
    (matrix || [])
        .map(
            (row, y) =>
                row
                    .map(mergeCells)
        )
var table = new TableParser();
const pagesTable = []
const pdfReader = new PdfReader();
pdfReader.parseFileItems(filename, function (err, item) {
    if (err) console.error(err);
    else if (!item || item.page) {
        // end of file, or page
        const formattedMatrix = renderMatrix(table.getMatrix())
        pagesTable.push(formattedMatrix)
        item?.page && console.log("PAGE:", item.page);
        table = new TableParser(); // new/clear table for next page
    } else if (item.text) {
        // accumulate text items into rows object, per line
        if(item.text === "CONCURSO VESTIBULAR 2024") {
        }
        table.processItem(item, columnQuantitizer(item));
    }

});

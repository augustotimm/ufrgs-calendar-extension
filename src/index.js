import { PdfReader, TableParser } from "pdfreader";
import {createCalendarFromContents} from "./calendarManager.js";
const filename = "/Users/i752054/Documents/Repos/ufrgs-calendar-extension/files/calendario 24.pdf";
const columnQuantitizer = (item) => parseFloat(item.x) >= 9;

const mergeCells = (cells) => (cells || []).map((cell) => cell.text).join("");


function extractMatrixFromPDF() {
    var table = new TableParser();
    const pagesTable = []
    const pdfReader = new PdfReader();
    pdfReader.parseFileItems(filename, function (err, item) {
        if (err) console.error(err);
        else if (!item || item.page) {
            // end of file, or page
            const formattedMatrix = table.getMatrix().map((matrix) => {
                return matrix.map(mergeCells)
            })
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
}

extractMatrixFromPDF()
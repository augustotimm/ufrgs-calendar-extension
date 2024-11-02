import {PdfReader, TableParser} from "pdfreader";
import {StateMachine} from "./stateMachine.js";

const tableStarterPhrase = "Primeiro Período Letivo de";

const ignoreString = "Segundo Período Letivo de 2024";
const defaultPath = "/Users/i752054/Documents/Repos/ufrgs-calendar-extension/files/calendario 24.pdf"

const columnSeparator = (item) => parseFloat(item.x) >= 9;

const mergeCells = (cells) => (cells || []).map((cell) => cell.text).join("");



async function extractMatrixFromPDF(filepath) {
    const extractedContent = [];
    var table = new TableParser();
    const pdfReader = new PdfReader();
    return new Promise((resolve, reject) => {
        pdfReader.parseFileItems(filepath, function (err, item) {
            if (err) {
                console.error(err);
                reject(err);
            }
            if(!item) {
                resolve(extractedContent);
                return;
            }

            if (item.page) {
                // end of file, or page
                const formattedMatrix = table.getMatrix().map((matrix) => {
                    return matrix.map(mergeCells);
                });
                extractedContent.push(...formattedMatrix);
                item?.page && console.log("PAGE:", item.page);
                table = new TableParser(); // new/clear table for next page
            } else if (item.text) {
                // accumulate text items into rows object, per line
                table.processItem(item, columnSeparator(item));
            }

        });
    });
}

/*
    {
        dateString: string,
        eventString: string, // event name
    }
*/
export async function extractDataFromPDF(filepath, firstWord = tableStarterPhrase, lastWord = undefined, separator = ignoreString){
    const extractedContent = await extractMatrixFromPDF(defaultPath);
    const stateMachine = new StateMachine();
    return stateMachine.run(extractedContent, firstWord, undefined, separator);

}
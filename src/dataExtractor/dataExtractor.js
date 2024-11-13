import {PdfReader, TableParser} from "pdfreader";
import {StateMachine} from "./stateMachine.js";

const tableStarterPhrase = "Primeiro Período Letivo de";

const ignoreString = "Segundo Período letivo de";
const defaultPath = "/Users/i752054/Documents/Repos/ufrgs-calendar-extension/files/portaria.pdf"
let secondRowX = 99;
let firstRowX = 0;
let extractX = false;
const columnSeparator = (item) => parseFloat(item.x) >= secondRowX;

const mergeCells = (cells) => (cells || []).map((cell) => cell.text).join("");



async function extractMatrixFromPDF(filepath, firstWord) {
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
                const formattedMatrix = table.getMatrix().map((matrix) => {
                    return matrix.map(mergeCells);
                });
                if(formattedMatrix.length > 0) {
                    extractedContent.push(formattedMatrix);
                }
                resolve(extractedContent);
                return;
            }

            if (item.page) {
                // end of file, or page
                const formattedMatrix = table.getMatrix().map((matrix) => {
                    return matrix.map(mergeCells);
                });
                if(formattedMatrix.length > 0) {
                    extractedContent.push(formattedMatrix);
                }
                
                item?.page && console.log("PAGE:", item.page);
                table = new TableParser(); // new/clear table for next page
            } else if (item.text) {
                // accumulate text items into rows object, per line
                if(extractX) {
                    if(firstRowX < item.x) {
                        if(firstRowX === 0) {
                            firstRowX = Math.ceil(item.x)
                        } else {
                            secondRowX = Math.floor(item.x)
                            extractX = false;
                        }
                    }
                } else {
                    extractX = item.text.toLowerCase().includes(firstWord.toLowerCase());
                }
                if(item.text.includes("Documento gerado sob autenticação")) {
                    console.log("rodapé")
                }
                if(item.y < 47){
                    table.processItem(item, columnSeparator(item));
                }
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
    const extractedContent = await extractMatrixFromPDF(defaultPath, firstWord);
    const stateMachine = new StateMachine();
    return stateMachine.run(extractedContent, firstWord, undefined, separator);

}
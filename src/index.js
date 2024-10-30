import { PdfReader, TableParser } from "pdfreader";
import {createCalendarFromContents} from "./calendarManager.js";
const filename = "/Users/i752054/Documents/Repos/ufrgs-calendar-extension/files/calendario 24.pdf";
const tableStarterPhrase = "Primeiro Período Letivo de"

const ignoreString = "Segundo Período Letivo de 2024"
const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4},?.* [a|à]s?($| partir))");
const startWithCapitalLetter = new RegExp("^[A-Z]+.*")

const columnQuantitizer = (item) => parseFloat(item.x) >= 9;

const mergeCells = (cells) => (cells || []).map((cell) => cell.text).join("");

const extractedContent = []

function testAndAppend(start, value){
    if(start){
       return start + " " + value;
    } else {
        return  value
    }
}

async function extractMatrixFromPDF() {
    var table = new TableParser();
    const pdfReader = new PdfReader();
    return new Promise((resolve, reject) => {
        pdfReader.parseFileItems(filename, function (err, item) {
            if (err) {
                console.error(err);
                reject(err);
            }
            if(!item) {
                resolve(item);
                return;
            }

            if (item.page) {
                // end of file, or page
                const formattedMatrix = table.getMatrix().map((matrix) => {
                    return matrix.map(mergeCells)
                })
                extractedContent.push(...formattedMatrix)
                item?.page && console.log("PAGE:", item.page);
                table = new TableParser(); // new/clear table for next page
            } else if (item.text) {
                // accumulate text items into rows object, per line
                table.processItem(item, columnQuantitizer(item));
            }

        });
    })
}

/*
    {
        dateString: string,
        eventString: string, // event name
    }
*/
const stateVariables = {
    missingDate: false,
    missingEvent: false,
    postAppend: false,
}
let state = "default"
const stateFunctions = {
    default: (row, lastEntry) => {
        if(!row[1] && row[0]){
            stateVariables.missingDate = true;
            return {
                eventString: row[0],
            };
        }
        const dateMatch = dateRegexp.test(row[1]);
        const incompleteDate = incompleteDateRegexp.test(row[1]);

        if(incompleteDate){
            stateVariables.missingDate = true
            stateVariables.missingEvent = !row[0];

            return {
                eventString: row[0],
                dateString: row[1]
            };
        }

        if(dateMatch) {

            stateVariables.missingEvent = !row[0];

            return {
                eventString: row[0],
                dateString: row[1]
            };
        }
    },

    missingEvent: (row, lastEntry) => {
        if(row[0]) {
            stateVariables.missingEvent = false;
            lastEntry.eventString = row[0];
        }
        if(row[1]) {
            lastEntry.dateString = testAndAppend(lastEntry.dateString, row[1]);
        }
    },
    missingDate: (row, lastEntry) => {
        if(row[0]) {
            lastEntry.eventString = testAndAppend(lastEntry.eventString, row[0]);
        }
        if(row[1]) {

            stateVariables.postAppend = true
            stateVariables.missingDate = incompleteDateRegexp.test(row[1]);


            lastEntry.dateString = testAndAppend(lastEntry.dateString, row[1]);
        }
    },
    postAppend: (row, lastEntry) => {
        if(!row[1] && row[0]){
            stateVariables.postAppend = false;
            lastEntry.eventString = testAndAppend(lastEntry.eventString, row[0]);
            return;

        }
        const dateMatch = dateRegexp.test(row[1]);
        const incompleteDate = incompleteDateRegexp.test(row[1]);

        if(incompleteDate){
            stateVariables.postAppend = false;
            lastEntry.dateString = testAndAppend(lastEntry.dateString, row[1]);
            lastEntry.eventString = testAndAppend(lastEntry.eventString, row[0]);

        }
        if(dateMatch) {
            stateVariables.postAppend = false;
            if(!row[0]){
                lastEntry.dateString = row[1]
                return
            }
            else {
                return {
                    eventString: row[1],
                    dateString: row[0]
                };
            }

        } else{
            stateVariables.postAppend = false;
            lastEntry.dateString = testAndAppend(lastEntry.dateString, row[1]);
            lastEntry.eventString = testAndAppend(lastEntry.eventString, row[0]);
        }
    }
}
function calculateState() {
    if(stateVariables.missingEvent) {
        state = "missingEvent"
    }
    if(stateVariables.missingDate) {
        state = "missingDate"
    }
    if(stateVariables.postAppend){
        state = "postAppend"
    }

    if(
           !stateVariables.missingEvent
        && !stateVariables.missingDate
        && !stateVariables.postAppend
    ) {
        state = "default"
    }
}
function restartStateMachine(){
    stateVariables.missingEvent = false;
    stateVariables.missingDate = false;
    stateVariables.postAppend = false;
    state = "default"
}

function organizeMatrixContent() {
    let startedUsefulTable = false

    const finalContent = []
    extractedContent.forEach((row, index) => {
        if(!startedUsefulTable ){
            startedUsefulTable = row.reduce((acc, curr ) => acc || curr.includes(tableStarterPhrase), false);
        }
        else {
            if(row[1]?.includes("13/03/2024")){
                console.log("includs")
            }
            if(row[0] !== "Segundo Período Letivo de 2024"){
                const result = stateFunctions[state](row, finalContent[finalContent.length - 1])

                if(result){
                    finalContent.push(result);
                }
                calculateState()
            } else {
                restartStateMachine()
                console.log("ignore")
            }

        }
    })

    return finalContent;

}

await extractMatrixFromPDF()
restartStateMachine()
const result = organizeMatrixContent()

console.log(result)
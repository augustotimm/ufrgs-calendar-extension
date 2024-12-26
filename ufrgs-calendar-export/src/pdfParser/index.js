const { createCalendar } = require("./calendarManager.js");
const {extractDataFromPDF} = require("./dataExtractor/dataExtractor.js");
const { parseDateString } = require("./dateParser.js");

const DESCRIPTION_SIZE = 24



export async function parsePDF(filePath, firstWord = undefined, separator = undefined, lastWord = undefined) {
    const eventsFromPDF = await extractDataFromPDF(filePath,firstWord, lastWord, separator );
    const result = eventsFromPDF.map((event) => {
        try{
            if(event.eventString.toLowerCase().includes("matrícula de calouros")){
                console.log("watch")
            }
            const resulting = parseDateString(event)
            if(!resulting){
                return event.dateString
            }
            delete resulting.dateString;
            resulting.eventString = event.eventString;
            let summary;
            const splitString = event.eventString.split(":");
            if(splitString.length === 1) {
                summary = event.eventString.slice(0, DESCRIPTION_SIZE);
            } else {
                summary = splitString[0];
            }
            resulting.summary = summary;
            return  resulting;
        } catch(e) {
            console.log(e)
        }


    }).filter(function( element ) {
        return element !== undefined;
    });

    const calendar = createCalendar(result);
    return calendar;
    
}

// await parsePDF("/Users/i752054/Downloads/Portaria-Nº-7642-de-18.11.2024.pdf")

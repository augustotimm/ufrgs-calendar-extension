import { createCalendar } from "./calendarManager.js";
import {extractDataFromPDF} from "./dataExtractor/dataExtractor.js";import { parseDateString } from "./dateParser.js";

const DESCRIPTION_SIZE = 24



export async function parsePDF(filePath, firstWord, separator, lastWord) {
    const eventsFromPDF = await extractDataFromPDF(filePath,firstWord, separator, lastWord );
    const result = eventsFromPDF.map((event) => {
        try{
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

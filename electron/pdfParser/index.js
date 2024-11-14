import { createCalendar } from "./calendarManager.js";
import {extractDataFromPDF} from "./dataExtractor/dataExtractor.js";import { parseDateString } from "./dateParser.js";

const DESCRIPTION_SIZE = 24



export async function parsePDF() {
    const eventsFromPDF = await extractDataFromPDF();
    const result = eventsFromPDF.map((event) => {
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
    })
    const calendar = createCalendar(result);
    return calendar;
    
}

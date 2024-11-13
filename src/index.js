import { createCalendar } from "./calendarManager.js";
import {extractDataFromPDF} from "./dataExtractor/dataExtractor.js";import { parseDateString } from "./dateParser.js";

const DESCRIPTION_SIZE = 24
const eventsFromPDF = await extractDataFromPDF();
const testString = "05/03/2024, a partir das 9h, a 06/03/2024 às 23h59min";
const getDateRegexp = new RegExp("(\\d{1,2})\/(\\d{1,2})\/(\\d{4})", "g");
const dateHourRangeFormat1 = new RegExp("(\\d{1,2}\/\\d{1,2}\/\\d{2,4}), a partir das ([0-2]?[0-9])h, a[s]? (\\d{1,2}\/\\d{1,2}\/\\d{2,4}) [à|a][s]? ([0-2]?[0-9])h([0-5]?[0-9]?)", "gi")
import fs from "fs"
const resultingMatch = [...testString.matchAll(dateHourRangeFormat1)];


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
fs.writeFileSync('invitation.ics', calendar.toString());

console.log(result);
import ical, {ICalCalendarMethod} from "ical-generator";
import { parseDateString } from "./dateParser.js";



export const createCalendarFromContents = function(contentsList) {
    const calendar = ical({
        name: 'Exported UFRGS Calendar',
        prodId: {company: 'UFRGS student work', product: 'calendar export'},
        timezone: 'America/Sao_Paulo'
    });

// A method is required for outlook to display event as an invitation
    calendar.method(ICalCalendarMethod.REQUEST);

    contentsList.forEach((element) => {
        const parsedDate = parseDateString(element)
        calendar.createEvent({
            start: parsedDate[0],
            end: parsedDate[parsedDate.length - 1],
            summary: element.eventString,
        });
    })
    return calendar;

}


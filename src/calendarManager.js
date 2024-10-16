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
        if(parsedDate.dates.length > 0) {
            if(parsedDate.continuous){
                calendar.createEvent({
                    start: parsedDate.dates[0],
                    end: parsedDate[parsedDate.dates.length - 1],
                    summary: element.eventString,
                });
            }
            else {
                parsedDate.dates.forEach(date => {
                    calendar.createEvent({
                        start: date,
                        allDay: true,
                        summary: element.eventString,
                    });
                })
            }

        }
        else {
            calendar.createEvent({
                start: parsedDate.dates[0],
                allDay: true,
                summary: element.eventString,
            });
        }

    })
    return calendar;

}


const {ICalCalendarMethod, ical} = require( "ical-generator");



export const createCalendar = function(contentsList) {
    const calendar = ical({
        name: 'Exported UFRGS Calendar',
        prodId: {company: 'UFRGS student work', product: 'calendar export'},
        timezone: 'America/Sao_Paulo'
    });

// A method is required for outlook to display event as an invitation
    calendar.method(ICalCalendarMethod.REQUEST);

    contentsList.forEach((element) => {

        if(element.endDate) {
            calendar.createEvent({
                start: element.startDate,
                end: element.endDate,
                summary: element.summary,
                description: element.eventString
            });
        } else {
            calendar.createEvent({
                start: element.startDate,
                summary: element.summary,
                description: element.eventString
            });
        }
        
    });
    return calendar;

};


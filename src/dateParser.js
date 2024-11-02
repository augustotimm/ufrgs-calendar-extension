const singleDateRegexp = new RegExp("(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})", "g");

const containHoursRegexp = new RegExp("(\\d{1,2}h\\d{0,2}).*(\\d{1,2}h\\d{0,2})");

// const dateRangeRegexp = new RegExp("\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} (a|até) \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourStarRangeRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourEndRangeRegexp = new RegExp("às(\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourRangeSingleDateRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) às\\s*(\\d{1,2}h\\d{0,2})", "i");
const concatenatedDaysRegexp = new RegExp(".*(\\d{2}) e (\\d{2}\\/\\d{1,2}\\/\\d{2,4}$)");


const parseHourString = function(hourString) {
    const times = hourString.split('h');
    return {hour: parseInt(times[0]), minutes: parseInt(times[1]) || 0};
};

export const parseDateString = function({dateString}) {
    let date;
    const dates = [];
    const hours = [];
    let iterator = 0;
    let singleDate = false;
    let continuous = true;
    const containHour = containHoursRegexp.test(dateString);

    if(containHour) {
        let startHourObject;
        let endHourObject;
        if((date = hourRangeSingleDateRegexp.exec(dateString)) !== null) {
            startHourObject = parseHourString(date[1]);
            endHourObject = parseHourString(date[2]);
            singleDate = true;

        } else {
            const startHourString = hourStarRangeRegexp.exec(dateString);
            const endHourString = hourEndRangeRegexp.exec(dateString);

            startHourObject = parseHourString(startHourString[1]);
            endHourObject = parseHourString(endHourString[1]);
        }
        hours.push(startHourObject);
        hours.push(endHourObject);
    }
    while ((date = singleDateRegexp.exec(dateString)) !== null) {
        const dateParts = date[0].split('/');
        const concatenated = concatenatedDaysRegexp.exec(dateString);

        if(containHour) {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), hours[iterator].hour, hours[iterator].minutes));
            if(concatenated !== null) {
                continuous = false;
                dates.push(new Date(parseInt(concatenated[1]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), hours[iterator].hour, hours[iterator].minutes));
            }
        } else {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
            if(concatenated !== null) {
                continuous = false;
                dates.push(new Date(parseInt(concatenated[1]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
            }
        }

        iterator ++;
        if(singleDate) {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), hours[iterator].hour, hours[iterator].minutes));
        }

    }
    if( dates.length > 2) {
        console.log(dateString);
    }
    return {dates, continuous};
};


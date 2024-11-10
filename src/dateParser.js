const getDateRegexp = new RegExp("(\\d{1,2})\/(\\d{1,2})\/(\\d{4})", "g");


// const dateRangeRegexp = new RegExp("\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} (a|até) \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
// const hourStartRangeRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
// const hourEndRangeRegexp = new RegExp("às(\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");

const hourRangeSingleDateRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) às\\s*(\\d{1,2}h\\d{0,2})", "i");
const concatenatedDaysRegexp = new RegExp(".*(\\d{2}) e (\\d{2}\\/\\d{1,2}\\/\\d{2,4}$)");

const dateHourRangeFormat1 = new RegExp("(\\d{1,2}\/\\d{1,2}\/\\d{2,4}), a partir das ([0-2]?[0-9])h, a[s]? (\\d{1,2}\/\\d{1,2}\/\\d{2,4}) [à|a][s]? ([0-2]?[0-9])h([0-5]?[0-9]?)", "i")
const extractHours = new RegExp("([0-2]?[0-9])?h([0-5]?[0-9]?)", "gi")

const resetRegex = function() {
    hourRangeSingleDateRegexp.lastIndex = 0;
    concatenatedDaysRegexp.lastIndex = 0;
    dateHourRangeFormat1.lastIndex = 0;
    extractHours.lastIndex = 0;
    getDateRegexp.lastIndex = 0;
}



const getHoursString = function(dateTimeString) {
    const timeStringArray = [...dateTimeString.matchAll(extractHours)];
    const timeArray = [];
    timeStringArray.map((matchingArray) => {
        const newTime = {
            minutes: null
        };
        newTime.hours = parseInt(matchingArray[1]);
        if(matchingArray.length === 3 && matchingArray[2] !== '') {
            newTime.minutes = parseInt(matchingArray[2])
        }
        timeArray.push(newTime);
    })

    timeArray.sort((a,b) => a.hours - b.hours);
    return timeArray
};

const getdatesFromDateTimeRangeFromString = function(dateTimeRangeString) {
    let resultingDAte = {
        startDate: null,
        endDate: null,
        dateString: dateTimeRangeString

    };
    let dateMatchArray = null;
    if((dateMatchArray = dateHourRangeFormat1.exec(dateTimeRangeString)) !== null) {
        const splitStartDate = dateMatchArray[0].split('/');
        resultingDAte.startDate = new Date(parseInt(splitStartDate[2]), parseInt(splitStartDate[1]), parseInt(splitStartDate[0]), parseInt(dateMatchArray[1]))
        const splitEndDate = dateMatchArray[2].split('/');
        resultingDAte.endDate = new Date(parseInt(splitEndDate[2]), parseInt(splitEndDate[1]), parseInt(splitEndDate[0]), parseInt(dateMatchArray[3]), parseInt(dateMatchArray[4]))

        return resultingDAte;
    }
}

const getDateTimeFromString = function(dateTimeString) {
    const hours = getHoursString(dateTimeString);
    const dateMatch = getDateRegexp.exec(dateTimeString);
    const startDate = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]), parseInt(dateMatch[1]), hours[0].hours, hours[0].minutes);
    let endDate = undefined;
    if(hours.length > 1) {
        endDate = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]), parseInt(dateMatch[1]), hours[1].hours, hours[1].minutes);
    }

    return {
        startDate,
        endDate,
        dateString: dateTimeString
    };
}
const getDateFromString = function(dateString) {
    const dateMatch = [...dateString.matchAll(getDateRegexp)];
    const startDate = new Date(parseInt(dateMatch[0][3]), parseInt(dateMatch[0][2]), parseInt(dateMatch[0][1]))
    let endDate = undefined;
    if(dateMatch.length > 1) {
        endDate = new Date(parseInt(dateMatch[1][3]), parseInt(dateMatch[1][2]), parseInt(dateMatch[1][1]))
    }
    return {
        startDate,
        endDate,
        dateString
    };
}

export const parseDateString = function({dateString}) {
    let date;
    resetRegex();
    const containHour = extractHours.test(dateString);
    extractHours.lastIndex = 0
    if(dateString === "13/03/2024 às 4h") {
        console.log("keepwatch")
    }

    if(containHour) {
        let startHourObject;
        let endHourObject;
        date = [...dateString.matchAll(getDateRegexp)];
        getDateRegexp.lastIndex = 0;
        if(date && date.length === 1) {
            const result =  getDateTimeFromString(dateString);
            return result;

        } else {
            return getdatesFromDateTimeRangeFromString(dateString);
        }
    } else {
        const concatenatedMatch = concatenatedDaysRegexp.exec(dateString)
        if(concatenatedMatch) {
            const splitDate = concatenatedMatch[2].split('/');
            const startDate = new Date(parseInt(splitDate[2]), parseInt(splitDate[1]), parseInt(concatenatedMatch[1]));
            return {
                startDate,
                endDate: new Date(parseInt(splitDate[2]), parseInt(splitDate[1]), parseInt(splitDate[0])),
                dateString
            }
        }
        return getDateFromString((dateString));
    }
   
};


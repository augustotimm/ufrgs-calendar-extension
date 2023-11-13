import { PdfReader, Rule} from "pdfreader";
const content = [];

const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} [a|à]s*)");
const singleDateRegexp = new RegExp("(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})", "g");

const containHoursRegexp = new RegExp("(\\d{1,2}h\\d{0,2}).*(\\d{1,2}h\\d{0,2})");

// const dateRangeRegexp = new RegExp("\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} (a|até) \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourStarRangeRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourEndRangeRegexp = new RegExp("às(\\d{1,2}h\\d{0,2}) de \\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "i");
const hourRangeSingleDateRegexp = new RegExp("das (\\d{1,2}h\\d{0,2}) às\\s*(\\d{1,2}h\\d{0,2})", "i");


const contentType = {
    DATE_HEAD: "dateHead",
    DATE_APPENDIX: "dateAppendix",
    EVENT: "event"
}

const addParsedContent = function (text, type) {
    switch (type) {
        case contentType.DATE_APPENDIX:
            content[content.length - 1].dateString += text;
            return;
        case contentType.DATE_HEAD:
            content.push({dateString: text, eventString: ""});
            return;
        case contentType.EVENT:
            content[content.length - 1].eventString += text;
            return;
        default:
            console.log("add parsed content type error");
            break;
    }
}

const parseHourString = function(hourString) {
    const times = hourString.split('h');
    return {hour: parseInt(times[0]), minutes: parseInt(times[1]) || 0}
}

const parseDateString = function({dateString}) {
    let date;
    const dates = [];
    const hours = [];
    let iterator = 0;
    let singleDate = false;
    const containHour = containHoursRegexp.test(dateString);

    if(containHour) {
        let startHourObject;
        let endHourObject
        if((date = hourRangeSingleDateRegexp.exec(dateString)) !== null) {
            startHourObject = parseHourString(date[1]);
            endHourObject = parseHourString(date[2]);
            singleDate = true;

        } else {
            const startHourString = hourStarRangeRegexp.exec(dateString);
            const endHourString = hourEndRangeRegexp.exec(dateString);

            startHourObject = parseHourString(startHourString[1])
            endHourObject = parseHourString(endHourString[1])
        }
        hours.push(startHourObject);
        hours.push(endHourObject);
    }
    while ((date = singleDateRegexp.exec(dateString)) !== null) {
        const dateParts = date[0].split('/')
        if(containHour) {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), hours[iterator].hour, hours[iterator].minutes));

        } else {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
        }

        iterator ++;
        if(singleDate) {
            dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), hours[iterator].hour, hours[iterator].minutes));

        }
    }
    if( dates.length > 2) {
        console.log(dateString);
    }
    return dates;
}


const res = new Promise((resolve, reject) => {
    const rules = [
        Rule.on(/^PRIMEIRO PERÍODO LETIVO DE 2022 \(2022\/1\)$/)
            .parseTable(3)
            .then((table) => {
                    let dateAppendix = false;

                    table.items.map(function (element) {
                        const dateMatch = dateRegexp.test(element.text);

                        if (incompleteDateRegexp.test(element.text) && !dateMatch) {
                            dateAppendix = true;
                            addParsedContent(element.text, contentType.DATE_HEAD);
                            return;
                        }

                        if (dateMatch && dateAppendix) {
                            dateAppendix = false;
                            addParsedContent(element.text, contentType.DATE_APPENDIX);
                            return;
                        }
                        if(dateMatch) {
                            addParsedContent(element.text, contentType.DATE_HEAD);
                            return;
                        }

                        content[content.length - 1].eventString += element.text;
                        return;
                    })
                }
                // content.push({
                //     "parseTable.renderMatrix": parseTable.renderMatrix(
                //         table.matrix
                //     ),
                //     "parseTable.renderItems": parseTable.renderItems(table.items),
                // })
            ),
    ]
    const processItem = Rule.makeItemProcessor(rules);
    new PdfReader().parseFileItems("/home/augusto/repos/ufrgs-calendar-extension/files/portaria.pdf", (err, item) => {
        if (err) reject(err);
        else {
            processItem(item);
            if (!item) resolve(content);
        }
    });
})
await res;
const parsedDates = content.map(parseDateString)
console.log(parsedDates)
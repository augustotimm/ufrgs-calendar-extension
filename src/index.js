import { PdfReader, Rule} from "pdfreader";
import {createCalendarFromContents} from "./calendarManager.js";
import {sendCalendarMessage} from "./mailer.js";
import fs from'node:fs';


const content = [];

const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} [a|à]s*)");

const contentType = {
    DATE_HEAD: "dateHead",
    DATE_APPENDIX: "dateAppendix",
    EVENT: "event"
}
/*
    {
        dateString: string,
        eventString: string, // event name
    }

 */

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


const res = new Promise((resolve, reject) => {
    const rules = [
        Rule.on(/^Primeiro Período Letivo de 2024$/)
            .parseTable(3)
            .then((table) => {
                    let dateAppendix = false;
                    let isValidContent = false

                    table.items.map(function (element) {
                        const dateMatch = dateRegexp.test(element.text);

                        if (incompleteDateRegexp.test(element.text) && !dateMatch) {
                            dateAppendix = true;
                            isValidContent = true
                            addParsedContent(element.text, contentType.DATE_HEAD);
                            return;
                        }

                        if (dateMatch && dateAppendix) {
                            dateAppendix = false;
                            isValidContent = true
                            addParsedContent(element.text, contentType.DATE_APPENDIX);
                            return;
                        }
                        if(dateMatch) {
                            isValidContent = true
                            addParsedContent(element.text, contentType.DATE_HEAD);
                            return;
                        }

                        if(isValidContent) {
                            content[content.length - 1].eventString += element.text;
                        }
                        return;
                    })
                }
            ),
    ]
    const processItem = Rule.makeItemProcessor(rules);
    new PdfReader().parseFileItems("/home/timm/repos/ufrgs-calendar-extension/files/calendario 24.pdf", (err, item) => {
        if (err) reject(err);
        else {
            processItem(item);
            if (!item) resolve(content);
        }
    });
})
await res;

let calendar = createCalendarFromContents(content);

try {
    fs.writeFileSync('invitation.ics', calendar.toString());
    // file written successfully
} catch (err) {
    console.error(err);
}

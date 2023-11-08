import { PdfReader, Rule, parseTable} from "pdfreader";
const content = [];

const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)")
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} [a|à]s*)")
const singleDateRegexp = new RegExp("\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", "g")

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

const parseDateString = function(event) {
    let date;
    const dates = [];

    while ((date = singleDateRegexp.exec(event.dateString)) !== null) {
        console.log(`Found ${date[0]}. Next starts at ${singleDateRegexp.lastIndex}.`);
        const dateParts = date[0].split('/')
        dates.push(new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
        // Expected output: "Found foo. Next starts at 9."
        // Expected output: "Found foo. Next starts at 19."
    }
    return dates;
}


const res = new Promise((resolve, reject) => {
    const rules = [
        Rule.on(/^PRIMEIRO PERÍODO LETIVO DE 2022 \(2022\/1\)$/)
            .parseTable(3)
            .then((table) => {
                    let dateAppendix = false;

                    table.items.map(function (element, index) {
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
await res
parseDateString(content[0]);

console.log(content)
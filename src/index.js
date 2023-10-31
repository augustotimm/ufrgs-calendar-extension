import fs from "fs";
import { PdfReader, Rule, parseTable} from "pdfreader";
const content = [];



const res = new Promise((resolve, reject) => {
    const rules = [
        Rule.on(new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}.*)", "g"))
            .extractRegexpValues()
            .then((value) =>
                content.push({ extractRegexpValues: value })
            ),
        Rule.on(new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}.*)", "g"))
            .parseNextItemValue()
            .then((value) => content.push({ parseNextItemValue: value })),
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

console.log(content)
import { PdfReader, Rule, parseTable} from "pdfreader";
const content = [];



const res = new Promise((resolve, reject) => {
    const rules = [
        Rule.on(/^PRIMEIRO PERÍODO LETIVO DE 2022 \(2022\/1\)$/)
            .parseTable(3)
            .then((table) =>
                content.push({
                    "parseTable.renderMatrix": parseTable.renderMatrix(
                        table.matrix
                    ),
                    "parseTable.renderItems": parseTable.renderItems(table.items),
                })
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

console.log(content)
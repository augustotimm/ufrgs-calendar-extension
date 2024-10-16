import pdf2table from 'pdf2table'
import fs from 'fs'

const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\d{1,2}\/\d{1,2}\/\d{2,4} [a|à]*|a partir$)");

fs.readFile('/home/timm/repos/ufrgs-calendar-extension/files/calendario 24.pdf', function (err, buffer) {
    if (err) return console.log(err);

    let tableList = [];

    pdf2table.parse(buffer, function (err, rows, rowsdebug) {
        if(err) return console.log(err);

        tableList = rows;
    });
    const contents = []
    for(let i = 0; i < tableList.length; i++) {
        if(dateRegexp.test(tableList[i][0])) {
            let newContent = createContentFromRow(tableList[i]);
            if (incompleteDateRegexp.test(tableList[i][0])) {
                i++;
                const secondContent = createContentFromRow(tableList[i]);
                newContent = concatenateTableContent(newContent, secondContent);
            }
            contents.push(newContent);
        }

        // Skip row if no date
    }

});


function concatenateTableContent(content, secondContent) {
    return {
        dateString: content.dateString + ' ' + secondContent.dateString,
        eventString: content.eventString + ' ' + secondContent.eventString
    }
}

function createContentFromRow(row) {
    const dateString = tableList[i][0]
    tableList[i].shift();
    const eventString = tableList[i].join(' ');
    return {
        dateString,
        eventString,
    }
}
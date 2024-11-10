const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4},?.* [a|à]s?($| partir))");
const specialEventString = new RegExp("^(20\\d\\d\\/\\d{1,2}).$")
const specialEventStringFormat2 = new RegExp("\\d{2}\\/\\d{2}\\/\\d{4}\\)\\.?$");
const defaultLastWord = "PRIMEIRO PERÍODO"
export class StateMachine {
    END_STRING = "END";
    PENDING_STRING = "pendingString";
    MISSING_STRING = "missingEvent";
    DEFAULT = "default";
    POST_APPEND = "postAppend";
    MISSING_DATE = "missingDate";
    eventPosition = 0;
    datePosition = 1;
    firstEvent = false;

    state
    stateVariables = {
        missingDate: true,
        missingEvent: true,
        postAppend: true,
    }

    testSpecialEvent(text) {
        specialEventString.lastIndex = 0;
        specialEventStringFormat2.lastIndex = 0;
        return specialEventString.test(text) 
            || specialEventStringFormat2.test(text)
            || text.toLowerCase().includes("portaria")
    }

    calculateState() {
        if(
            this.stateVariables.missingEvent
            && this.stateVariables.missingDate
            && this.stateVariables.postAppend
        ) {
            if(this.state === this.PENDING_STRING) {
                this.state = this.PENDING_STRING
                return;
            }
            this.state = this.END_STRING;
            return;

        }
        if(this.stateVariables.missingEvent) {
            this.state = this.MISSING_STRING
            return
        }
        if(this.stateVariables.missingDate) {
            if(this.state === this.POST_APPEND) {
                this.state = this.DEFAULT
            } else {
                this.state = this.MISSING_DATE
            }
            return;
        }
        if(this.stateVariables.postAppend) {
            if(!this.stateVariables.missingDate && this.state === this.MISSING_DATE) {
                this.state = this.POST_APPEND;
                return;
            }
            if(this.state === this.default) {
                this.state === this.DEFAULT;
                return;
            }
        }

        if(
            !this.stateVariables.missingEvent
            && !this.stateVariables.missingDate
            && !this.stateVariables.postAppend
        ) {
            this.state = this.DEFAULT
            return;
        }
    }

    restartStateMachine(entry = false){
        this.stateVariables.missingEvent = entry;
        this.stateVariables.missingDate = entry;
        this.stateVariables.postAppend = entry;
    }

    testAndAppend(start, value){
        if(start){
            return start + " " + value;
        } else {
            return  value
        }
    }

    calculatePositions(row) {
        if(row[0]) {
            if(dateRegexp.test(row[0])) {
               this.eventPosition = 1;
               this.datePosition = 0;
            } else {
               this.eventPosition = 0;
               this.datePosition = 1;
            }
       } else {
           if(dateRegexp.test(row[1])) {
               this.eventPosition = 0;
               this.datePosition = 1;
            } else {
               this.eventPosition = 1;
               this.datePosition = 0;
            }
       }
    }

    run(extractedContent, firstWord, lastWord, semesterSeparator) {
        lastWord = lastWord? lastWord: defaultLastWord;
        const finalContent = []
        let index = 0
        let pageCount = 0;
        while(pageCount < extractedContent.length && this.state !== this.END_STRING){

            const page = extractedContent[pageCount]
            index = 0;
            pageCount ++;
            while(this.state !== this.END_STRING && index < (page.length ))
            {
                const row = page[index]
                index ++;
                if(this.firstEvent || (index === 0 && pageCount > 1)) {
                    this.calculatePositions(row)
                    this.firstEvent = false
                }

                const containsSeparator = row.reduce((acc, curr ) => acc || curr.toLowerCase().includes(semesterSeparator.toLowerCase()), false);

                if(!containsSeparator || this.state === this.PENDING_STRING){
                    if(row[this.eventPosition]?.includes("AMPLIAÇÃO DE VAGAS")){
                        console.log("KEEP EYE")
                    }
                    const result = this.stateFunctions[this.state](
                        row,
                        finalContent[finalContent.length - 1],
                        {firstWord, lastWord},
                    )
                    if(result){
                        finalContent.push(result);
                    }
                } else {
                    this.restartStateMachine()
                    this.firstEvent = true;
                    console.log("ignore")
                }
                this.calculateState();
            }
        }
        this.restartStateMachine(true);
        this.calculateState()

        return finalContent;

    }

    stateFunctions = {
        default: (row, lastEntry, {lastWord}) => {
            if((row[this.eventPosition] && row[this.eventPosition].includes(lastWord))
                || (row[this.datePosition] && row[this.datePosition].includes(lastWord))) {
                this.restartStateMachine(true);
                return false;
            }
            if(!row[this.datePosition] && row[this.eventPosition]){
                if(this.testSpecialEvent(row[this.eventPosition])) {
                    this.stateVariables.missingDate = false;
                    this.stateVariables.postAppend = true;
                    this.stateVariables.missingEvent = false;
                    lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
                    return;
                }
                else{
                    this.stateVariables.postAppend = false;
                    this.stateVariables.missingEvent = false;
                    this.stateVariables.missingDate = true;
                    return {
                        eventString: row[this.eventPosition],
                    };
                }
            }
            const dateMatch = dateRegexp.test(row[this.datePosition]);
            const incompleteDate = incompleteDateRegexp.test(row[this.datePosition]);

            if(incompleteDate){
                this.stateVariables.missingDate = true
                this.stateVariables.missingEvent = !row[this.eventPosition];

                return {
                    eventString: row[this.eventPosition],
                    dateString: row[this.datePosition]
                };
            }

            if(dateMatch) {
                this.stateVariables.missingDate = false;
                this.stateVariables.postAppend = false;
                this.stateVariables.missingEvent = !row[this.eventPosition];

                return {
                    eventString: row[this.eventPosition],
                    dateString: row[this.datePosition]
                };
            }
        },

        missingEvent: (row, lastEntry) => {
            if(row[this.eventPosition]) {
                this.stateVariables.missingEvent = false;
                lastEntry.eventString = row[this.eventPosition];
            }
            if(row[this.datePosition]) {
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);
            }
        },
        missingDate: (row, lastEntry) => {
            if(row[this.eventPosition]) {
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
            }
            if(row[this.datePosition]) {

                this.stateVariables.postAppend = true
                this.stateVariables.missingDate = incompleteDateRegexp.test(row[this.datePosition]);


                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);
            }
        },
        postAppend: (row, lastEntry, {lastWord}) => {
            if((row[this.eventPosition] && row[this.eventPosition].includes(lastWord))
                || (row[this.datePosition] && row[this.datePosition].includes(lastWord))) {
                this.restartStateMachine(true);
                return false;
            }

            if(!row[this.datePosition] && row[this.eventPosition]){
                this.stateVariables.postAppend = false;
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);

                return;

            }
            dateRegexp.lastIndex = 0;
            const dateMatch = dateRegexp.test(row[this.datePosition]);

            if(dateMatch) {
                this.stateVariables.postAppend = false;
                if(!row[this.eventPosition]){
                    lastEntry.dateString = row[this.datePosition]
                    return
                }
                else {
                    this.stateVariables.postAppend = false;
                    return {
                        eventString: row[this.datePosition],
                        dateString: row[this.eventPosition]
                    };
                }

            } else{
                this.stateVariables.postAppend = false;
                if(row[this.datePosition] && !row[this.eventPosition]){
                    this.stateVariables.postAppend = false;
                    this.stateVariables.missingDate = true
                    return {
                        eventString: undefined,
                        dateString: row[this.datePosition]
                    };
                }
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
            }
        },
        pendingString: (row, lastEntry, {firstWord}) => {
            const startedUsefulTable = row.reduce((acc, curr ) => acc || curr.toLowerCase().includes(firstWord.toLowerCase()), false);
            if(startedUsefulTable) {
                this.restartStateMachine()
                this.firstEvent = true;
            }
        }
    }

    constructor() {
        this.state = "pendingString"
    }

}

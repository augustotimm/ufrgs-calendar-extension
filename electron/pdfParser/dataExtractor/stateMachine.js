const dateRegexp = new RegExp("(\\d{1,2})\/(\\d{1,2})\/(\\d{4})");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4},?.* [a|à]s?($| partir))|(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} e)");
const specialEventString = new RegExp("(20\\d\\d\\/\\d{1,2}).$")
const specialEventStringFormat2 = new RegExp("\\d{2}\\/\\d{2}\\/\\d{4}\\)\\.?$");
const specialDateString = new RegExp(".*até \\d{1,2}.*", "i");

const specialDate = new RegExp("^a \\d{2}\\/\\d{2}\\/\\d{2,4}", "i");
const startEvent = new RegExp("^([A-Z]{2})");


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
        switch(this.state){
            case this.PENDING_STRING:
                if(
                    !this.stateVariables.missingEvent
                    && !this.stateVariables.missingDate
                    && !this.stateVariables.postAppend
                ) {
                    this.state = this.DEFAULT
                    return;
                }
                if(
                    this.stateVariables.missingEvent
                    && this.stateVariables.missingDate
                    && this.stateVariables.postAppend
                ) {
                    this.state = this.PENDING_STRING
                    return;
                }
                break;
            
            case this.MISSING_DATE:
                if(this.stateVariables.missingDate) {
                    this.state = this.MISSING_DATE
                    return;
                }
                if(this.stateVariables.postAppend && !this.stateVariables.missingDate) {
                    this.state = this.POST_APPEND;
                    return;
                }
                break;
            
            case this.MISSING_STRING:
                if(
                    !this.stateVariables.missingEvent
                    && !this.stateVariables.missingDate
                    && !this.stateVariables.postAppend
                ) {
                    this.state = this.DEFAULT
                    return;
                }
                if(this.stateVariables.missingEvent){
                    this.state = this.MISSING_STRING
                    return;
                }
                
                break;
            case this.POST_APPEND:
                if(
                    this.stateVariables.missingEvent
                    && this.stateVariables.missingDate
                    && this.stateVariables.postAppend
                ) {
                    this.state = this.END_STRING;
                    return;
                }
                if(
                    !this.stateVariables.missingEvent
                    && !this.stateVariables.missingDate
                ) {
                    this.state = this.DEFAULT
                    return;
                }
                if(this.stateVariables.missingDate) {
                    this.state = this.MISSING_DATE
                    return;
                }
                break;

            case this.DEFAULT:
                if(
                    this.stateVariables.missingEvent
                    && this.stateVariables.missingDate
                    && this.stateVariables.postAppend
                ) {
                    
                    this.state = this.END_STRING;
                    return;
        
                }
                if(this.stateVariables.missingEvent && !this.stateVariables.missingDate) {
                    this.state = this.MISSING_STRING
                    return
                }
                if(this.stateVariables.missingDate) {
                    this.state = this.MISSING_DATE
                    return;
                }
                if(this.stateVariables.postAppend && !this.stateVariables.missingDate) {
                    this.state = this.MISSING_DATE
                    return;
                }

                if(
                    !this.stateVariables.missingEvent
                    && !this.stateVariables.missingDate
                    && !this.stateVariables.postAppend
                ) {
                    this.state = this.DEFAULT
                    return;
                }
                break;
            case this.END_STRING:
                this.state = this.END_STRING;
                return;
        }

        console.log("State not calculated");
    }

    restartStateMachine(entry = false){
        this.stateVariables.missingEvent = entry;
        this.stateVariables.missingDate = entry;
        this.stateVariables.postAppend = entry;
    }

    testAndAppend(start, value){
        if (!value){
            return start;
        }
        if(start){
            return start + " " + value;
        } else {
            return  value
        }
    }

    calculatePositions(row) {
        if(row[0]) {
            if(dateRegexp.test(row[0]) || specialDateString.test(row[0])) {
               this.eventPosition = 1;
               this.datePosition = 0;
            } else {
               this.eventPosition = 0;
               this.datePosition = 1;
            }
       } else {
           if(dateRegexp.test(row[1]) || specialDateString.test(row[1])) {
               this.eventPosition = 0;
               this.datePosition = 1;
            } else {
               this.eventPosition = 1;
               this.datePosition = 0;
            }
       }
    }

    run(extractedContent, firstWord, lastWord, semesterSeparator) {
        const finalContent = []
        let index = 0
        let pageCount = 0;

        while(pageCount < extractedContent.length && this.state !== this.END_STRING){

            const page = extractedContent[pageCount].map(function( element ) {
                if(element[0] && !element[0].replace(/\s/g, '').length){
                    element[0] = undefined;
                }
                if(element[1] && !element[1].replace(/\s/g, '').length){
                    element[1] = undefined;
                }
                return [...element];
            });
            index = 0;
            pageCount ++;
            while(this.state !== this.END_STRING && index < (page.length ))
            {
                const row = page[index]
                
                if(this.firstEvent || (index === 0 && pageCount > 1)) {
                    this.calculatePositions(row)
                    this.firstEvent = false
                }
                index ++;

                const containsSeparator = row.reduce((acc, curr = '' ) => acc || curr.toLowerCase().includes(semesterSeparator.toLowerCase()), false);

                if(!containsSeparator || this.state === this.PENDING_STRING){

                    if(row.reduce((acc, curr = '' ) => acc || curr.toLowerCase().includes("das vagas".toLowerCase()), false)){
                        console.log("KEEP EYE")
                    }
                    const result = this.stateFunctions[this.state](
                        row,
                        finalContent[finalContent.length - 1],
                        {firstWord, lastWord, previousEntry: finalContent[finalContent.length - 2]},
                    )
                    if(result){
                        finalContent.push(result);
                    }
                } else {
                    this.restartStateMachine()
                    this.firstEvent = true;
                    console.log("ignore")
                }
                if(this.stateVariables.missingEvent && this.stateVariables.missingDate && this.stateVariables.postAppend) {
                    console.log("KEEP EYE")

                }
                this.calculateState();
                if(this.state === this.END_STRING) {
                    console.log("KEEP EYE")
                }
            }
        }
        this.restartStateMachine(true);
        this.calculateState()

        return finalContent;

    }

    testForEndState(row, lastWord, semesterSeparator) {
        return !!((row[this.eventPosition] && row[this.eventPosition].toLowerCase().includes(lastWord.toLowerCase()))
            || (row[this.datePosition] && row[this.datePosition].toLowerCase().includes(lastWord.toLowerCase())));
    }

    stateFunctions = {
        default: (row, lastEntry, {lastWord}) => {
            if(this.testForEndState(row, lastWord)){
                this.restartStateMachine(true);
                return false
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

                this.stateVariables.postAppend = false;

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
                this.stateVariables.postAppend = false;
                this.stateVariables.missingDate = false;

                lastEntry.eventString = row[this.eventPosition];
                
            }
            else{
                this.stateVariables.postAppend = false;
                this.stateVariables.missingDate = false;
                this.stateVariables.missingEvent = true;
            }
            if(row[this.datePosition]) {
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);
            }
        },
        missingDate: (row, lastEntry, {previousEntry}) => {
            if(row[this.eventPosition]) {
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
            }
            if(row[this.datePosition]) {

                this.stateVariables.postAppend = true;
                this.stateVariables.missingEvent = false;
                this.stateVariables.missingDate = incompleteDateRegexp.test(row[this.datePosition]);


                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);

                if(specialDate.test(lastEntry.dateString.toLowerCase())) {
                    previousEntry.eventString = this.testAndAppend(previousEntry.eventString, lastEntry.eventString);
                    previousEntry.dateString = this.testAndAppend(previousEntry.dateString, lastEntry.dateString);
                    lastEntry.dateString = undefined;
                    lastEntry.eventString = undefined
                    this.stateVariables.missingDate = false
                    this.stateVariables.postAppend = true
                    this.stateVariables.missingEvent = true


                }
            }
        },
        postAppend: (row, lastEntry, {lastWord}) => {
            if(this.testForEndState(row, lastWord)) {
                this.restartStateMachine(true);
                return false;
            }

            if(!row[this.datePosition] && row[this.eventPosition]){
                if(this.testSpecialEvent(row[this.eventPosition])){
                    this.stateVariables.postAppend = true;
                    this.stateVariables.missingDate = false;
                    this.stateVariables.missingEvent = false;


                    lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);    
                }
                if(startEvent.test(row[this.eventPosition])){
                    this.stateVariables.postAppend = false;
                    this.stateVariables.missingDate = true;
                    this.stateVariables.missingEvent = false; 
                    return {
                        eventString: row[this.eventPosition],
                        dateString: undefined
                    }
                }
                // TODO test remove this
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
            
                return;

            }
            dateRegexp.lastIndex = 0;
            const dateMatch = dateRegexp.test(row[this.datePosition]);

            if(dateMatch) {
                this.stateVariables.missingDate = false;
                this.stateVariables.missingEvent = false;                 
                if(!row[this.eventPosition]){
                    this.stateVariables.postAppend = true;
                    lastEntry.dateString = row[this.datePosition]
                    return;
                }
                else {
                    this.stateVariables.postAppend = false;
                    return {
                        eventString: row[this.eventPosition],
                        dateString: row[this.datePosition]
                    };
                }

            } else{
                if(row[this.datePosition] && !row[this.eventPosition]){
                    this.stateVariables.missingDate = false;
                    this.stateVariables.missingEvent = true
                    this.stateVariables.postAppend = false;
                    return {
                        eventString: undefined,
                        dateString: row[this.datePosition]
                    };
                }
                this.stateVariables.missingDate = false;
                this.stateVariables.missingDate = false;
                this.stateVariables.postAppend = false;
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[this.datePosition]);
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[this.eventPosition]);
            }
        },
        pendingString: (row, lastEntry, {firstWord}) => {
            const startedUsefulTable = row.reduce((acc, curr = '' ) => acc || curr.toLowerCase() === firstWord.toLowerCase(), false);
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

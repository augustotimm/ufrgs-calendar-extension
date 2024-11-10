const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4},?.* [a|à]s?($| partir))");
const specialEventString = new RegExp("^(20\\d\\d\\/\\d{1,2}).$")

export class StateMachine {
    END_STRING = "END";
    PENDING_STRING = "pendingString";
    MISSING_STRING = "missingEvent";
    DEFAULT = "default";
    POST_APPEND = "postAppend";
    MISSING_DATE = "missingDate";

    state
    stateVariables = {
        missingDate: false,
        missingEvent: false,
        postAppend: false,
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
        if(this.stateVariables.postAppend && !this.stateVariables.missingDate) {
            this.state = this.POST_APPEND
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

    run(extractedContent, firstWord, lastWord, semesterSeparator) {
        lastWord = lastWord? lastWord: "DIAS LETIVOS ";
        const finalContent = []
        let index = 0
        while(this.state !== this.END_STRING && index < (extractedContent.length - 1))
        {
            const row = extractedContent[index]
            row[0]
            index ++;

            if(row[0] !== semesterSeparator){
                // if(this.state === "postAppend" && row[1]?.includes()){
                //     finished = true;
                //     return finalContent;
                // }
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
                console.log("ignore")
            }
            this.calculateState();
        }
        this.restartStateMachine(true);
        this.calculateState()

        return finalContent;

    }

    stateFunctions = {
        default: (row, lastEntry, {lastWord}) => {
            if((row[0] && row[0].includes(lastWord))
                || (row[1] && row[1].includes(lastWord))) {
                this.restartStateMachine(true);
                return false;
            }
            if(!row[1] && row[0]){
                if(specialEventString.test(row[0])) {
                    this.stateVariables.missingDate = false;
                    this.stateVariables.postAppend = false;
                    this.stateVariables.missingEvent = false;
                    lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);
                    return;
                }
                else{
                    this.stateVariables.postAppend = false;
                    this.stateVariables.missingEvent = false;
                    this.stateVariables.missingDate = true;
                    return {
                        eventString: row[0],
                    };
                }
            }
            const dateMatch = dateRegexp.test(row[1]);
            const incompleteDate = incompleteDateRegexp.test(row[1]);

            if(incompleteDate){
                this.stateVariables.missingDate = true
                this.stateVariables.missingEvent = !row[0];

                return {
                    eventString: row[0],
                    dateString: row[1]
                };
            }

            if(dateMatch) {
                this.stateVariables.missingDate = false;
                this.stateVariables.postAppend = false;
                this.stateVariables.missingEvent = !row[0];

                return {
                    eventString: row[0],
                    dateString: row[1]
                };
            }
        },

        missingEvent: (row, lastEntry) => {
            if(row[0]) {
                this.stateVariables.missingEvent = false;
                lastEntry.eventString = row[0];
            }
            if(row[1]) {
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[1]);
            }
        },
        missingDate: (row, lastEntry) => {
            if(row[0]) {
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);
            }
            if(row[1]) {

                this.stateVariables.postAppend = true
                this.stateVariables.missingDate = incompleteDateRegexp.test(row[1]);


                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[1]);
            }
        },
        postAppend: (row, lastEntry, {lastWord}) => {
            if((row[0] && row[0].includes(lastWord))
                || (row[1] && row[1].includes(lastWord))) {
                this.restartStateMachine(true);
                return false;
            }

            if(!row[1] && row[0]){
                this.stateVariables.postAppend = false;
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);

                return;

            }
            const dateMatch = dateRegexp.test(row[1]);
            const incompleteDate = incompleteDateRegexp.test(row[1]);

            if(incompleteDate){
                this.stateVariables.postAppend = false;
                this.stateVariables.missingDate = true
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[1]);
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);
                return;

            }
            if(dateMatch) {
                this.stateVariables.postAppend = false;
                if(!row[0]){
                    lastEntry.dateString = row[1]
                    return
                }
                else {
                    return {
                        eventString: row[1],
                        dateString: row[0]
                    };
                }

            } else{
                this.stateVariables.postAppend = false;
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[1]);
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);
            }
        },
        pendingString: (row, lastEntry, {firstWord}) => {
            const startedUsefulTable = row.reduce((acc, curr ) => acc || curr.includes(firstWord), false);
            if(startedUsefulTable) {
                this.restartStateMachine()
            }
        }
    }

    constructor() {
        this.state = "pendingString"
    }

}

const dateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$)");
const incompleteDateRegexp = new RegExp("(.*\\d{1,2}\\/\\d{1,2}\\/\\d{2,4},?.* [a|à]s?($| partir))");
const specialEventString = new RegExp("^(20\\d\\d\\/\\d{1,2}).$")


export class StateMachine {
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
            this.state = "pendingString"
        }
        if(this.stateVariables.missingEvent) {
            this.state = "missingEvent"
            return
        }
        if(this.stateVariables.missingDate) {
            this.state = "missingDate"
            return;
        }
        if(this.stateVariables.postAppend && !this.stateVariables.missingDate) {
            this.state = "postAppend"
            return;
        }

        if(
            !this.stateVariables.missingEvent
            && !this.stateVariables.missingDate
            && !this.stateVariables.postAppend
        ) {
            this.state = "default"
            return;
        }
    }

    restartStateMachine(){
        this.stateVariables.missingEvent = false;
        this.stateVariables.missingDate = false;
        this.stateVariables.postAppend = false;
    }

    testAndAppend(start, value){
        if(start){
            return start + " " + value;
        } else {
            return  value
        }
    }

    run(extractedContent, firstWord, lastWord, semesterSeparator) {
        let finished = false;
        const finalContent = []
        let index = 0
        while(!finished)
        {
            const row = extractedContent[index]
            index ++;

            if(row[0] !== semesterSeparator){
                if(this.state === "postAppend" && row[1]?.includes("DIAS LETIVOS ")){
                    finished = true;
                    return finalContent;
                }
                const result = this.stateFunctions[this.state](
                    row,
                    finalContent[finalContent.length - 1],
                    {firstWord, lastWord},
                )
                if(result){
                    finalContent.push(result);
                }
                if(result === false) {
                    finished = true;
                } else

                this.calculateState()
            } else {
                this.restartStateMachine()
                console.log("ignore")
            }


        }
        this.restartStateMachine();
        this.state = "pendingString";

        return finalContent;

    }

    stateFunctions = {
        default: (row, lastEntry) => {
            if(!row[1] && row[0]){
                if(specialEventString.test(row[0])) {
                    lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);
                }
                else{
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
            if(row[0] && row[0].includes(lastWord)) {
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
                lastEntry.dateString = this.testAndAppend(lastEntry.dateString, row[1]);
                lastEntry.eventString = this.testAndAppend(lastEntry.eventString, row[0]);

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

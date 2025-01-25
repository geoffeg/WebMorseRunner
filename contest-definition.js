import { AudioMessage, DEFAULT, RunMode, StationMessage } from "./defaults.js"


const stdKey = {
    F1: { label: "CQ", send: StationMessage.CQ },
    F2: { label: "<#>", send: StationMessage.NR },
    F3: { label: "TU", send: StationMessage.TU },
    F4: { label: "<my>", send: StationMessage.MyCall },
    F5: { label: "<his>", send: StationMessage.HisCall },
    F6: { label: "B4", send: StationMessage.B4 },
    F7: { label: "?", send: StationMessage.Qm },
    F8: { label: "NIL", send: StationMessage.Nil },
}


const cwaKey = Object.assign({}, stdKey, {
    F2: { label: "<DOK>", send: StationMessage.Exchange1 },
})


const contest_def = [
    {
        id: 'single',
        name: "Single Call",
        runmode: RunMode.Single,
        key: stdKey,
    },
    {
        id: 'pileup',
        name: "Pileup",
        runmode: RunMode.Pileup,
        key: stdKey,
    },
    {
        id: 'cwa',
        name: "DARC CWA",
        runmode: RunMode.Pileup,
        key: cwaKey,
        echange1: 'DOK'
        
    }    
]

export class ContestDefinition {

    constructor() {
        ContestDefinition.initView()
    }
    // load the contest definition 
    static initView() {
        const contestSelect = document.querySelector("#mode")
        contest_def.forEach(d => {
            const selectOption = document.createElement("option")
            selectOption.value = d.id
            const label = document.createTextNode(d.name)
            selectOption.appendChild(label)
            contestSelect.appendChild(selectOption)
        })
        console.log(contestSelect)
    }

    static getRunMode(id) {
        const contest = contest_def.find( e => e.id === id  )
        return contest.runmode
    }

    static getContest(id) {
        return contest_def.find( e => e.id === id  )
    }

    updateConfig(conf) {
        this._config = conf
        this.updatePileupFields()
        this.updateFunctionKeys()
    }

    updateFunctionKeys() {
        // need to reattach events on function key press
        document.querySelectorAll("#send_button > *").forEach(e => e.remove())
        const buttons_div = document.querySelector("#send_button")
        const contest = ContestDefinition.getContest(this._config.contest_id)
        console.log(contest)
        for (const [key, value] of Object.entries(contest.key)) {
                const button = document.createElement("button")
                button.id = key
                const label = document.createTextNode(value.label)
                button.appendChild(label)
                buttons_div.appendChild(button)
             }
            
    }

    updatePileupFields() {
        document.querySelectorAll(".pileup_only").forEach(
            (e) => {
                if (this._config.runmode === RunMode.Pileup) {
                    e.classList.remove("pileup_hidden")
                } else e.classList.add("pileup_hidden")
            },
        )
    }

}
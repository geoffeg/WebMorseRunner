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

const awtKey = Object.assign({}, stdKey, {
    F2: { label: "<Name>", send: StationMessage.Exchange1 },
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
        exchange1: 'DOK'        
    },
    {
        id: 'awt',
        name: "A1Club AWT",
        runmode: RunMode.Pileup,
        key: awtKey,
        exchange1: 'Name'        
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
        this._contest = ContestDefinition.getContest(this._config.contest_id)
        this.updatePileupFields()
        this.updateFunctionKeys()

        let exchange1_label_dom = document.getElementById("exchange1")
        if (this._contest.exchange1) {
            const exchange1_label = this._contest.exchange1
            exchange1_label_dom.innerText = exchange1_label
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.remove("hidden")
            const label_myexchange1 = document.querySelector("#myexchange1 label")
            label_myexchange1.innerText = exchange1_label
        }    
        else { 
            exchange1_label_dom.innerText = 'Nr.'
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.add("hidden")            
        }


    }

    updateFunctionKeys() {
        const contest = ContestDefinition.getContest(this._config.contest_id)
        for (const [key, value] of Object.entries(contest.key)) {
                  const button = document.getElementById(key)
                  button.innerText = value.label
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
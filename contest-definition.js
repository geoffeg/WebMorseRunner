import { AudioMessage, DEFAULT, RunMode, StationMessage } from "./defaults.js"

const Exchange = {
    NR: {
        id: 'nr',
        text: "Nr.",
        length: 3,
        numeric: true,
    },
    RST: {
        id: 'rst',
        text: "RST",
        length: 3,
        numeric: true,
    },
    NAME: {
        id: 'name',
        text: 'Name',
        length: 6,
    },
    DOK: {
        id: 'dok',
        text: 'DOK',
        length: 3,
        uppercase: true
    }
}

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
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },
    {
        id: 'pileup',
        name: "Pileup",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },
    {
        id: 'cwa',
        name: "DARC CWA",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.DOK],
        key: cwaKey,
        my_exchange: 'My DOK'
    },
    {
        id: 'awt',
        name: "A1Club AWT",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.NAME],
        key: awtKey,
        my_exchange: 'My Name'
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
        const contest = contest_def.find(e => e.id === id)
        return contest.runmode
    }

    static getContest(id) {
        return contest_def.find(e => e.id === id)
    }

    updateConfig(conf) {
        this._config = conf
        this._contest = ContestDefinition.getContest(this._config.contest_id)
        this.updatePileupFields()
        this.updateFunctionKeys()
        this.updateExchangeFields()

        if (this._contest.my_exchange) {
            const exchange1_label = this._contest.my_exchange
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.remove("hidden")
            const label_myexchange1 = document.querySelector("#myexchange1 label")
            label_myexchange1.innerText = exchange1_label
            const input_myexchange1 = document.querySelector("#myexchange1 input")
            if (!this._config.contest[this._contest.id].exchange1)
                input_myexchange1.value = ''
            else input_myexchange1.value = this._config.contest[this._contest.id].exchange1
        } else {
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.add("hidden")
        }

    }

    updateExchangeFields() {
        const exchange = document.querySelector("#exchange")
        exchange.innerHTML = ''
        this._contest.exchange.forEach(ex => {
            const div = document.createElement("div")
            const label = document.createElement("label")
            label.for = ex.id
            label.innerText = ex.text
            div.appendChild(label)
            const input = document.createElement("input")
            input.id = ex.id
            if (ex.numeric) input.classList.add("NR")
            if (ex.uppercase) input.style = "text-transform: uppercase"
            input.maxLength = ex.length
            input.size = ex.length
            input.type = "text"
            input.value = ""
            input.name = ex.id
            input.autocomplete = "off"
            div.appendChild(input)
            exchange.appendChild(div)
        })
        this.numberFields()
        this.wipeExchangeFields()
    }

    wipeExchangeFields() {
        if (this._contest) this._contest.exchange.forEach(ex => {
            document.getElementById(ex.id).value = ""
        })
    }
    numberFields() {
        var nr_input = document.querySelectorAll(".NR")
        Array.from(nr_input).forEach((input) => {
            input.addEventListener("beforeinput", (e) => {
                const nextVal =
                    e.target.value.substring(0, e.target.selectionStart) +
                    (e.data ?? "") +
                    e.target.value.substring(e.target.selectionEnd)
                if (!/^\d{0,3}$/.test(nextVal)) {
                    e.preventDefault()
                }
                return
            })
        })
    }

    getLastExchangeField() {
        const exchange = this._contest.exchange
        return exchange[exchange.length - 1]
    }

    updateFunctionKeys() {
        const contest = ContestDefinition.getContest(this._config.contest_id)
        for (const [key, value] of Object.entries(contest.key)) {
            const button = document.getElementById(key)
            button.innerText = value.label
        }
    }

    getNextField(field) {
        const exchange = this._contest.exchange
        if (field === 'call') return exchange[0].id
        const field_idx = exchange.findIndex(ex => { return ex.id === field })
        if (field_idx === exchange.length - 1) return 'call'
        return exchange[field_idx + 1].id
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
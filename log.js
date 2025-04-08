import { ContestDefinition } from "./contest-definition.js"

export class Log {

    static Check = {
        NIL: "Nil",
        NR: 'NR',
        RST: 'Rst',
        DUP: 'DUP',
        OK: ''
    }

    constructor() {
        // singleton 
        if (Log._instance) {
            return Log._instance
        }
        Log._instance = this   
        
        this._contestDefinition = new ContestDefinition()
        
        this.data = []
        this.NR = 1
        this.initScoreSets()      
    }

    initScoreSets() {
        this.Calls = new Set()
        this.Prefix = new Set()
        this.ConfCalls = new Set()
        this.ConfPrefix = new Set()            
    }

    wipe() {
        this.data = []
        let table = document.querySelector('#log table')
        let row_no = table.rows.length
        for (let i = 1; i < row_no; i++) table.deleteRow(1)
        this.initScoreSets()
        this.updateScore()     
        this.NR = 1   
    }

    addQso(qso) {
        let complete_qso = qso
        let call = qso.Call
        let prefix = Log.ExtractPrefix(call)
        

        this.Calls.add(call)
        this.Prefix.add(prefix)
        this.updateScore()
        complete_qso.Check = Log.Check.NIL
        complete_qso.SendRST = '599'
        complete_qso.SendNr = String(this.NR).padStart(3, '0')
        
        // my own exchange
        const myexchange = this._contestDefinition.getMyExchange()
        complete_qso.SendExchange = myexchange
       // console.log(myexchange)

        complete_qso.Pref = prefix
        this.NR++
        let log = document.getElementById("log");
        this.data.push(complete_qso)
        this.addTable(complete_qso)
    }


    checkQSO(qso) {
       // console.log("CHECK",qso)
        const call = qso.call
        const NR = String(qso.NR).padStart(3,'0')
        const last_qso = this.data[this.data.length - 1]
        const rst = ( qso.RST ? qso.RST : 599 ).toString()
        let confirm = Log.Check.OK

//        if (last_qso.RecvRST !== rst) confirm = Log.Check.RST
//      if (last_qso.RecvNr !== NR) confirm = Log.Check.NR

        const contestDefinition = new ContestDefinition()
        confirm = contestDefinition.checkExchange(last_qso.RecvExchange,qso.Ex)
        

        if (last_qso.Call !== call) confirm = Log.Check.NIL
        
        last_qso.Check = confirm

        if (confirm !== Log.Check.NIL) {
            const el = document.querySelector("#log > table tr:last-child td:last-child")
            el.innerText = confirm
        }

        if (confirm === Log.Check.OK) {
            this.ConfCalls.add(last_qso.Call)
            this.ConfPrefix.add(last_qso.Pref)
            this.updateScore()
        }
    }

    updateScore() {
        let pts = this.Calls.size
        let multi = this.Prefix.size
        let score = pts * multi

        let conf_pts = this.ConfCalls.size
        let conf_multi = this.ConfPrefix.size
        let conf_score = conf_pts * conf_multi

        
        let pts_row = document.querySelector('.table_result tr:nth-child(2)')

        pts_row.querySelector('td:nth-child(2)').innerText = pts
        pts_row.querySelector('td:nth-child(3)').innerText = conf_pts

        let multi_row = document.querySelector('.table_result tr:nth-child(3)')

        multi_row.querySelector('td:nth-child(2)').innerText = multi
        multi_row.querySelector('td:nth-child(3)').innerText = conf_multi

        let score_row = document.querySelector('.table_result tr:nth-child(4)')

        score_row.querySelector('td:nth-child(2)').innerText = score
        score_row.querySelector('td:nth-child(3)').innerText = conf_score
    }


    static ExtractPrefix(Call) {
        let call = Call.toUpperCase()
        let dig = ''
        call = call.replace(/\/QRP$/, '')
        call = call.replace(/\/MM$/, '')
        call = call.replace(/\/M$/, '')
        call = call.replace(/\/P$/, '')


        call = call.replace(/^\//, '')
        call = call.replace(/\/$/, '')

        if (call.length < 2) return ''
        let s1 = call.replace(/\/.*$/, '')
        let s2 = call.replace(/^.*\//, '')
        if (/^\d$/.test(s1)) {
            call = s2
            dig = s1
        } else {
            if (/^\d$/.test(s2)) {
                call = s1
                dig = s2
            } else if (s1.length <= s2.length) call = s1; else call = s2
        }
        if (call.indexOf('/') >= 0) return ''

        call = call.replace(/[^\d]*$/, '')


        // ensure digit
        if (!(/^\d$/.test(call[call.length - 1]))) call += '0'
        // replace digit
        if (dig.length === 1) call = call.replace(/.$/, dig)

        return call
    }

    addTable(qso) {
        const el = document.querySelector("#log > table");
        let row = el.insertRow(-1);
        row.insertCell().textContent = `${qso.UTC}`
        row.insertCell().textContent = `${qso.Call}`
        row.insertCell().textContent = qso.RecvExchange.join(" ")
        row.insertCell().textContent = qso.SendExchange.join(" ")
        row.insertCell().textContent = `${qso.Pref}`
        row.insertCell().textContent = `${qso.Check}`
        let log = document.getElementById("log");
        log.scrollTop = log.scrollHeight;
    }

}
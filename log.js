export class Log {

    static Check = {
        NIL: "Nil",
        NR: 'NR',
        OK: ''
    }

    constructor() {
        this.data = []
        this.NR = 1
        this.initScoreSets()      
/*
        this.addQso({
            UTC: '00:00:00',
            Call: 'DJ1TF'
        })
        this.addQso({
            UTC: '00:00:00',
            Call: 'DJ1DF'
        }) 
        this.ConfCalls.add('DJ1TF')       
        this.ConfCalls.add('D1TF')            
        this.ConfPrefix.add('XX1')   
        this.ConfPrefix.add('XX3')           
        this.ConfPrefix.add('X3')           
        this.updateScore(
        */
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
        complete_qso.Pref = prefix
        this.NR++
        let log = document.getElementById("log");
        this.data.push(complete_qso)
        this.addTable(complete_qso)
    }


    checkQSO(qso) {
        let call = qso.call
        let NR = String(qso.NR).padStart(3,'0')
        let last_qso = this.data[this.data.length - 1]
        let confirm = Log.Check.NIL
        if (last_qso.Call === call) confirm = last_qso.RecvNr === NR ? Log.Check.OK : Log.Check.NR
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
        row.insertCell().textContent = `${qso.RecvRST} ${qso.RecvNr}`
        row.insertCell().textContent = `${qso.SendRST} ${qso.SendNr}`
        row.insertCell().textContent = `${qso.Pref}`
        row.insertCell().textContent = `${qso.Check}`
        let log = document.getElementById("log");
        log.scrollTop = log.scrollHeight;
    }

}
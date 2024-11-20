export class Log {

    constructor() {
        this.data = []
        this.NR = 1
        this.data1 = [{
            UTC: '00:00:00',
            Call: 'DJ1TF',
            RecvNr: '001',
            RecvRST: '599',
            SendNr: '002',
            SendRST: '599',
            Pref: 'DJ1',
            Check: 'DUP'

        }
        ]
        /*
                this.addQso(
                    {
                        UTC: '00:00:02',
                        Call: 'DJ1TF',
                        RecvNr: '001',
                        RecvRST: '599',
                    }
                )        
                this.addQso(
                    {
                        UTC: '00:00:02',
                        Call: 'DJ1TF',
                        RecvNr: '001',
                        RecvRST: '599',
                    }
                )   */
    }

    addQso(qso) {
        let complete_qso = qso
        complete_qso.Check = 'NIL'
        complete_qso.SendRST = '599'
        complete_qso.SendNr = String(this.NR).padStart(3, '0')
        complete_qso.Pref = Log.ExtractPrefix(qso.Call)
        this.NR++
        let log = document.getElementById("log");
        this.data.push(complete_qso)
        this.addTable(complete_qso)
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
    /*
        addEntry() {
            let d = this.data[0]
            for (let i = 0; i < 0; i++) {
                const el = document.querySelector("#log > table");
                let row = el.insertRow(-1);
                row.insertCell().textContent = `${d.UTC}`
                row.insertCell().textContent = `${d.Call}`
                row.insertCell().textContent = `${d.RecvRST + ' ' + d.RecvNr}`
                row.insertCell().textContent = `${d.SendRST + ' ' + d.SendNr}`
                row.insertCell().textContent = `${d.Pref}`
                row.insertCell().textContent = `${d.Check}`
            }
    
            let log = document.getElementById("log");
            log.scrollTop = log.scrollHeight;
        }
    */

}
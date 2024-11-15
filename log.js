export class Log {



    constructor() {
        this.data = [{
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
    }

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


}
export class Calls {
    constructor() {
        
    }

    async fetch_calls(){        
        this.calls = (await (await fetch('calls.txt')).text()).split('\n')
    }

    get_random_int(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } 

    get_random() {
        let random = this.get_random_int(0,this.calls.length)
        let call = this.calls[random]
        return call
    }
}
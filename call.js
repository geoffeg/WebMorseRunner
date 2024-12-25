export class Calls {

    static store_key = 'web_morse_runner_calls'

    constructor() {

    }

   filter_calls(calls) {
    return calls.split('\n').map( e => e.trim()).filter(
        (c) => {
            return c.length >2 && c.length < 15
        })
   }

    async fetch_calls() {
        const localdb__str = localStorage.getItem(Calls.store_key)
        this.calls = new Array()
        if (localdb__str) this.calls = this.filter_calls(localdb__str)
        if (this.calls.length > 0) return 
        const fetched_calls = await (await fetch('calls.txt')).text()
        
        localStorage.setItem(Calls.store_key, fetched_calls)
        this.calls = this.filter_calls(fetched_calls)

    }

    get_random_int(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    get_random() {
        let random = this.get_random_int(0, this.calls.length)
        let call = this.calls[random]
        return call
    }
}
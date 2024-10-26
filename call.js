export class Calls {
    constructor() {
        
    }

    async fetch_calls(){
        
        this.calls = await (await fetch('calls.txt')).text()
    }
}
export class Config {

    constructor() {
        this._my_call = document.querySelector("#my_call")
        this._volume = document.querySelector("#volume")
        this._wpm = document.querySelector("#wpm")
        this._pitch = document.querySelector("#pitch")
        this._time = document.querySelector("#time")        
        this._qsk = document.querySelector("#qsk")          
        this._config = {
            my_call: 'DJ1TF',
            volume: 0.75,
            wpm: 20,
            pitch: 500,
            rx_bandwidth: 300,
            time: 10,
            qsk: false,
        }
    }
    store() {
        localStorage.setItem(config_store_key, JSON.stringify(this._config))
    }
    load() {
        let config_str = localStorage.getItem(config_store_key)
        if (config_str) {
            let conf = JSON.parse(config_str)
            if (conf) this._config = conf
        }
    }

    update_dom() {
        this._my_call.value = this._config.my_call        
        this._volume.value = this._config.volume
        this._wpm.value = this._config.wpm
        this._pitch.value = this._config.pitch
        this._time.value = this._config.time        
        this._qsk.checked = this._config.qsk          
    }


    
}
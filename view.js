import { Calls } from "./call.js"
import { DEFAULT, AudioMessage } from "./defaults.js"

export class View {
    constructor() {
      this.running = false
      this.ContestNode = null      
      this.calls = new Calls()
      this.calls.fetch_calls()      
    }
    setFocus(id) {
        document.getElementById(id).focus();
    }

    wipeFields(){
        document.getElementById('call').value = ''
        document.getElementById('rst').value = ''
        document.getElementById('nr').value = ''
        this.setFocus('call')
    }

    sendMessage(data) {        
        this.ContestNode.port.postMessage(data)        
    }

    functionKey() {
        document.getElementById('input').addEventListener("keydown", (e) => {
            console.log(e.code)
            if (e.code === 'Enter') {
               this.sendMessage({
                 type: AudioMessage.send_msg,
                 text: this.random_call

               })
            }
        });
    } 
    
    numberFields() {
        var nr_input = document.querySelectorAll('.NR')
        Array.from(nr_input).forEach(input => {
            input.addEventListener("beforeinput", e => {
                const nextVal =
                    e.target.value.substring(0, e.target.selectionStart) +
                    (e.data ?? '') +
                    e.target.value.substring(e.target.selectionEnd)
                if (!/^\d{0,3}$/.test(nextVal)) {
                    e.preventDefault();
                }
                return
            })
        })    
    }

    async startContest() {
        this.wipeFields()
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: DEFAULT.RATE })
        await this.ctx.audioWorklet.addModule("contest-processor.js");
        this.ContestNode = new AudioWorkletNode(
            this.ctx,
            "contest-processor",
        );
        this.ContestNode.port.onmessage = (e) => {
            console.log(e.data)
            let type = e.data.type

            switch (type) {
                case AudioMessage.request_dx:
                    this.random_call = this.calls.get_random()
                    this.ContestNode.port.postMessage({
                        type: AudioMessage.create_dx,
                        text: this.random_call
                    })
                    break
            }
        }
        this.ContestNode.connect(this.ctx.destination);
    }


    onLoad() {
      this.functionKey()
      this.wipeFields()
      this.numberFields()
 
      const start_button = document.getElementById("start")
      start_button.onclick = async () => {
        this.startContest()
      }

      const debug_button = document.getElementById("debug")
      debug_button.onclick = async () => {
          let MyContest = new Contest(DEFAULT.RATE)
          let result = new Float32Array(DEFAULT.RATE * 60 * 2)
          MyContest.getBlock(result)
          const debug_button = document.getElementById("debug")
          debug_button.style.backgroundColor = "red"
      }
      const cq_button = document.getElementById("cq")
      cq_button.onclick = async () => {
          ContestNode.port.postMessage({
              type: "send",
              text: "CQ"
          })
  
      }

    }



}
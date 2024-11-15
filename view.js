import { Calls } from "./call.js"
import { DEFAULT, AudioMessage } from "./defaults.js"
import { Log } from "./log.js"

export class View {
    constructor() {
      this.running = false
      this.ContestNode = null      
      this.calls = new Calls()
      this.calls.fetch_calls()      
      this.MustAdvance = true
      this.call = document.getElementById('call')
      this.rst = document.getElementById('rst')
      this.nr = document.getElementById('nr')


      this.prev_call = ''
      this.CallSend = false
      this.NrSend = false
    }
    setFocus(id) {
        document.getElementById(id).focus();
    }

    wipeFields(){
        document.getElementById('call').value = ''
        document.getElementById('rst').value = ''
        document.getElementById('nr').value = ''
        this.setFocus('call')

        this.CallSend = false
        this.NrSend = false
        
    }

    sendMessage(data) {        
        this.ContestNode.port.postMessage(data)        
    }


    processEnter() {
        let new_call = this.call.value.toUpperCase()
        this.MustAdvance = false

        // send CQ if call is empty
        if (this.call.value === '') {
            this.sendMessage({
                type: AudioMessage.send_cq
            })
            return
        }
        let C = this.CallSend
        let N = this.NrSend
        let R = this.nr.value !== ''

        if (!C || (!N && !R)) {
            this.CallSend = true
            this.prev_call = new_call
            this.sendMessage({
                type: AudioMessage.send_his,
                data: new_call
            }) 
        }   
        if (!N) {
            this.NrSend = true
            this.sendMessage({
                type: AudioMessage.send_nr
            })  
        }
        // send ?            
        if (N && !R) 
            this.sendMessage({
                type: AudioMessage.send_qm
            })        


        if (R && (C || N)) {            
            this.sendMessage({
                type: AudioMessage.send_tu
            })   
//              Log.SaveQso
                this.wipeFields()
            }
            else
             this.MustAdvance = true 




    }

    functionKey() {
        document.getElementById('input').addEventListener("keydown", (e) => {
            if (this.call.value.toUpperCase() !== this.prev_call) {
                this.prev_call = ''
                this.CallSend = false
            }
            if (e.code === 'Enter') {
               this.processEnter()
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

    advance() {
       if (!this.MustAdvance) return    
       if (this.rst.value === '') this.rst.value = 599

       if (this.call.value.indexOf('?') === -1) {
        this.setFocus('nr')
       }
       this.MustAdvance = false
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
                        data: this.random_call
                    })
                    break
                case AudioMessage.advance:
                    this.advance()
                    break
                default:
                    console.log("ERROR: Unsupported message")
                    debugger;
            }
        }
        this.ContestNode.connect(this.ctx.destination);
    }


    onLoad() {


      let log = new Log()
      log.addEntry()
        
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
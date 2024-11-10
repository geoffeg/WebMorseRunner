import { Keyer } from "./keyer.js"
import { DEFAULT, RunMode, StationMessage } from "./defaults.js"

let GKeyer = new Keyer()


export class Station {
    static NEVER = Number.MAX_VALUE
    // States 
    static State = {
        Listening: 1,
        Copying: 2,
        PreparingToSend: 3,
        Sending: 4
    }

    // Events
    static Event = {
        Timeout: 1,
        MsgSent: 2,
        MeStarted: 3,
        MeFinished: 4
    }

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
        this._NrWithError = false
        this.MyCall = 'DJ1TF'
        this.HisCall = 'DL1XX'
        this.NR = 1
        this.RST = 599
        this._Msg = new Array()
        this.TimeOut = 0
      //  this.CallsFromKeyer = false
        GKeyer.rate = DEFAULT.RATE
        this.State = Station.State.Listening
    }

    get Bfo() {
        let result = this._FBfo
        this._FBfo = this._FBfo + this._dPhi
        if (this._FBfo > Math.PI * 2) this._FBfo -= Math.PI * 2
        return result
    }

    SendMsg(AMsg) {
        if (!this._Envelope) this._Msg = new Array()
        if (AMsg === StationMessage.None) {
            this._State = State.Listening
            return
        }
        this._Msg.push(AMsg)

        switch (AMsg) {
            case StationMessage.CQ:
                this.SendText('CQ <my> TEST')
                break
            case StationMessage.NR:
                this.SendText('<#>')
                break
            case StationMessage.TU:
                this.SendText('TU')
                break
            case StationMessage.MyCall:
                this.SendText('<my>')
                break
            case StationMessage.HisCall:
                SendText('<his>')
                break
            case StationMessage.B4:
                SendText('QSO B4')
                break
            case StationMessage.Qm:
                SendText('?')
                break
            case StationMessage.Nil:
                SendText('NIL')
                break
            case StationMessage.R_NR:
                SendText('R <#>')
                break
            case StationMessage.R_NR2:
                SendText('R <#> <#>')
                break
            case StationMessage.DeMyCall1:
                SendText('DE <my>')
                break
            case StationMessage.DeMyCall2:
                SendText('DE <my> <my>')
                break
            case StationMessage.DeMyCallNr1:
                SendText('DE <my> <#>')
                break
            case StationMessage.DeMyCallNr2:
                SendText('DE <my> <my> <#>')
                break
            case StationMessage.MyCallNr2:
                SendText('<my> <my> <#>')
                break
            case StationMessage.NrQm:
                SendText('NR?')
                break
            case StationMessage.LongCQ:
                SendText('CQ CQ TEST <my> <my> TEST')
                break
            case StationMessage.Qrl:
                SendText('QRL?')
                break
            case StationMessage.Qrl2:
                SendText('QRL?   QRL?')
                break
            case StationMessage.Qsy:
                SendText('<his>  QSY QSY')
                break
            case StationMessage.Agn:
                SendText('AGN')
                break
        }
    }

    SendText(AMsg) {
        AMsg = AMsg.replaceAll('<#>',Station.NrAsText(this.RST, this.NR))    
        AMsg = AMsg.replaceAll('<my>',this.MyCall)    
        if (this.MsgText) {
            this.MsgText += ' ' + AMsg
        } else { this.MsgText = AMsg }
        this.SendMorse(GKeyer.Encode(this.MsgText))
    }

    SendMorse(AMorse) {
        if (!this._Envelope) {
            this._SendPos = 0
            this._FBfo = 0
        }

        GKeyer.Wpm = this.Wpm;
        GKeyer.MorseMsg = AMorse;
        this._Envelope = GKeyer.GetEnvelope()
        for (let i = 0; i < this._Envelope.length; i++) this._Envelope[i] *= this.Amplitude;

        this.State = Station.State.Sending;
        this.TimeOut = Station.NEVER;
    }

    GetBlock() {
        if (!this._Envelope || this._Envelope === null) {
            return null
        }
        let result = new Array()
        for (let i = 0; i < DEFAULT.BUFSIZE && this._SendPos + i < this._Envelope.length; i++) {
            result.push(this._Envelope[this._SendPos + i])
        }
        // advance TX buffer
        this._SendPos += DEFAULT.BUFSIZE;
        if (this._SendPos >= this._Envelope.length ) this._Envelope = null
        return result
    }

    set Pitch(Value) {
        this._FPitch = Value;
        this._dPhi = Math.PI * 2 * this._FPitch / DEFAULT.RATE
    }


    Tick() {
        // just finished sending
        if (this.State === Station.State.Sending && this._Envelope === null) {
            this.MsgText = ''
            this.State = Station.State.Listening
            this.ProcessEvent(Station.Event.MsgSent)
        }
        // check timeout
        else if (this.State !== Station.State.Sending) {
            if (this.TimeOut > -1) this.TimeOut--
            if (this.TimeOut === 0) this.ProcessEvent(Station.Event.Timeout)
        }
    }

    static NrAsText(rst, nr) {
        let rst_str = rst.toString().padStart(3, '0')
        let nr_str = nr.toString().padStart(3, '0')
        let result = `${rst_str}${nr_str}`
        if (this._NrWithError) {
            let Idx = result.length - 1
            if (!/[2-7]/.test(result[Idx])) Idx--
            if (/[2-7]/.test(result[Idx])) {
                let code = result.charCodeAt(Idx)
                if (Math.random() < 0.5) code--; else code++

                result = result.substring(0, Idx) + String.fromCharCode(code) + result.substring(Idx + 1);
                result += `EEEEE ${nr_str}`
            }
        }
        result = result.replaceAll('599', '5NN')
        if (DEFAULT.RUNMODE !== RunMode.Hst) {
            result = result.replaceAll('000', 'TTT')
            result = result.replaceAll('00', 'TT')
            if (Math.random() < 0.4) {
                result = result.replaceAll('0', 'O')
            } else if (Math.random() < 0.97) {
                result = result.replaceAll('0', 'T')
            }
            if (Math.random() < 0.97) {
                result = result.replaceAll('9', 'N')
            }
        }
    }


}

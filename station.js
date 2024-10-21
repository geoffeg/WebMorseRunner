import { Keyer } from "./keyer.js"
import { DEFAULT, StationMessage } from "./defaults.js"

let GKeyer = new Keyer()

const NEVER = Number.MAX_VALUE

export class Station {

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

    //    static NEVER = Number.MAX_VALUE

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
        GKeyer.rate = DEFAULT.RATE
    }

    _GetBfo() {
        let result = this._FBfo
        this._FBfo = this._FBfo + this._dPhi
        if (this._FBfo > Math.PI * 2) this._FBfo -= Math.PI * 2
        return XPathResult
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
            case StateMessage.TU:
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
        /*    
              if Pos('<#>', AMsg) > 0 then
                begin
                //with error
                AMsg := StringReplace(AMsg, '<#>', NrAsText, []);
                //error cleared
                AMsg := StringReplace(AMsg, '<#>', NrAsText, [rfReplaceAll]);
                end;
            
              AMsg := StringReplace(AMsg, '<my>', MyCall, [rfReplaceAll]);
            
            {
              if CallsFromKeyer
                 then AMsg := StringReplace(AMsg, '<his>', ' ', [rfReplaceAll])
                 else AMsg := StringReplace(AMsg, '<his>', HisCall, [rfReplaceAll]);
            }
        */
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

        this.State = this.stSending;
        this.TimeOut = NEVER;
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
        if (this._SendPos >= this._Envelope.length) this._Envelope = null
        return result
    }

    SetPitch(Value) {
        this._FPitch = Value;
        dPhi = Math.PI * 2 * this._FPitch / DEFAULT.RATE
    }
}

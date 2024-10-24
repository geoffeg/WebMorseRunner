
import { DEFAULT, StationMessage, RunMode } from "./defaults.js";
import { Station } from "./station.js"

export class MyStation extends Station {
    constructor() {
        super()
        this.Pieces = new Array()
        this.Init()
    }

    Init() {
        this.MyCall = DEFAULT.CALL
        this.NR = 1
        this.RST = 599
        this.Pitch = DEFAULT.PITCH
        this.Wpm = DEFAULT.WPM
        this.Amplitude = 300000
    }

    AbortSend() {
        this.Envelope = new Array()
        this.Msg = [StationMessage.Garbage]
        this.MsgText = ''
        this.Pieces = new Array()
        this.State = State.Listening
        ProcessEvent(Event.MsgSent)
    }


    SendText(AMsg) {

        this._AddToPieces(AMsg)
        if (this.State !== Station.State.Sending) {
            this._SendNextPiece()
            //    Tst.OnMeStartedSending;
        }
    }

    _AddToPieces(AMsg) {
        //split into pieces
        //special processing of callsign
        let p = AMsg.indexOf('<his>')
        while (p > 0) {

            this.Pieces.push(AMsg.substr(1, p - 1))
            this.Pieces.push('@')  //his callsign indicator
            AMsg = AMsg.substr(p + 5, AMsg.length)
            p = AMsg.indexOf('<his>')
        }
        this.Pieces.push(AMsg)

        for (let i = this.Pieces.length - 1; i >= 0; i--)
            if (this.Pieces[i] === '') this.Pieces.splice(i, 1)

    }

    _SendNextPiece() {
        let MsgText = ''

        if (this.Pieces[0] !== '@')
            super.SendText(this.Pieces[0]);
        else
            if ( /*CallsFromKeyer && */
                (!(DEFAULT.RUNMODE === RunMode.Hst
                    || DEFAULT.RUNMODE === RunMode.Wpx)))
                super.SendText(' ')
            else this.SendText(this.HisCall)
    }


}
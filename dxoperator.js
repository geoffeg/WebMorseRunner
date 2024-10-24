import { DEFAULT, StationMessage } from "./defaults.js"


const OperatorState = {
    NeedPrevEnd: 0,
    NeedQso: 1,
    NeedNr: 2,
    NeedCall: 3,
    NeedCallNr: 4,
    NeedEnd: 5,
    Done: 6,
    Failed: 7
}



const NEVER = Number.MAX_SAFE_INTEGER
const FULL_PATIENCE = 5

export class DxOperator {
    constructor() {
        this.Call = "DJ1TF"
        this.Skills = 0
        this.Patience = FULL_PATIENCE
        this.RepeatCnt = 0
        this.State = OperatorState.Done
    }

    static CallCheckResult = {
        No: 0,
        Yes: 1,
        Almost: 2
    }

    static IsMyCall(My, His) {
        const W_X = 2
        const W_Y = 2
        const W_D = 2

        let C0 = My
        let C = His

        let result = this.CallCheckResult.No
        let M = Array.from(Array(C.length + 1), () => new Array(C0.length + 1))

        for (let y = 0; y < C0.length + 1; y++) M[0][y] = 0
        for (let x = 1; x < C.length + 1; x++) M[x][0] = M[x - 1][0] + W_X

        // levenshtein distance
        for (let x = 1; x < C.length + 1; x++)
            for (let y = 1; y < C0.length + 1; y++) {
                let T = M[x][y - 1]
                //'?' can match more than one char
                //end may be missing
                if ((x < C.length) && (C[x] !== '?')) T += W_Y

                let L = M[x - 1][y]
                //'?' can match no chars  
                if (C[x] !== '?') L += W_X

                let D = M[x - 1][y - 1]
                //'?' matches any char
                if (!(C[x] === C0[y] || (C[x] === '?'))) D += W_D
                M[x][y] = Math.min(T, D, L)
            }

        //classify by penalty
        switch (M[C.length][C0.length]) {
            case 0:
                result = this.CallCheckResult.Yes
                break
            case 1, 2:
                result = this.CallCheckResult.Almost
                break
            default:
                result = this.CallCheckResult.No
        }

        // partial match too short
        let no_questionmark = C.replaceAll('?', '')
        if (no_questionmark.length < 2) result = this.CallCheckResult.No

        return result
    }

    // Delay before reply, keying speed and exchange number are functions
    // of the operator's skills      
    GetSendDelay() {
        let result = 0
        if (this.State === OperatorState.NeedPrevEnd)
            result = NEVER;
        else result = 1
        /*        if (this.RunMode === RunMode.Hst) {}
                then Result := SecondsToBlocks(0.05 + 0.5*Random * 10/Wpm)
              else
                Result := SecondsToBlocks(0.1 + 0.5*Random);*/
    }

    GetWpm() {
        return DEFAULT.RATE
    }

    // Process an incoming message
    MsgReceived(AMsg) {
        if (AMsg.includes(StationMessage.CQ)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedQso:
                    this._DecPatience()
                    break
                case OperatorState.NeedNr || OperatorState.NeedCall ||
                    OperatorState.NeedCallNr:
                    this.State = OperatorState.Failed
                    break
                case OperatorState.NeedEnd:
                    this.State = OperatorState.Done
                    break
            }
            return
        }
        if (AMsg.includes(StationMessage.Nil)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedQso:
                    this._DecPatience()
                    break

                case OperatorState.NeedNr || OperatorState.NeedCall ||
                    OperatorState.NeedCallNr || OperatorState.NeedEnd:
                    this.State = OperatorState.Failed
                    break
            }
            return
        }
        if (AMsg.includes(StationMessage.HisCall)) {

            /*
    
        case IsMyCall of
          mcYes:
            if State in [osNeedPrevEnd, osNeedQso] then SetState(osNeedNr)
            else if State = osNeedCallNr then SetState(osNeedNr)
            else if State = osNeedCall then SetState(osNeedEnd);
    
          mcAlmost:
            if State in [osNeedPrevEnd, osNeedQso] then SetState(osNeedCallNr)
            else if State = osNeedNr then SetState(osNeedCallNr)
            else if State = osNeedEnd then SetState(osNeedCall);
    
          mcNo:
            if State = osNeedQso then State := osNeedPrevEnd
            else if State in [osNeedNr, osNeedCall, osNeedCallNr] then State := osFailed
            else if State = osNeedEnd then State := osDone;
          end;  
    
            */
        }

        if (AMsg.includes(StationMessage.B4)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd || OperatorState.NeedQso:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedNr || OperatingState.NeedEnd:
                    this._State = OperatorState.Failed
                    break
                case OperatorState.NeedCall || OperatorState.NeedCallNr: break; //same state: correct the call

            }
        }

        if (AMsg.includes(StationMessage.NR)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    break
                case OperatorState.NeedQso:
                    this.State = OperatingState.NeedPrevEnd
                    break
                case OperatorState.NeedNr:
                    if (Math.random() < 0.9 /*|| RunMode = rmHst*/)
                        this._SetState(OperatorState.NeedEnd)
                    break
                case OperatorState.NeedCall:
                    break
                case OperatorState.NeedCallNr:
                    if (Math.random() < 0.9) /*or (RunMode = rmHst)*/
                        this._SetState(OperatorState.NeedCall)
                    break
                case OperatorState.NeedEnd:
                    break
            }
        }

        if (AMsg.includes(StationMessage.TU)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(osNeedQso)
                    break
                case OperatorState.NeedEnd:
                    this.State = OperatorState.Done
                    break
                default: break
            }
        }

        if (AMsg.includes(StationMessage.Garbage))
            this._State = OperatorState.NeedPrevEnd


        if (this.State !== OperatorState.NeedPrevEnd) this._DecPatience()

    }

    _SetState(AState) {
        this.State = AState
        if (AState === OperatorState.NeedQso)
            this.Patience = Math.round(this.RndRayleigh(4))
        else this.Patience = FULL_PATIENCE
    }
    static RndRayleigh(AMean) {
        return AMean * Math.sqrt(-Math.Ln(Math.random) - Math.Ln(Math.random))
    }

    _DecPatience() {
        if (this.State === OperatorState.Done) return
        this.Patience--
        if (this.Patience < 1) this.State = OperatorState.Failed
    }


    GetReply() {
        switch (this.State) {
            case OperatorState.NeedPrevEnd || OperatorState.Done || OperatorState.Failed:
                return StationMessage.None;
            case OperatorState.NeedQso:
                return StationMessage.MyCall
            case OperatorState.NeedNr:
                if (this.Patience === (FULL_PATIENCE - 1) || (Math.random() < 0.3))
                    return StationMessage.NrQm
                else return StationMessage.Agn
            case OperatorState.NeedCall:
                if ((DEFAULT.RUNMODE === RunMode.Hst) || (Math.random() > 0.5))
                    return StationMessage.DeMyCallNr1
                else if (Math.random() > 0.25) return StationMessage.DeMyCallNr2
                else return StationMessage.MyCallNr2

            case OperatorState.NeedCallNr:
                if ((DEFAULT.RunMode === RunMode.Hst) || (MAth.random() > 0.5))
                    return StationMessage.DeMyCall1
                else return StationMessage.DeMyCall2

            default: //osNeedEnd:
                if (this.Patience < (FULL_PATIENCE - 1)) return StationMessage.NR
                else if ((DEFAULT.RunMode === RunMode.Hst) || (Math.random() < 0.9))
                    return StationMessage.R_NR
                else StationMessage.R_NR2
        }
    }


}
import { DEFAULT } from "./defaults.js"


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

const StationMessage = {
    None: 0,
    CQ: 1,
    NR: 2,
    TU: 3,
    MyCall: 4,
    HisCall: 5,
    B4: 6,
    Qm: 7,
    Nil: 8,
    Garbage: 9,
    R_NR: 10,
    R_NR2: 11,
    DeMyCall1: 12,
    DeMyCall2: 13,
    DeMyCallNr1: 14,
    DeMyCallNr2: 15,
    NrQm: 16,
    LongCQ: 17,
    MyCallNr2: 18,
    Qrl: 19,
    Qrl2: 20,
    Qsy: 21,
    Agn: 22
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


}
import { DEFAULT, StationMessage, RunMode,  OperatorState  } from "./defaults.js";
import { Station } from "./station.js"
import { DxOperator } from "./dxoperator.js"

export class DxStation extends Station {
    constructor(call) {
        super()
        this.MyCall = call
        this.HisCall = DEFAULT.CALL
        this.Oper = new DxOperator( ) 
        this.Oper._SetState(OperatorState.NeedPrevEnd)
        this.Wpm = this.Oper.Wpm
        this.NR = this.Oper.NR
    }
}
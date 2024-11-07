import { DEFAULT, StationMessage, RunMode, OperatorState } from "./defaults.js";
import { Station } from "./station.js"
import { DxOperator } from "./dxoperator.js"

import * as random from './random.js'

import { Tst } from "./contest.js"




export class DxStation extends Station {
    constructor(call) {
        super()
        this.MyCall = call
        this.HisCall = DEFAULT.CALL
        this.Oper = new DxOperator()
        this.Oper._SetState(OperatorState.NeedPrevEnd)
        this.Wpm = this.Oper.Wpm
        this.NR = this.Oper.NR
        /*
          Qsb := TQsb.Create;
        
          Qsb.Bandwidth := 0.1 + Random / 2;
          if Ini.Flutter and (Random < 0.3) then Qsb.Bandwidth := 3 + Random * 30;   
          */
        this.Amplitude = 9000 + 18000 * (1 + random.RndUShaped())
        this.Pitch = Math.round(random.RndGaussLim(0, 300))
        this.TimeOut = Station.NEVER
        this.State = Station.State.Copying
        console.log(Tst._MyStation)
    }




    ProcessEvent(AEvent) {
        if ( this.Oper.State === OperatorState.Done) return
        switch ( this.Oper.State ) {
          case Station.Event.MsgSent:
            if (Tst._MyStation.State === Station.Sending) 
                this.TimeOut = Station.NEVER 
            else this.Oper.GetReplyTimeout()
            break
          case Station.Event.Timeout:
          // he did not reply, quit or try again
          if (this.State === Station.State.Listening) {
            Oper.MsgReceived([msgNone])   
            if (this.Oper.State === OperatorState.Failed) return
            this.State = Station.State.PreparingToSend
          }
          // preparations to send are done, now send
          if (this.State === Station.State.PreparingToSend) 
            for (let i=1; i<= this.Oper.RepeatCnt;i++) this.SendMsg(this.Oper.GetReply())
          end;

          break




        }

        


        /*

    
      case AEvent of

    
        evTimeout:
          begin
          //he did not reply, quit or try again
          if State = stListening then
            begin
            Oper.MsgReceived([msgNone]);
            if Oper.State = osFailed then begin Free; Exit; end;
            State := stPreparingToSend;
            end;
          //preparations to send are done, now send
          if State = stPreparingToSend then
            for i:=1 to Oper.RepeatCnt do SendMsg(Oper.GetReply)
          end;
    
        evMeFinished: //he finished sending
          //we notice the message only if we are not sending ourselves
          if State <> stSending then
            begin
            //interpret the message
            case State of
              stCopying:
                Oper.MsgReceived(Tst.Me.Msg);
    
              stListening, stPreparingToSend:
               //these messages can be copied even if partially received
                if (msgCQ in Tst.Me.Msg) or (msgTU in Tst.Me.Msg) or (msgNil in Tst.Me.Msg)
                  then Oper.MsgReceived(Tst.Me.Msg)
                  else Oper.MsgReceived([msgGarbage]);
              end;
    
              //react to the message
              if Oper.State = osFailed
                then begin Free; Exit; end         //give up
                else TimeOut := Oper.GetSendDelay; //reply or switch to standby
              State := stPreparingToSend;
            end;
    
        evMeStarted:
          //If we are not sending, we can start copying
          //Cancel timeout, he is replying
          begin
          if State <> stSending then State := stCopying;
          TimeOut := NEVER;
          end;
        end;
    end;  
*/
    }




}
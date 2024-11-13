export const AudioMessage = {
  request_dx:  'request_dx',
  send_msg: 'send_msg',
  send_his: 'send_his',
  send_nr: 'send_nr',
  send_tu: 'send_tu',
  send_qu: 'send_qm',  
  create_dx: 'create_dx',
  advance: 'advance'

}

export const StationMessage = {
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

export const OperatorState = {
  NeedPrevEnd: 0,
  NeedQso: 1,
  NeedNr: 2,
  NeedCall: 3,
  NeedCallNr: 4,
  NeedEnd: 5,
  Done: 6,
  Failed: 7
}

export const RunMode = {
    Stop: 0, 
    Pileup: 1, 
    Single: 2, 
    Wpx: 3, 
    Hst: 4   
  }

export class DEFAULT {
    static RATE = 11025
    static BUFSIZE = 512
    static PASSES = 3
    static BANDWIDTH = 300
    static PITCH = 500
    static RUNMODE = RunMode.Single
    static CALL = 'DJ1TF'
    static WPM = 20
    static RIT = 0
}
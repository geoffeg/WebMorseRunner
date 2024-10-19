const RunMode = {
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
}
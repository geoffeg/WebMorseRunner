/* 
 * Details about squeeze keying as documented by DJ5IL
 * http://cq-cq.eu/DJ5IL_rt007.pdf
 */

let draw_count = 0
let last_time = performance.now()

const code_map = [
    [/<ka>/, '-.-.-'], // Message begins / Start of work 
    [/<sk>/, '...-.-'], //  End of contact / End of work
    [/<ar>/, '.-.-.'], // End of transmission / End of message
    [/<kn>/, '-.--.'], // Go ahead, specific named station.
    [/=/, '-...-'],
    [/a/, '.-'],
    [/b/, '-...'],
    [/c/, '-.-.'],
    [/d/, '-..'],
    [/e/, '.'],
    [/f/, '..-.'],
    [/g/, '--.'],
    [/h/, '....'],
    [/i/, '..'],
    [/j/, '.---'],
    [/k/, '-.-'],
    [/l/, '.-..'],
    [/m/, '--'],
    [/n/, '-.'],
    [/o/, '---'],
    [/p/, '.--.'],
    [/q/, '--.-'],
    [/r/, '.-.'],
    [/s/, '...'],
    [/t/, '-'],
    [/u/, '..-'],
    [/v/, '...-'],
    [/w/, '.--'],
    [/x/, '-..-'],
    [/y/, '-.--'],
    [/z/, '--..'],
    [/1/, '.----'],
    [/2/, '..---'],
    [/3/, '...--'],
    [/4/, '....-'],
    [/5/, '.....'],
    [/6/, '-....'],
    [/7/, '--...'],
    [/8/, '---..'],
    [/9/, '----.'],
    [/0/, '-----'],
    [/'/, '.-.-.-'],
    [/,/, '--..--'],
    [/\?/, '..--..'],
    [/'/, '.----.'],
    [/\//, '-..-.'],
    [/\./, '.-.-.-'],
    [/ä/, '.--.-'],
    [/ö/, '---.'],
    [/ü/, '..--'],
    [/ß/, '...--..'],
    [/\!/, '-.-.--'],
    [/\s+/, ' '], // whitespace is trimmed to single char
    [/./, ''] // ignore all unknown char
];


class Morse {
    constructor(ctx, wpm = 20, freq = 650, farnsworth = 999) {


        this._ctx = ctx; // web audio context

        this._gain = this._ctx.createGain()
        this._gain.connect(this._ctx.destination)
        //        const clip_vol = 1.8 * Math.exp(-0.115 * 12 )
        this._gain.gain.value = 0.5 * 0.5 * 0.6

        this._lpf = this._ctx.createBiquadFilter()
        this._lpf.type = "lowpass"
        this._lpf.frequency.setValueAtTime(freq, this._ctx.currentTime)
        this._lpf.Q.setValueAtTime(20, this._ctx.currentTime)
        this._lpf.connect(this._gain)

        this._cwGain = this._ctx.createGain()
        this._cwGain.gain.value = 0
        this._cwGain.connect(this._lpf)

        this._oscillator = this._ctx.createOscillator()
        this._oscillator.type = 'sine'
        this._oscillator.frequency.setValueAtTime(freq, this._ctx.currentTime)
        this._oscillator.connect(this._cwGain)
        this._oscillator.start()

        this._runId = 0;
        this._currPos = 0;
        this._state = 'INITIAL'

        this._wpm = Number(wpm);
        this._ditLen = this._ditLength(wpm * 5)
        this._farnsworth = Number(farnsworth)
        if (this._farnsworth > this._wpm) this._farnsworth = this._wpm
        this._spaceDitLen = this._ditLength(this._farnsworth * 5)

        this.frequency = freq

    }

    set wpm(w) {
        if (this._wpm === Number(w)) return
        this._wpm = Number(w)
        this._ditLen = this._ditLength(this._wpm * 5)
        if (this._farnsworth > this._wpm) this._farnsworth = this._wpm
        this._spaceDitLen = this._ditLength(this._farnsworth * 5)
        if (this._state !== 'INITIAL') {
            this._seqence = this._seqenceEvents(this._conv_to_morse(this._text));
            this._startTime = this._ctx.currentTime - this._seqence[this._currPos].time;
        }
    }

    set farnsworth(f) {
        if (this._farnsworth === f) return;
        this._farnsworth = Number(f);
        if (this._farnsworth > this._wpm) this._farnsworth = this._wpm;
        this._spaceDitLen = this._ditLength(this._farnsworth * 5);
        // need to recalc sequence
        if (this._state !== 'INITIAL') {
            this._seqence = this._seqenceEvents(this._conv_to_morse(this._text));
            this.startTime = this._ctx.currentTime - this._seqence[this._currPos].time;
        }
    }


    set text(txt) {
        if (this._text === txt) return;
        this._text = txt;
        this._currPos = 0;
        this._seqence = this._seqenceEvents(this._conv_to_morse(txt));
    }

    set displayCallback(callback) {
        this._displayCallback = callback;
    }


    set frequency(freq = 650) {
        this._freq = freq;

        this._lpf.frequency.setValueAtTime(freq, this._ctx.currentTime)
        this._oscillator.frequency.setValueAtTime(freq, this._ctx.currentTime)
    }


    get state() {
        return this._state;
    }

    start() {
        if (audioCtx.state !== 'running') {
            audioCtx.resume().then(() => this._morsePlay());
        } else this._morsePlay();
    }
    stop() {
        this._runId++
        this._state = 'STOPPED'
        this._cwGain.gain.cancelScheduledValues(this._ctx.currentTime)
        this._cwGain.gain.value = 0
        //       this._currPos -= this._scheduled
        const time = this._ctx.currentTime - this._startTime
        clearTimeout(this._stopTimer)
        // in case we already schedules all entries we need to set 
        // position to last element
        if (this._currPos >= this._seqence.length) this._currPos = this._seqence.length - 1
        for (; ;) {
            const seq = this._seqence[this._currPos]

            if ((time >= seq.time && seq.action === 'DISPLAY') || this._currPos == 0) break;
            this._currPos--
        }
        for (const timer of this._scheduled) {
            clearTimeout(timer)
        }
    }
    // https://github.com/cwilso/metronome/
    // https://www.html5rocks.com/en/tutorials/audio/scheduling/
    _morsePlay() {
        if (this._currPos >= this._seqence.length) this._currPos = 0
        switch (this._state) {
            case 'INITIAL':
                this._startTime = this._ctx.currentTime + 0.01
                break;
            case 'STOPPED':
                this._startTime = this._ctx.currentTime - this._seqence[this._currPos].time;
                break;
            //            case 'ENDED':
            //                this._currPos = 0;
            //               this._startTime = this._ctx.currentTime + 0.01
            //                break;
        }
        this._state = 'STARTED';
        // start time of the current player sequence
        let ahead = this._ditLen * 100; // number of time we look ahead for new events to play
        this._runId++;
        let currRun = this._runId;
        this._scheduled = []
        // schedule event regular     
        let scheduled = () => {

            if (currRun !== this._runId) return;
            let reschedule = true
            let current = this._ctx.currentTime;
            let delta = current - this._startTime;
            for (; ;) {
                if (this._currPos >= this._seqence.length) {
                    reschedule = false
                    if (this._seqence.length > 0) {
                        let ev = this._seqence[this._currPos - 1]

                        let milis = (ev.time - (current - this._startTime)) * 1000;
                        this._stopTimer = setTimeout(() => {
                            // executing now the first element in the scheduled events.
                            // need to remove it from array
                            this._state = 'INITIAL';
                            this._currPos = 0;

                        }, milis);
                    }
                    // this._gain.gain.exponentialRampToValueAtTime(0, this._ctx.currentTime + 1.00)
                    break; // exit look if current position reach end
                }
                let ev = this._seqence[this._currPos]; // pick current event
                if (ev.time < delta + ahead) { // check the event is part of current lookahead
                    this._currPos++;
                    switch (ev.action) {
                        case 'PLAY': {
                            switch (ev.tone) {
                                case '.': {
                                    this._cwGain.gain.setValueAtTime(1, this._startTime + ev.time)
                                    this._cwGain.gain.setValueAtTime(0, this._startTime + ev.time + this._ditLen)
                                    break;
                                }
                                case '_': {
                                    this._cwGain.gain.setValueAtTime(1, this._startTime + ev.time)
                                    this._cwGain.gain.setValueAtTime(0, this._startTime + ev.time + (this._ditLen * 3))
                                    break;
                                }
                            }
                            break;
                        }
                        case 'DISPLAY': {
                            let milis = (ev.time - (current - this._startTime)) * 1000;
                            const timerId = setTimeout(() => {
                                // executing now the first element in the scheduled events.
                                // need to remove it from array
                                this._scheduled.shift()
                                if (this._displayCallback) this._displayCallback(ev);
                            }, milis);
                            // Schedule gui event 
                            this._scheduled.push(timerId)
                            break;
                        }
                    }
                } else break;
            }
            if (this._state === 'STARTED' && reschedule) setTimeout(scheduled, (ahead * 1000) / 3);
        }
        scheduled();
    }

    _seqenceEvents(conv) {
        let seq = [];
        let current = 0;
        let currDits = 0;
        let currSpaceDits = 0;
        let currText = "";

        conv.forEach(letter => {
            switch (letter.pattern) {
                case ' ':
                    currText += ' ';
                    //                    seq.push({ time: current, dits: currDits, spaces: currSpaceDits, action: 'DISPLAY', value: ' ', text: currText });
                    current += this._spaceDitLen * 7;
                    currSpaceDits += 7;
                    seq.push({
                        time: current,
                        dits: currDits,
                        spaces: currSpaceDits,
                        action: 'DISPLAY',
                        value: ' ',
                        text: currText
                    });
                    break
                case '*':
                    current += this._spaceDitLen * 3
                    currSpaceDits += 3
                    break
                default:
                    let word = letter.pattern.split("").join("*");
                    currText += letter.text;
                    //                    seq.push({ time: current, dits: currDits, spaces: currSpaceDits, action: 'DISPLAY', value: letter.text, text: currText });
                    [...word].forEach(tone => {
                        currDits++;
                        switch (tone) {
                            case '.':
                                seq.push({
                                    time: current,
                                    dits: currDits,
                                    spaces: currSpaceDits,
                                    action: 'PLAY',
                                    tone: '.'
                                });
                                current += this._ditLen;
                                break
                            case '-':
                                seq.push({
                                    time: current,
                                    dits: currDits,
                                    spaces: currSpaceDits,
                                    action: 'PLAY',
                                    tone: '_'
                                });
                                current += this._ditLen * 3
                                currDits += 2
                                break
                            case '*':
                                current += this._ditLen;
                                break
                            default:
                                debugger
                        }
                    });
                    seq.push({
                        time: current,
                        dits: currDits,
                        spaces: currSpaceDits,
                        action: 'DISPLAY',
                        value: letter.text,
                        text: currText
                    });
                    break;
            }
        })
        return seq;
    }

    _conv_to_morse(str) {
        let low_str = str.toLowerCase();
        let offset = 0;
        let last_is_char = false;
        var result = [];
        for (; ;) {
            let length = 0;
            let pattern = "";
            for (let i = 0; i < code_map.length; i++) {
                let reg = code_map[i][0];
                let found = low_str.substr(offset).match(reg);
                if (found && found.index == 0) {
                    pattern = code_map[i][1];
                    length = found[0].length;
                    break;
                }
            }
            if (pattern != '') {
                if (pattern == ' ') {
                    result.push({
                        pattern: pattern
                    })
                    last_is_char = false;
                } else {
                    if (last_is_char) result.push({
                        pattern: '*'
                    });
                    result.push({
                        pattern: pattern,
                        offset: offset,
                        length: length,
                        text: low_str.substr(offset, length)
                    });
                    last_is_char = true;
                }
            }
            offset += length;
            if (offset === low_str.length) break;
        }
        return (result);
    }

    _ditLength(cpm) {
        // The standard word "PARIS" has 50 units of time. 
        // .--.  .-  .-.  ..  ... ==> "PARIS"
        // 10 dit + 4 dah + 9 dit space + 4 dah space = 19 dit + 24 dit = 43 dit.
        // 43 dit + 7 dit between words results in 50 dits total time
        //
        // 100cpm (character per minute) 
        // means we need to give 20 times to word "PARIS".
        // means we give 20 times 50 units of time = 1000 units of time per minute (or 60 seconds).
        // 60 seconds devided by 1000 unit of time, means each unit (dit) takes 60ms.
        // Means at  speed of 100 cpm  a dit has 60ms length
        // length of one dit in s = ( 60ms * 100 ) / 1000        
        const cpmDitSpeed = (60 * 100) / 1000;
        return cpmDitSpeed / cpm;
    }
}

const DIT = '.'
const DAH = '-'
const NONE = 'X'


const DOWN = 1
const UP = 2

const IAMBIC_A = 'A'
const IAMBIC_B = 'B'


const morse_map = {
    // alpha
    '.-': 'a',
    '-...': 'b',
    '-.-.': 'c',
    '-..': 'd',
    '.': 'e',
    '..-.': 'f',
    '--.': 'g',
    '....': 'h',
    '..': 'i',
    '.---': 'j',
    '-.-': 'k',
    '.-..': 'l',
    '--': 'm',
    '-.': 'n',
    '---': 'o',
    '.--.': 'p',
    '--.-': 'q',
    '.-.': 'r',
    '...': 's',
    '-': 't',
    '..-': 'u',
    '...-': 'v',
    '.--': 'w',
    '-..-': 'x',
    '-.--': 'y',
    '--..': 'z',
    // numbers   
    '.----': '1',
    '..---': '2',
    '...--': '3',
    '....-': '4',
    '.....': '5',
    '-....': '6',
    '--...': '7',
    '---..': '8',
    '----.': '9',
    '-----': '0',
    // punctuation   
    '--..--': ',',
    '..--..': '?',
    '.-.-.-': '.',
    '-...-': '=',
    '-..-.': '/',
    '-.-.--': '!',
    // Deutsche Umlaute
    '.--.-': 'ä',
    '---.': 'ö',
    '..--': 'ü',
    '...--..': 'ß',

    '-.-.-': '<ka>', // Message begins / Start of work 
    '...-.-': '<sk>', //  End of contact / End of work
    '.-.-.': '<ar>', // End of transmission / End of message
    '-.--.': '<kn>', // Go ahead, specific named station.    
    '........': '<error>' // Go ahead, specific named station. 
}

class Modulator {
    constructor() {
        this.FCarrierFreq = 600
        this.FSamplesPerSec = 5512
        this.FGain = 1
        this._CalcSinCos()
        this.FSampleNo = 0
    }

    set carrierFreq(Value) {
      this.FCarrierFreq = Value;
      this._CalcSinCos()
      this.FSampleNo = 0
    }

    set samplesPerSec(Value) {   
      this.FSamplesPerSec = Value
      this._CalcSinCos()
      this.FSampleNo = 0
    }  

    _CalcSinCos() {
        let Cnt = Math.round(this.FSamplesPerSec / this.FCarrierFreq)
        this.FCarrierFreq = this.FSamplesPerSec / Cnt
        let dFi = (Math.PI * 2) / Cnt

        this._Sn = new Array()
        this._Cs = new Array()

        this._Sn[0] = 0; this._Sn[1] = Math.sin(dFi)
        this._Cs[0] = 1; this._Cs[1] = Math.cos(dFi)

        //phase
        for (let i = 2; i <= Cnt - 1; i++) {
            this._Cs[i] = this._Cs[1] * this._Cs[i - 1] - this._Sn[1] * this._Sn[i - 1]
            this._Sn[i] = this._Cs[1] * this._Sn[i - 1] + this._Sn[1] * this._Cs[i - 1]
        }

        //gain
        for (let i = 0; i < Cnt; i++) {
            this._Cs[i] = this._Cs[i] * this.FGain;
            this._Sn[i] = this._Sn[i] * this.FGain;
        }
    }

    Modulate(Data) {
        let result = new Array()

        for (let i = 0; i < Data.Re.length; i++) {
            result.push(Data.Re[i] * this._Sn[this.FSampleNo] - Data.Im[i] * this._Cs[this.FSampleNo])
            this.FSampleNo = (this.FSampleNo + 1) % this._Cs.length
        }
        return result
    }   
    
}


class MovAvg {
    constructor() {
        this.FPasses = 3
        this.FPoints = 129
        this.FSamplesInInput = 512
        this.FDecimateFactor = 1
        this.FGainDb = 0
        this._Reset()
    }
    _Reset() {
        let number_of_buffers = this.FPasses + 1
        let buffer_size = this.FSamplesInInput + this.FPoints
        let initial_value = 0
        this.BufRe = Array.from(Array(number_of_buffers), _ => Array(buffer_size).fill(initial_value))
        this.BufIm = Array.from(Array(number_of_buffers), _ => Array(buffer_size).fill(initial_value))
        this._CalcScale();
    }
    _CalcScale() {
        this.FNorm = Math.pow(10, 0.05 * this.FGainDb) * Math.pow(this.FPoints, -this.FPasses)
        console.log("fnorm",this.FNorm)
   //     debugger;
    }
    set passes(pass) {
        this.FPasses = pass
        this._Reset()
    }

    set points(p) {
        this.FPoints = p
        this._Reset()
    }

    set samplesInInput(s) {
        this.FSamplesInInput = s
        this._Reset()
    }

    set decimateFactor(d) {
        this.FDecimateFactor = d
        this._Reset()
    }

    set gainDb(g) {
        this.FGainDb = g
        this._CalcScale()
    }

    Filter(AData) {
        let result = {
            Re: [],
            Im: []
        }
        result.Re = this._DoFilter(AData.Re, this.BufRe)
        result.Im = this._DoFilter(AData.Im, this.BufIm)
        return result
    }    

    _DoFilter(AData, ABuf) {
        // put new data at the end of the 0-th buffer
        this._PushArray(AData, ABuf[0]);
        // multi-pass
        for (let i=1; i<= this.FPasses; i++) this._Pass(ABuf[i-1], ABuf[i])
        // the sums are in the last buffer now, normalize and decimate result
        return this._GetResult(ABuf[this.FPasses])

    }
    _PushArray(Src, Dst) {
        let Len = Dst.length - Src.length
        // shift existing data to the left 
        for (let i = 0; i < Len; i++) Dst[i] = Dst[Src.length + i]
        // append new data
        for (let i = 0; i < Src.length; i++) Dst[Len + i] = Src[i]
    }

    _Pass(Src, Dst) {
        // make some free space in the buffer
        this._ShiftArray(Dst, this.FSamplesInInput);
        // calculate moving average recursively
        for (let i = this.FPoints; i < Src.length; i++) {
            Dst[i] = Dst[i - 1] - Src[i - this.FPoints] + Src[i]
        }
    }

    _ShiftArray(Dst, Count) {
        // shift data to the left
        const Len = Dst.length - Count
        for (let i = 0; i <= Len; i++) Dst[i] = Dst[Count + i]
    }

    _GetResult(Src) {
        let result = new Array()
        for (let i = 0; i < this.FSamplesInInput; i++ )
            result.push(Src[this.FPoints + i * this.FDecimateFactor] * this.FNorm)
        return result
    }
}

const  complex_noise = () => {
  const buffer_size = 512
  const noiseamp = 6000
  let result = {
    Re: [],
    Im: []
  }
  for(let i=0;i<buffer_size;i++) {
    result.Re.push( 3 * noiseamp * (Math.random()-0.5))
    result.Im.push( 3 * noiseamp * (Math.random()-0.5))    
  }
  return result
}

const DEFAULTRATE = 11025
const DEFAULTBUFSIZE = 512
const DEFAULTPASSES = 3
const BANDWIDTH = 300
const PITCH = 600

const contest = () => {
    let Filt = new MovAvg()
    let Filt2 = new MovAvg()  
    const audioCtx = new AudioContext();
    console.log("Samples per second ",audioCtx.sampleRate)
    Filt.points = Math.round(0.7 * DEFAULTRATE / BANDWIDTH)  
    Filt.passes =  DEFAULTPASSES
    Filt.samplesInInput = DEFAULTBUFSIZE
    Filt.gainDb = 10 * Math.log10(500/BANDWIDTH)    

    Filt2.passes =  DEFAULTPASSES
    Filt2.samplesInInput = DEFAULTBUFSIZE
    Filt2.gainDb = 10 * Math.log10(500/BANDWIDTH)       

    let Modul = new Modulator()
    Modul.samplesPerSec = DEFAULTRATE;
    Modul.carrierFreq = PITCH

    let ReIm = complex_noise()
    console.log(ReIm)

    Filt2.Filter(ReIm)
    ReIm = Filt.Filter(ReIm)
    let result = Modul.Modulate(ReIm)

    console.log(result)
 //   console.log(ReIm)
 //   debugger;
}

class MorseKeyer {
    constructor(volume = 100, wpm = 25, freq = 600, callback, keyMode) {
        const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
        if (isFirefox) this._outputDelay = 0.01; else this._outputDelay = 0

        this._started = false
        this._wpm = Number(wpm)
        this._freq = Number(freq)
        this._volume = Number(volume)
        this._ditLen = this._ditLength(this._wpm * 5)

        // set if dit/dah-key's pressed
        this._ditKey = UP
        this._dahKey = UP
        // memory a pressed dit key while dah key is pressed
        this._ditMemory = false
        // memory a pressed dah key while dit key is pressed
        this.dahMemory = false

        // the last element executed (e.g. to issue alternating elements on iambic action)
        this._lastElement = NONE
        // elements of the current letter are stored here
        this._currentLetter = ""
        this._displayCallback = displayCallback
        this._lastTime = 0

        this._currentElement = NONE

        if (key === "CURTIS_A")
            this, _keyerMode = 'A';
        else this._keyerMode = 'B'
    }

    _DEBUG(msg) {
        //  console.log(Math.round(performance.now()) + " : " + msg)
    }


    _ditLength(cpm) {
        // The standard word "PARIS" has 50 units of time. 
        // .--.  .-  .-.  ..  ... ==> "PARIS"
        // 10 dit + 4 dah + 9 dit space + 4 dah space = 19 dit + 24 dit = 43 dit.
        // 43 dit + 7 dit between words results in 50 dits total time
        //
        // 100cpm (character per minute) 
        // means we need to give 20 times to word "PARIS".
        // means we give 20 times 50 units of time = 1000 units of time per minute (or 60 seconds).
        // 60 seconds devided by 1000 unit of time, means each unit (dit) takes 60ms.
        // Means at  speed of 100 cpm  a dit has 60ms length
        // length of one dit in s = ( 60ms * 100 ) / 1000        
        const cpmDitSpeed = (60 * 100) / 1000;
        return cpmDitSpeed / cpm;
    }

    _displayLetter(l) {
        this._DEBUG(`Decoded: ${l}`)
        if (this._displayCallback) this._displayCallback(l)
    }

    set volume(vol = 50) {
        this.start()
        this._volume = vol
        let v = Math.pow(this._volume / 100, 3)  ////Math.exp( this._volume )
        this._totalGain.gain.setValueAtTime(v, this._ctx.currentTime)
    }

    set wpm(wpm = 50) {
        this._wpm = wpm
        this._ditLen = this._ditLength(this._wpm * 5)
    }

    set frequency(freq = 650) {
        this.start()
        this._freq = freq
        this._oscillator.frequency.setValueAtTime(this._freq, this._ctx.currentTime)
        this._lpf.frequency.setValueAtTime(this._freq, this._ctx.currentTime)
    }

    set keyer(key = 'CURTIS_B') {
        if (key === 'CURTIS_B') {
            this._keyerMode = 'B'
        } else this._keyerMode = 'A'
    }

    async start() {
        if (this._started === false) {
            this._started = true

            //            this._ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 }) // web audio context 
            //            this._ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 }) // web audio context 
            this._ctx = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 0,
                sampleRate: 96000
            }) // web audio context 

            console.log(this._ctx.sampleRate)
            console.log(this._ctx.baseLatency)

            this._gain = this._ctx.createGain()
            this._gain.connect(this._ctx.destination)

            this._gain.gain.value = 1

            this._lpf = this._ctx.createBiquadFilter()
            this._lpf.type = 'lowpass'

            this._lpf.frequency.setValueAtTime(this._freq, this._ctx.currentTime)
            this._lpf.Q.setValueAtTime(15, this._ctx.currentTime)

            this._lpf.connect(this._gain)

            await this._ctx.audioWorklet.addModule("morse-processor.js")

            // temp. implementation of a shared memory buffer  
            //            const gSAB = new SharedArrayBuffer(1024);
            //            myWorker.postMessage(buffer);

            this._cwGain = new AudioWorkletNode(
                this._ctx,
                "morse-processor",
            );
            this._cwGain.connect(this._lpf)

            //*********** */
            const sharedArray = new SharedArrayBuffer(4 * Int32Array.BYTES_PER_ELEMENT)
            this._cwGain.port.postMessage(sharedArray)
            this._sharedArray = new Int32Array(sharedArray);
            console.log("send array")
            //************ */
            this._totalGain = this._ctx.createGain()
            this.volume = this._volume
            this._totalGain.connect(this._cwGain)

            this._oscillator = this._ctx.createOscillator()
            this._oscillator.type = "sine"

            this._oscillator.frequency.setValueAtTime(this._freq, this._ctx.currentTime)
            this._oscillator.connect(this._totalGain)
            this._oscillator.start()

        }
    }

    _finalizeElement() {
        this._currentElement = NONE // stop producing element

        this._lastTime = (new Date()).getTime()
        if (morse_map[this._currentLetter])
            this._displayLetter(morse_map[this._currentLetter]);
        else this._displayLetter('*')
        this._currentLetter = ""
    }


    _appendElement(e) {
        // to detect we need to output a space (intra word distance) 
        // we check to see at least 6 dits since the last character end. 
        // Detail are 7 dit length but 6 is for more tolerance        
        let delta = 0
        let now = (new Date()).getTime()
        if (this._lastTime > 0 && this._currentLetter === "") delta = Math.abs(now - this._lastTime)
        // one dit already passed when _appendElement is called another 6 
        // did for inter character  
        if (delta > 6 * this._ditLen * 1000) this._displayLetter(' ')
        // append element to build letters
        this._currentLetter += e
    }

    endElement() {
        // at ending of a element:
        // 1) Check if current ending element key is released and clear memory
        // 2) play the opposite element if memory set OR check if current element is set

        if (this._currentElement === DIT) {
            // clear dit Memory if key is not pressed
            if (this._ditKey === UP) this._ditMemory = false

            // IAMBIC B: reply on Memory to decide continue
            // IAMBIC C: check the paddle state and memory.
            if (this._keyerMode === IAMBIC_B) {
                // start dah if memory is set
                if (this._dahMemory) this.startElement(DAH); // opposite element
                else if (this._ditMemory) this.startElement(DIT); else this._finalizeElement()
            } else if (this._keyerMode === IAMBIC_A) {
                if (this._dahMemory || this._dahKey === DOWN) this.startElement(DAH); // opposite element
                else if (this._ditKeyKey === DOWN) this.startElement(DIT); else this._finalizeElement()
            }

        } else { // ending dah element
            // clear dad Memory if key is not pressed
            if (this._dahKey === UP) this._dahMemory = false
            // start dit element if memory is set
            if (this._keyerMode === IAMBIC_B) {
                if (this._ditMemory) this.startElement(DIT); // opposit element
                else if (this._dahMemory) this.startElement(DAH); else this._finalizeElement()
            } else if (this._keyerMode === IAMBIC_A) {
                if (this._ditMemory || this._ditKey === DOWN) this.startElement(DIT); // opposite element
                else if (this._dahKey === DOWN) this.startElement(DIT); else this._finalizeElement()
            }
        }
    }

    startElement(element) {
        this._currentElement = element

        // play audio
        let now = this._ctx.currentTime + this._outputDelay
        this._appendElement(element)
        //      this._lastElement = element
        //this._cwGain.gain.setValueAtTime(1, now)

        this._cwGain.parameters.get("gain").setValueAtTime(1, now)

        // Schedule the ending of the element
        if (element === DIT) {
            this._cwGain.parameters.get("gain").setValueAtTime(0, now + this._ditLen)
            //            this._cwGain.gain.setValueAtTime(0, now + this._ditLen)

            setTimeout(() => { this.endElement() }, 2 * this._ditLen * 1000, 0)
        } else {
            //            this._cwGain.gain.setValueAtTime(0, now + 3 * this._ditLen)
            this._cwGain.parameters.get("gain").setValueAtTime(0, now + 3 * this._ditLen)
            setTimeout(() => { this.endElement() }, 4 * this._ditLen * 1000, 0)
        }
    }

    async keydown(key) {
        await this.start()
        if (key === DAH) {
            // for IAMBIC_A we only set memory during opposide element executed
            // for IAMBIC_B we set memory always
            if ((this._keyerMode === IAMBIC_A && this._currentElement === DIT) || this._keyerMode === IAMBIC_B)
                this._dahMemory = true
            this._dahKey = DOWN
        } else {
            if ((this._keyerMode === IAMBIC_A && this._currentElement === DAH) || this._keyerMode === IAMBIC_B)
                this._ditMemory = true;
            // new sharedArray
            Atomics.store(this._sharedArray, DIT, 1)
            this._ditKey = DOWN
        }
        if (this._currentElement === NONE) this.startElement(key)
    }
    keyup(key) {
        if (key === DAH) this._dahKey = UP; else this._ditKey = UP
    }
}


// MIDI functions

let morseKeyer;

connectMIDI = () => {
    navigator.requestMIDIAccess({ sysex: false })
        .then(
            (midi) => midiReady(midi),
            (err) => console.log('Something went wrong', err));
}

function midiReady(midi) {
    midi.addEventListener('statechange', (event) => initDevices(event.target));
    initDevices(midi);
}

function initDevices(midi) {
    midiIn = [];
    midiOut = [];

    // Inputs
    const inputs = midi.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        midiIn.push(input.value);
    }

    // Outputs
    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
        midiOut.push(output.value);
    }
    startListening();
}

function startListening() {
    for (const input of midiIn) {
        input.addEventListener('midimessage', midiMessageReceived);
    }
}

function midiMessageReceived(event) {
    const NOTE_ON = 9;
    //    const NOTE_OFF = 8;

    const PITCH_DIT = 48;
    //    const PITCH_DAH = 50;

    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];

    if (cmd === NOTE_ON) {
        if (pitch == PITCH_DIT) morseKeyer.keydown(DIT); else morseKeyer.keydown(DAH)
    } else {
        if (pitch == PITCH_DIT) morseKeyer.keyup(DIT); else morseKeyer.keyup(DAH)
    }
}

window.onload = () => {
    const button = document.getElementById("start")
    console.log("main")
    contest();
    
    button.onclick = async () => {
        console.log("Start")


        let Filt = new MovAvg()
        let Filt2 = new MovAvg()  
        const audioCtx = new AudioContext();
        console.log("Samples per second ",audioCtx.sampleRate)
        Filt.points = Math.round(0.7 * DEFAULTRATE / BANDWIDTH)  
        Filt.passes =  DEFAULTPASSES
        Filt.samplesInInput = DEFAULTBUFSIZE
        Filt.gainDb = 10 * Math.log10(500/BANDWIDTH)    
    
        Filt2.passes =  DEFAULTPASSES
        Filt2.samplesInInput = DEFAULTBUFSIZE
        Filt2.gainDb = 10 * Math.log10(500/BANDWIDTH)       
    
        let Modul = new Modulator()
        Modul.samplesPerSec = DEFAULTRATE;
        Modul.carrierFreq = PITCH
    


        let ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 })

        const sampleRate = 11025 // samples per second 
        const numberOfSeconds = 15
        const myArrayBuffer = ctx.createBuffer(
            1,
            sampleRate * numberOfSeconds,
            sampleRate
        );
        const source = ctx.createBufferSource();

        let ReIm = complex_noise()
        let buffer_pos=0
        Filt2.Filter(ReIm)
        ReIm = Filt.Filter(ReIm)
        let result = Modul.Modulate(ReIm)
        for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
            // This gives us the actual ArrayBuffer that contains the data
            const nowBuffering = myArrayBuffer.getChannelData(channel);
            for (let i = 0; i < myArrayBuffer.length; i++) {
            
                if(buffer_pos === DEFAULTBUFSIZE) {
                    ReIm = complex_noise()
                    buffer_pos=0
                    Filt2.Filter(ReIm)
                    ReIm = Filt.Filter(ReIm)
                    result = Modul.Modulate(ReIm)                       
                } 
                // audio needs to be in [-1.0; 1.0]
                nowBuffering[i] = result[buffer_pos] / 32800
                buffer_pos++
                //console.log(nowBuffering[i])

            }
        }
        console.log("finish buffer")

        // set the buffer in the AudioBufferSourceNode
        source.buffer = myArrayBuffer;
        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(ctx.destination);
        // start the source playing
        source.start();

/*        
        const bandwidth = 200;
        const center_freq = 700;

        let noiseFilterL = ctx.createBiquadFilter();
        let noiseFilterH = ctx.createBiquadFilter();
        whiteNoise = ctx.createBufferSource();

        noiseFilterL.type = "lowpass";
        noiseFilterL.frequency.setValueAtTime(200, ctx.currentTime);
        noiseFilterL.Q.setValueAtTime(20, ctx.currentTime);

        noiseFilterH.type = "highpass";
        noiseFilterH.frequency.setValueAtTime(600, ctx.currentTime);
        noiseFilterH.Q.setValueAtTime(20, ctx.currentTime);

        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;

        var bufferSize = 2 * ctx.sampleRate;

        var noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var noise = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            noise[i] = Math.random() * 0.5 - 1;
        }
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);
        whiteNoise.connect(noiseFilterL);
        noiseFilterL.connect(noiseFilterH);
        noiseFilterH.connect(ctx.destination);
*/
   /*     let q = Math.sqrt( Math.pow(2, bandwidth) ) / ( Math.pow(2, bandwidth) - 1 )
        console.log("q",q)
        filter.Q.value = center_freq  / bandwidth;
     */
    /*    await ctx.audioWorklet.addModule('noise-generator.js');        
        let noiseGeneratorNode = new AudioWorkletNode(ctx, 'noise-generator');
        noiseGeneratorNode.connect(noiseFilterL);
     */  
    
    /*    filter.connect(ctx.destination);*/
        /*
                var noiseData = new Float32Array(44100 * 5);
                var noiseBuffer = null;
        
                // http://noisehack.com/generate-noise-web-audio-api/
                var lastOut = 0;
        
                for (var i = 0, imax = noiseData.length; i < imax; i++) {
                    var white = Math.random() * 2 - 1;
        
                    noiseData[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = noiseData[i];
                    noiseData[i] *= 3.5; // (roughly) compensate for gain       
                }
        
                if (noiseBuffer === null) {
                    noiseBuffer = audioContext.createBuffer(1, noiseData.length, audioContext.sampleRate);
                    noiseBuffer.getChannelData(0).set(noiseData);
                }
        
        
                let ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 })
                var bufferSource = audioContext.createBufferSource();
        
                bufferSource.buffer = noiseBuffer;
                bufferSource.loop = true;
        
                this.bufferSource.start()
                */
    }
    /*
    
        connectMIDI();
        // https://stackoverflow.com/questions/7944460/detect-safari-browser    
        var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
        window.focus()
    
        // to stop key repeats that can happen on windows.
        // We store all keydowns received and set to false once key up.
        // so if we get keydow twice we will only recognize it one time.
        var keyAllowed = {}
    
        // restore settings from local storage
        let setting = JSON.parse(localStorage.getItem("setting"));
        if (setting) {
            document.getElementById("vol").value = setting.vol
            document.getElementById("wpm").value = setting.wpm
            document.getElementById("freq").value = setting.freq
            document.getElementById("key").value = setting.key
        }
    
        let vol = parseInt(document.getElementById("vol").value)
        let wpm = parseInt(document.getElementById("wpm").value)
        let freq = parseInt(document.getElementById("freq").value)
        let key = document.getElementById("key").value
    
        // define function to update the letters detected
        const out = document.getElementById("out")
        const callBack = displayCallback = (text) => {
            out.textContent += text;
            out.scrollTop = out.scrollHeight;
        }
    
        morseKeyer = new MorseKeyer(vol, wpm, freq, callBack, key)
    
        const storeSetting = function (e) {
            let config = {
                vol: document.getElementById("vol").value,
                wpm: document.getElementById("wpm").value,
                freq: document.getElementById("freq").value,
                key: document.getElementById("key").value,
            }
            morseKeyer.volume = config.vol
            morseKeyer.wpm = config.wpm
            morseKeyer.frequency = config.freq
            morseKeyer.keyMode = config.key
            localStorage.setItem("setting", JSON.stringify(config))
        }
    
        document.getElementById("vol").onchange = storeSetting
        document.getElementById("freq").onchange = storeSetting
        document.getElementById("wpm").onchange = storeSetting
        document.getElementById("key").onchange = storeSetting
    
        document.getElementById("freq_value").textContent = document.getElementById("freq").value
        document.getElementById("freq").addEventListener("input", (event) => {
            document.getElementById("freq_value").textContent = event.target.value;
        });
    
    
        document.getElementById("wpm_value").textContent = document.getElementById("wpm").value
        document.getElementById("wpm").addEventListener("input", (event) => {
            document.getElementById("wpm_value").textContent = event.target.value;
        });
    
        window.onkeydown = function (e) {
            // Problem in Safari: it return 2nd key down event if both ctrl key pressed instead of keyup
            // this prevents multiple keydowns on windows 
            if (!isSafari && keyAllowed[e.code] === false) return;
            keyAllowed[e.code] = false
            if (e.code === "ShiftLeft" || e.code === "ControlLeft" || e.code === "Period") {
                if (isSafari && morseKeyer._ditKey === DOWN) morseKeyer.keyup(DIT);
                else morseKeyer.keydown(DIT)
            }
            if (e.code === "ShiftRight" || e.code === "ControlRight" || e.code === "Slash") {
                if (isSafari && morseKeyer._dahKey === DOWN) morseKeyer.keyup(DAH);
                else morseKeyer.keydown(DAH)
            }
        }
        window.onkeyup = function (e) {
            keyAllowed[e.code] = true;
            if (e.code == "ShiftLeft" || e.code === "ControlLeft" || e.code === "Period") {
                morseKeyer.keyup(DIT)
            }
            if (e.code == "ShiftRight" || e.code === "ControlRight" || e.code === "Slash") {
                morseKeyer.keyup(DAH)
            }
        }
    */
}

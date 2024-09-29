
const MorseMap = new Map([
    ['<ka>', '-.-.-'], // Message begins / Start of work 
    ['<sk>', '...-.-'], //  End of contact / End of work
    ['<ar>', '.-.-.'], // End of transmission / End of message
    ['<kn>', '-.--.'], // Go ahead, specific named station.
    ['=', '-...-'],
    ['a', '.-'],
    ['b', '-...'],
    ['c', '-.-.'],
    ['d', '-..'],
    ['e', '.'],
    ['f', '..-.'],
    ['g', '--.'],
    ['h', '....'],
    ['i', '..'],
    ['j', '.---'],
    ['k', '-.-'],
    ['l', '.-..'],
    ['m', '--'],
    ['n', '-.'],
    ['o', '---'],
    ['p', '.--.'],
    ['q', '--.-'],
    ['r', '.-.'],
    ['s', '...'],
    ['t', '-'],
    ['u', '..-'],
    ['v', '...-'],
    ['w', '.--'],
    ['x', '-..-'],
    ['y', '-.--'],
    ['z', '--..'],
    ['1', '.----'],
    ['2', '..---'],
    ['3', '...--'],
    ['4', '....-'],
    ['5', '.....'],
    ['6', '-....'],
    ['7', '--...'],
    ['8', '---..'],
    ['9', '----.'],
    ['0', '-----'],
    ['\'', '.-.-.-'],
    ['?', '..--..'],
    ['/', '-..-.'],
    ['.', '.-.-.-']
])




class Keyer {
    constructor() {
        this.Rate = 11025
        this.RiseTime = 0.005
        this.FRiseTime = 0.005
        this.Wpm = 20
        this.BufSize = 512
        this.MorseMsg = this.Encode('DJ1TF')
        this._MakeRamp()
    }

    set riseTime(Value) {
        this.FRiseTime = Value;
        this._MakeRamp()
    }

    _BlackmanHarrisKernel(x) {
        const a0 = 0.35875
        const a1 = 0.48829
        const a2 = 0.14128
        const a3 = 0.01168
        return a0 - a1 * Math.cos(2 * Math.PI * x) + a2 * Math.cos(4 * Math.PI * x) - a3 * Math.cos(6 * Math.PI * x)
    }

    _BlackmanHarrisStepResponse(Len) {
        let result = new Array()
        // generate kernel
        for (let i = 0; i < Len; i++) result.push(this._BlackmanHarrisKernel(i / Len))
        // integrate
        for (let i = 1; i < Len; i++) result[i] = result[i - 1] + result[i]
        // normalize
        let Scale = 1 / result[Len - 1]
        for (let i = 0; i < Len; i++) result[i] = result[i] * Scale;
        return result
    }

    _MakeRamp() {
        this._RampLen = Math.round(2.7 * this.FRiseTime * this.Rate)
        this._RampOn = this._BlackmanHarrisStepResponse(this._RampLen)
        this._RampOff = new Array()
        for (let i = 0; i <= this._RampLen - 1; i++)
            this._RampOff[this._RampLen - i - 1] = this._RampOn[i]
    }

    Encode(Txt) {
        let result = ''
        for (let i = 0; i < Txt.length; i++) {
            if (Txt[i] === ' ' || Txt[i] === '_') result = result + ' '
            else result = result + MorseMap.get(Txt[i].toLowerCase()) + ' '
        }
        if (result !== '') result += '~'
        return result
    }

    GetEnvelope() {
        let UnitCnt = 0
        let p = 0
        let result = new Array()

        const AddRampOn = () => {
            for (let i = 0; i < this._RampLen; i++) result[p + i] = this._RampOn[i]
            p += this._RampLen
        }

        const AddRampOff = () => {
            for (let i = 0; i < this._RampLen; i++) result[p + i] = this._RampOff[i]
            p += this._RampLen
        }

        const AddOff = (Dur) => {
            for (let i = 0; i < Dur * SamplesInUnit - this._RampLen; i++) result[p + i] = 0
            p += Dur * SamplesInUnit - this._RampLen
        }

        const AddOn = (Dur) => {
            for (let i = 0; i < Dur * SamplesInUnit - this._RampLen; i++) result[p + i] = 1
            p += Dur * SamplesInUnit - this._RampLen
        }

        for (let i = 0; i < this._MorseMsg; i++) {
            switch (this._MorseMsg[i]) {
                case '.': UnitCnt += 2
                    break
                case '-': UnitCnt += 4
                    break
                case ' ': UnitCnt += 2
                    break
                case '~': UnitCnt++
                    break

            }
        }

        //calc buffer size
        let SamplesInUnit = Math.round(0.1 * this.Rate * 12 / this.Wpm);
        //       let TrueEnvelopeLen = UnitCnt * SamplesInUnit + this._RampLen;
        //       let Len = this.BufSize * Math.ceil(TrueEnvelopeLen / this.BufSize);       
        result = new Array()
        for (let i = 0; i < this.MorseMsg.length; i++) {
            switch (this.MorseMsg[i]) {
                case '.':
                    AddRampOn()
                    AddOn(1)
                    AddRampOff()
                    AddOff(1)
                    break
                case '-':
                    AddRampOn()
                    AddOn(3)
                    AddRampOff()
                    AddOff(1)
                    break
                case ' ': AddOff(1)
                    break
                case '~': AddOff(1)
                    break
            }

        }
        return result

    }
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



const DEFAULTRATE = 11025
const DEFAULTBUFSIZE = 512
const DEFAULTPASSES = 3
const BANDWIDTH = 300
const PITCH = 500

// They Keyer Unit exports a Keyer Variable
// TODO: Fix this! Temporary we just declair a global object
let GKeyer = new Keyer()

const NEVER = Number.MAX_VALUE

class Station {
    static stListening = 1
    static stCopying = 2
    static stPreparingToSend = 3
    static stSending = 4

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
    }

    _GetBfo() {
        let result = this._FBfo
        this._FBfo = this._FBfo + this._dPhi
        if (this._FBfo > Math.PI * 2) this._FBfo -= Math.PI * 2
        return XPathResult
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
        for (let i = 0; i < DEFAULTBUFSIZE && this._SendPos + i < this._Envelope.length; i++) {
            result.push(this._Envelope[this._SendPos + i])
        }
        // advance TX buffer
        this._SendPos += DEFAULTBUFSIZE;
        if (this._SendPos >= this._Envelope.length) this._Envelope = null
        return result
    }



    SetPitch(Value) {
        this._FPitch = Value;
        dPhi = Math.PI * 2 * this._FPitch / DEFAULTRATE
    }

}


class Volume {
    constructor() {
        this._FMaxOut = 20000
        this._FNoiseIn = 1
        this._FNoiseOut = 2000
        this._CalcBeta()
        this._FAttackSamples = 28
        this._FHoldSamples = 28
        this._MakeAttackShape()
    }

    set NoiseInDb(Value = 76) {
        this._FNoiseIn = Math.pow(10, 0.05 * Value)
        this._CalcBeta()
    }

    set NoiseOutDb(Value) {
        this._FNoiseOut = Math.min(0.25 * this._FMaxOut, Math.pow(10, 0.05 * Value))
        this._CalcBeta()
    }

    set MaxOut(Value) {
        this._FMaxOut = Value;
        this._CalcBeta()
    }

    set AttackSamples(Value) {
        this._FAttackSamples = Math.max(1, Value)
        this._MakeAttackShape()
    }

    set HoldSamples(Value) {    
      this._FHoldSamples = Math.max(1, Value)
      this._MakeAttackShape()
    }  

    set AgcEnabled(Value) {

        if (Value && !this._FAgcEnabled) this._Reset()
        this._FAgcEnabled = Value
    } 


    _CalcBeta() {
        this._FBeta = this._FNoiseIn / Math.log(this._FMaxOut / (this._FMaxOut - this._FNoiseOut))
        this._FDefaultGain = this._FNoiseOut / this._FNoiseIn
    }


    _MakeAttackShape() {
        this._FLen = 2 * (this._FAttackSamples + this._FHoldSamples) + 1
        this._FAttackShape = new Array()


        // attack shape
        for (let i = 0; i < this._FAttackSamples; i++) {
            this._FAttackShape[i] = Math.log(0.5 - 0.5 * Math.cos((i + 1) * Math.PI / (this._FAttackSamples + 1)))
            this._FAttackShape[this._FLen - 1 - i] = this._FAttackShape[i]
        }

        this._Reset()
    }

    _Reset() {
        this._FRealBuf = new Float64Array(this._FLen)
        // TODO: Check if / how we can/should clear out ComplexBuffer?
        /*
          ClearReIm(FComplexBuf);
          SetLengthReIm(FComplexBuf, FLen);     
        */
        this._FMagBuf = new Float64Array(this._FLen);
        console.log("init:", this._FMagBuf)
        this._FBufIdx = 0
    }

    CalcAgcGain() {
        // look at both sides of the sample
        // and find the max. magnitude, weighed by FAttackShape
        let Envel = 1E-10
        let Di = this._FBufIdx
        for (let Wi = 0; Wi < this._FLen; Wi++) {
            let Sample = this._FMagBuf[Di] + this._FAttackShape[Wi]
            if (Sample > Envel) Envel = Sample
            Di++
            if (Di === this._FLen) Di = 0

        }
        // envelope
        this._FEnvelope = Envel;
        Envel = Math.exp(Envel)

        // gain
        let result = this._FMaxOut * (1 - Math.exp(-Envel / this._FBeta)) / Envel
        return result
    }


    _ApplyAgc(V) {
        // store data
        this._FRealBuf[this._FBufIdx] = V
        this._FMagBuf[this._FBufIdx] = Math.log(Math.abs(V + 1E-10))

        // increment index
        this._FBufIdx = (this._FBufIdx + 1) % this._FLen

        // output
        let result = this._FRealBuf[(this._FBufIdx + Math.floor(this._FLen / 2)) % this._FLen] * this.CalcAgcGain()
        return result
    }

    _ApplyDefaultGain(V) {

        let result = Math.min(this._FMaxOut, Math.max(-this._FMaxOut, V * this._FDefaultGain))
        this._FIsOverload = this._FIsOverload || (Math.abs(result) = this._FMaxOut)
        return result
    }

    Process(Data) {
        // Whats this?
        this._FIsOverload = false

        let result = new Array(Data.length)

        if (this._FAgcEnabled) {
            for (let i = 0; i < result.length; i++) {
                result[i] = this._ApplyAgc(Data[i])
            }
        } else {
            for (let i = 0; i < result.length; i++) {
                result[i] = this._ApplyDefaultGain(Data[i])
            }
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
        for (let i = 1; i <= this.FPasses; i++) this._Pass(ABuf[i - 1], ABuf[i])
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
        for (let i = 0; i < this.FSamplesInInput; i++)
            result.push(Src[this.FPoints + i * this.FDecimateFactor] * this.FNorm)
        return result
    }
}

const complex_noise = () => {
    const buffer_size = 512
    const noiseamp = 6000
    let result = {
        Re: [],
        Im: []
    }
    for (let i = 0; i < buffer_size; i++) {
        result.Re.push(3 * noiseamp * (Math.random() - 0.5))
        result.Im.push(3 * noiseamp * (Math.random() - 0.5))
    }
    return result
}



const contest = () => {
    let Filt = new MovAvg()
    let Filt2 = new MovAvg()
    const audioCtx = new AudioContext();
    console.log("Samples per second ", audioCtx.sampleRate)
    Filt.points = Math.round(0.7 * DEFAULTRATE / BANDWIDTH)
    Filt.passes = DEFAULTPASSES
    Filt.samplesInInput = DEFAULTBUFSIZE
    Filt.gainDb = 10 * Math.log10(500 / BANDWIDTH)

    Filt2.passes = DEFAULTPASSES
    Filt2.samplesInInput = DEFAULTBUFSIZE
    Filt2.gainDb = 10 * Math.log10(500 / BANDWIDTH)

    let Modul = new Modulator()
    Modul.samplesPerSec = DEFAULTRATE;
    Modul.carrierFreq = PITCH

    let ReIm = complex_noise()
    console.log(ReIm)

    Filt2.Filter(ReIm)
    ReIm = Filt.Filter(ReIm)
    let result = Modul.Modulate(ReIm)


   // console.log(result)


    let key = new Keyer()
    console.log(key.Encode('DJ1TF test'))
    key.GetEnvelope()


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

window.onload = () => {
    const button = document.getElementById("start")
    console.log("main")
    contest();

    button.onclick = async () => {
        console.log("Start")


        let Filt = new MovAvg()
        let Filt2 = new MovAvg()
        const audioCtx = new AudioContext();
        console.log("Samples per second ", audioCtx.sampleRate)
        Filt.points = Math.round(0.7 * DEFAULTRATE / BANDWIDTH)
        Filt.passes = DEFAULTPASSES
        Filt.samplesInInput = DEFAULTBUFSIZE
        Filt.gainDb = 10 * Math.log10(500 / BANDWIDTH)

        Filt2.passes = DEFAULTPASSES
        Filt2.samplesInInput = DEFAULTBUFSIZE
        Filt2.gainDb = 10 * Math.log10(500 / BANDWIDTH)


        let Agc = new Volume()
        Agc.NoiseInDb = 76
        Agc.NoiseOutDb = 76
        Agc.AttackSamples = 155   // AGC attack 5 ms
        Agc.HoldSamples = 155
        Agc.AgcEnabled = true


        let MyStation = new Station()
        MyStation.SendText("DJ1TF")

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
        let buffer_pos = 0
        Filt2.Filter(ReIm)
        ReIm = Filt.Filter(ReIm)
        
        let result = Modul.Modulate(ReIm)
 //       result = Agc.Process(result)
        for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
            // This gives us the actual ArrayBuffer that contains the data
            const nowBuffering = myArrayBuffer.getChannelData(channel);
            for (let i = 0; i < myArrayBuffer.length; i++) {

                if (buffer_pos === DEFAULTBUFSIZE) {
                    ReIm = complex_noise()
                    let blk = MyStation.GetBlock()

                    if (blk && blk !== null) {

                        for (let n = 0; n < blk.length; n++) {
                            ReIm.Im[n] = 0.59 * blk[n]
                            ReIm.Re[n] = 0.59 * blk[n]
                        }
                    }
                    buffer_pos = 0
                    Filt2.Filter(ReIm)
                    ReIm = Filt.Filter(ReIm)
                    result = Modul.Modulate(ReIm)
                    result = Agc.Process(result)
                    

                }
                // audio needs to be in [-1.0; 1.0]
                nowBuffering[i] = result[buffer_pos] / 32800
                buffer_pos++
                //console.log(nowBuffering[i])

            }
        }
        console.log("finish buffer")

        // set the buffer in the AudioBufferSourceNode
        source.buffer = myArrayBuffer
        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(ctx.destination)
        // start the source playing
        source.start()
    }
    
}

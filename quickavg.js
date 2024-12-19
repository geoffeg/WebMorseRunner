
class QuickAverage {

    constructor() {
        this.FPoints = 128
        this.FPasses = 4
        this.Reset()
    }

    Filter(ARe, AIm) {
        let re = this._DoFilter(ARe, this.ReBufs)
        let im = this._DoFilter(AIm, this.ImBufs)
        return { Re: re, Im: im }
    }

    Reset() {
        const number_of_buffers = this.FPasses + 1

        this.ReBufs = Array.from(Array(number_of_buffers), _ => new Float32Array(this.FPoints))
        this.ImBufs = Array.from(Array(number_of_buffers), _ => new Float32Array(this.FPoints))


        this.FScale = Math.pow(this.FPoints, -this.FPasses)
        this.Idx = 0
        this.PrevIdx = this.FPoints - 1        
    }

    set passes(value) {
        this.FPasses = Math.max(1, Math.min(8, value));
        this.Reset();  
    }

    set points(value) {
        this.FPoints = Math.max(1, value);
        this.Reset();  
    }

}

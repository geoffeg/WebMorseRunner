
class QuickAverage {

    constructor() {
        this.FPoints = 128
        this.FPasses = 4
        this.Reset()
    }

    Filter(ARe, AIm) {
        let re = this._DoFilter(ARe, this.BufRe)
        let im = this._DoFilter(AIm, this.BufIm)
        return { Re: re, Im: im }
    }

    Reset() {

        this.ReBufs = nil
        this.SetLength(this.ReBufs, this.FPasses + 1, this.FPoints)

        this.ImBufs = nil
        this.SetLength(this.ImBufs, this.FPasses + 1, this.FPoints)

        FScale = Math.pow(this.FPoints, -this.FPasses)
        this.Idx = 0
        this.PrevIdx = this.FPoints - 1

    }

}

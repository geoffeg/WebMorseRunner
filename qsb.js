import { DEFAULT } from "./defaults.js"
import * as random from "./random.js"
import { MovAvg } from "./movavg.js"

export class Qsb {
    constructor() {
        this.Filter = new MovAvg()
        this.Filter.passes = 3
        this.Qsb = 1
        this.Bandwidth = 0.1
        this.FGain = 1
    }

    NewGain() {
        let c = this.Filter.FilterSingle(random.RndUniform(), random.RndUniform())
        let result = Sqrt((Sqr(c.Re) + Sqr(c.Im)) * 3 * this.Filter.points)
        result *= this.QsbLevel + (1 - this.QsbLevel)
    }

    set Bandwidth(bw) {
        this.FBandwidth = bw
        this.Filter.points = Math.ceil(
            0.37 * DEFAULT.RATE / Math.floor((DEFAULT.BUFSIZE / 4) * bw),
        )
        for (let i = 0; i <= this.Filter.points * 3; i++) this.FGain = this.NewGain()
    }

    ApplyTo(Arr) {
        let BlkCnt = Math.floor(Arr.length / (Math.floor(DEFAULT.BUFSIZE / 4)))

        for (let b = 0; b < BlkCnt; b++) {
            let dG = (this.NewGain() - this.FGain) / Math.floor(DEFAULT.BUFSIZE / 4)
            for (let i = 0; i < Math.floor(DEFAULT.BUFSIZE / 4); i++) {
                Arr[b * Math.floor(DEFAULT.BUFSIZE / 4) + i] =
                    Arr[b * Math.floor(DEFAULT.BUFSIZE / 4) + i] * this.FGain
                this.FGain += dG
            }
        }
    }
}

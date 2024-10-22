import { DEFAULT } from "./defaults.js"
import { Contest } from "./contest.js"

import { Station } from "./station.js"

window.onload = () => {
    Station.NrAsText(599,29)
    const start_button = document.getElementById("start")
    start_button.onclick = async () => {
        let ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: DEFAULT.RATE })
        await ctx.audioWorklet.addModule("contest-processor.js");
        const ContestNode = new AudioWorkletNode(
            ctx,
            "contest-processor",
        );
        ContestNode.connect(ctx.destination);
    }
    const debug_button = document.getElementById("debug")
    debug_button.onclick = async () => {     
        let MyContest = new Contest(DEFAULT.RATE)
        let result = new Float32Array(DEFAULT.RATE * 60 * 2)
        MyContest.getBlock(result)
        const debug_button = document.getElementById("debug")
        debug_button.style.backgroundColor = "red"
    }
}

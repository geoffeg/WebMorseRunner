import { DEFAULT } from "./defaults.js"
import { Contest } from "./contest.js"

//import { Station } from "./station.js"
import { DxOperator } from "./dxoperator.js"



const setFocus = id => {
    document.getElementById(id).focus();
}

const wipeFields = () => {
    document.getElementById('call').value = ''
    document.getElementById('rst').value = ''
    document.getElementById('nr').value = ''
    setFocus('call')
}

const functionKey = () => {
    document.getElementById('input').addEventListener("keydown", (e) => {
        console.log(e.code)
    });
}

window.onload = () => {
    DxOperator.IsMyCall('DJ1TF', 'DJ1?')
    functionKey()
    wipeFields()
    // allow only number input on RST and NR
    var nr_input = document.querySelectorAll('.NR')
    Array.from(nr_input).forEach(input => {
        input.addEventListener("beforeinput", e => {
            const nextVal =
                e.target.value.substring(0, e.target.selectionStart) +
                (e.data ?? '') +
                e.target.value.substring(e.target.selectionEnd)
            if (!/^\d{0,3}$/.test(nextVal)) {
                e.preventDefault();
            }
            return
        })
    })

    const start_button = document.getElementById("start")
    start_button.onclick = async () => {
        wipeFields()
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

import { DEFAULT } from "./defaults.js"
import { Contest } from "./contest.js"
import { Calls } from "./call.js"

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
    let calls = new Calls()
    calls.fetch_calls()
    let ContestNode = null
    //    console.log(DxOperator.IsMyCall('DJ1TF', 'DJ?'))
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
        ContestNode = new AudioWorkletNode(
            ctx,
            "contest-processor",
        );
        ContestNode.port.onmessage = (e) => {
            console.log(e.data)
            let type = e.data.type

            switch (type) {
                case 'request_dx':

                    ContestNode.port.postMessage({
                        type: "create_dx",
                        text: calls.get_random()
                    })
                    break
            }
        }
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
    const cq_button = document.getElementById("cq")
    cq_button.onclick = async () => {
        ContestNode.port.postMessage({
            type: "send",
            text: "CQ"
        })

    }
}

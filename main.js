window.onload = () => {
    const button = document.getElementById("start")
    button.onclick = async () => {
        let ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 })
        await ctx.audioWorklet.addModule("contest-processor.js");
        const ContestNode = new AudioWorkletNode(
            ctx,
            "contest-processor",
          );
          ContestNode.connect(ctx.destination);
    }
}

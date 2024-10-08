import { RingBuffer }  from "./ringbuffer.js"  



function writeRingBuffer(rb){
  let data = new Float32Array(128)
  if(rb.availableWrite()>=128) {    
    for(let i = 0;i<data.length;i++) data[i] =  2 * (Math.random() - 0.5);  // white noise
    rb.push(data)
    console.log("push")
  }
}


onmessage = function (ev) {
  
    console.log(ev.data) 
    let rb = new RingBuffer(ev.data, Float32Array)
    let interval = setInterval(writeRingBuffer, 20,rb)
    
  }
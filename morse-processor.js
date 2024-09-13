class MorseProcessor extends AudioWorkletProcessor {
    constructor(nodeOptions) {
      super();
      // wait with processing until the initialization happen
      this._initialized = false
      this.port.onmessage = ( event ) => {
  
  //        console.log(event.data)
          this._sharedArray = new Int32Array(event.data);       
  //        Atomics.store(this._sharedArray , 0, 42)
          console.log(this._sharedArray)
          // we got a shared memory buffer 
          this._initialized = true
  
        }
      }
       
      static get parameterDescriptors() {
          return [
              {
                name: "gain",
                defaultValue: 1,
                minValue: 0,
                maxValue: 1,
                automationRate: "a-rate",
              },
            ];           
      }
  
      process(inputs, outputs, parameters) {
          const output = outputs[0];
          const input = inputs[0];
          if (this._initialized) {
          output.forEach((channel) => {
            const inputChannel = input[0];  
            for (let i = 0; i < channel.length; i++) {
              if (Atomics.load(this._sharedArray, 0) === 1) {
                  if (i === 0 ) {
                  console.log(i)
                  console.log(channel.length)
                  console.log(sampleRate)
                }
                  Atomics.store(this._sharedArray , 0, 0)
              }
              if (parameters.gain[0] === 0) channel[i] = 0; else
                 channel[i] = inputChannel[i]
            }
          });
          }
          return true;        
      }
  }
  
  
  registerProcessor("morse-processor", MorseProcessor);
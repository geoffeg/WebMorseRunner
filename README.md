# Web Morse Runner

A small CW contest simulator for the web.

## About 
This is a new written version of MorseRunner as Web-Application.

The app is hosted on GitHub Pages: https://fritzsche.github.io/WebMorseRunner/


The Project is inspired by the Program [MorseRunner by VE3NEA - Alex Shovkoplyas](https://github.com/VE3NEA/MorseRunner). The Idea to start a complete new Web App Project originate from the authors previous effort to [port MorseRunner to Linux and Mac](https://github.com/fritzsche/MorseRunner).


This project is complete new and independent of Alex project. The original MorseRunner target Windows and is developed in Pascal, while this version is complete rewritten from scratch in Javascript and targeting the usage in web browsers. 


## Functions

* Runs in Browser using Javascript
* Web Audio API using AudioWorklet
* No Backend
* Single Call Mode (yet)
* (Complex) Noise
* Modulation
* Filter
* Read List of calls from calls.txt
* Speed in WPM
* Stetting: 
    * Pitch
    * RX Bandwidth
    * Monitor Level
    * RIT
    * Time the contest should run
    * My Call
* Sending via buttons and function key 
* ESM (Enter to Send Message)
* Calculate and display Score
* Display log and confirm QSO's

## Features not (yet) implemented

* Other contest modes (e.g. Pile-up/WPX)
* Bank Condition (QRM/QRN etc.)
* WAV File Export
* Best-List
* Score over time
* some Keyboard shortcuts missing

## Status
This Web App is in a very early stage, still searching some bugs and optimizations. 
The App can work, but consider this app as experimental.

## Usage
Web Morse Runner is a contest simulator. The target is to get as much points(QSO's) and multis(Prefix) as possible.

Start my setting the parameters, like your call sign, preferred WPM etc. and start the contest by pressing the run button.

Station will call you and you need to log the QSO in the fields Call/NR. 
Currently this app only supports the single call contest mode. This means only one station will call you at the same time and the calls are coming without the need to call CQ.

Use the respective buttons or function key to respond to the stations. You need to end the QSO by sending TU. 

The simulator supports ESM (Enter to Send Message), means hitting the Enter key will allow you to send messages depending on the state of the QSO.


## Version

* 0.3-alpha (2024-12-11) Bugfix: Morse Timing fixed including correction of v0.2-alpha.
* 0.2b-alpha (2024-12-11) The changes in 0.2 cause a regression as there is a audible gap when 2 messages are send after each other. This results from over allocation. Rollback the changes from 0.2-alpha to avoid audible gaps.
* 0.2-alpha (2024-12-11) Improvement/Bugfix: This JavaScript version used dynamic allocated Array where Pascal was using static sized Array. This is now changed to a pre-allocated Float32Array array to also improve performance to avoid unnecessary allocations in the audio buffer process. In some situations this could leave more spacing.
* 0.1-alpha (2024-11-25) initial public release.

## References
* [Morse Runner](https://github.com/VE3NEA/MorseRunner) (Windows/Pascal) by VE3NEA - Alex Shovkoplyas
* [Morse Runner Community Edition](https://groups.io/g/MorseRunnerCE)
* [Morse Runner Port](https://github.com/fritzsche/MorseRunner) (Linux/Mac) adopted by DJ1TF  - Thomas Fritzsche


## Thanks
Like to thank VE3NEA Alex Shovkoplyas for his inspiring work on MorseRunner.




73, Thomas - DJ1TF




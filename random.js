import { DEFAULT } from "./defaults.js"

export const RndNormal = () => {
    return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(Math.PI * 2 * Math.random())
}

export const RndGaussLim = (AMean, ALim) => {
    let result = AMean + RndNormal() * 0.5 * ALim;
    result = Math.max(AMean - ALim, Math.min(AMean + ALim, result))
    return result
}

export const RndUShaped = () => {
    return Math.sin(Math.PI * (Math.random() - 0.5))
}

export const SecondsToBlocks = (Sec) => {
  return Math.round(DEFAULT.RATE / DEFAULT.BUFSIZE * Sec)
}

export const BlocksToSeconds = (Blocks) => {
  return Blocks * DEFAULT.BUFSIZE / DEFAULT.RATE
}

export const RndRayleigh = (AMean) => {
  return  AMean * Math.sqrt(-Math.log(Math.random()) - Math.log(Math.random()))
}
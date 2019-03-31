/*
src = input(close)
dk = src - nz(kf[1],src)
smooth = nz(kf[1],src)+dk*sqrt((Gain/10000)*2)
velo = nz(velo[1],0) + ((Gain/10000)*dk)
kf = smooth+velo
*/
// const kalmanFilter = require("kalmanjs").default;

const ks = ({ gain = 2, index = 3 }, candle) => {
  let array = [];
  let kf = 0;
  let velo = 0;
  for (let i = 0; i < candle[index].length; i++) {
    const src = candle[index][i];
    const delta = src - kf;
    const smooth = kf + delta * Math.sqrt(gain * 2);
    velo += gain * delta;
    kf = smooth + velo;
    array.push(kf);
  }
  //console.log(array.slice(0,10))
  return array;
  /*  const kf = new kalmanFilter({ R, Q, A });
    return candle[index].map(item => kf.filter(item));*/
};

module.exports = ks;

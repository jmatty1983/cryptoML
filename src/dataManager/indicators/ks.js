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

  return array;
};

module.exports = ks;

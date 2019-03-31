const kalmanFilter = require("kalmanjs").default;

const KF = ({ R = 0.01, Q = 3, A = 1, index = 3 }, candle) => {
  const kf = new kalmanFilter({ R, Q, A });
  //console.log(candle[index].map(item => kf.filter(item)).slice(0,10))
  return candle[index].map(item => kf.filter(item));
};

module.exports = KF;

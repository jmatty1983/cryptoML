const OBV = ([opens, , , closes, volume]) =>
  closes.reduce((obv, item, idx) => {
    let lastObv = obv[obv.length - 1] || 0;
    const delta = closes[idx] - opens[idx];

    lastObv += delta < 0 ? -volume[idx] : delta > 0 ? volume[idx] : 0;
    obv.push(lastObv);

    return obv;
  }, []);

module.exports = OBV;

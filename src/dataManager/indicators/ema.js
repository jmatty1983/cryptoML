const EMA = ({ length, index = 3 }, candles) =>
  candles[index].slice(1).reduce(
    (ema, item) => {
      const multipier = 2 / (length + 1);
      const lastEma = ema[ema.length - 1];
      ema.push((item - lastEma) * multipier + lastEma);

      return ema;
    },
    [candles[index][0]]
  );

module.exports = EMA;

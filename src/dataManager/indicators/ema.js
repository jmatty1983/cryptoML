const EMA = (length, [, closes]) =>
  closes.slice(1, closes.length - 1).reduce(
    (ema, item) => {
      const multipier = 2 / (length + 1);
      const lastEma = ema[ema.length - 1];
      ema.push((item - lastEma) * multipier + lastEma);

      return ema;
    },
    [closes[0]]
  );

module.exports = EMA;

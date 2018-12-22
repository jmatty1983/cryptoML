const assert = require("assert");

// p === 2 === euclidean distance
// p === 1 === manhattan distance

// see https://en.wikipedia.org/wiki/Minkowski_distance

function minkowskiDistance(a, b, p = 2) {
  // assert(a.length === b.length);
  p = Math.max(p, Number.EPSILON);
  return Math.pow(
    a
      .map((e, idx) => Math.abs(e - b[idx]))
      .map(e => Math.pow(e, p))
      .reduce((acc, cur) => acc + cur, 0),
    1 / p
  );
}

// opts.kNN - kNearestNeighbor
// opts.p - minkowski distance power

function noveltySearch(objectives, archive = [], opts = {}) {
  const collated = [...objectives, ...archive];

  assert(!collated.some(array => array.some(item => isNaN(item))));
  assert(!collated.some(array => array.length !== collated[0].length));

  const kNN = opts.kNN || 15;
  const p = opts.p || 2;

  return objectives.map(
    (e, i) =>
      collated
        .map(f => minkowskiDistance(e, f, p))
        .sort((a, b) => a - b)
        .slice(0, kNN)
        .reduce((acc, cur) => acc + cur, 0) / kNN
  );
}

module.exports = noveltySearch;

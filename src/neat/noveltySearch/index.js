const assert = require("assert");

// novelty search with local competition

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

function noveltySearch(nsObjs, nsArchive, lcObjs, lcArchive, opts = {}) {
  const collated = [...nsObjs, ...nsArchive];
  const lcSpace = [...lcObjs, ...lcArchive];

  assert(!collated.some(array => array.some(item => isNaN(item))));
  assert(!collated.some(array => array.length !== collated[0].length));

  const kNN = opts.kNN || 15;
  const p = opts.p || 2;

  const distances = nsObjs.map(item =>
    collated
      .map((f, index) => {
        return { index, distance: minkowskiDistance(item, f, p) };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, kNN)
  );

  // collapse local competition objectives into their respective metrics
  const lcs = distances.map((item, idx) =>
    lcSpace[0].map((_, col) =>
      item.reduce(
        (acc, val) => acc + (lcSpace[idx][col] > lcSpace[val.index][col]) / kNN,
        0
      )
    )
  );

  const novelties = distances.map(
    item => item.reduce((acc, cur) => acc + cur.distance, 0) / kNN
  );

  return { novelties, lcs };
}

module.exports = noveltySearch;

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
// opts.normalize - boolean

function noveltySearch(nsObjs, nsArchive, lcObjs, lcArchive, opts = {}) {
  let collated = [...nsObjs, ...nsArchive];
  const lc = [...lcObjs, ...lcArchive];

  assert(!collated.some(array => array.some(item => isNaN(item))));
  assert(!collated.some(array => array.length !== collated[0].length));

  const kNN = opts.kNN || 15;
  const p = opts.p || 2;
  const norm = opts.normalize || true;

  if (norm) {
    const ranges = collated[0]
      .map((_, index) =>
        collated.reduce(
          (acc, val) => [
            Math.min(acc[0], val[index]),
            Math.max(acc[1], val[index])
          ],
          [Infinity, -Infinity]
        )
      )
      .map(item => [item[0], item[1] - item[0]]);

    let normalize = x =>
      x.map(obj =>
        obj.map(
          (value, index) =>
            (value - ranges[index][0]) /
            (ranges[index][1] ? ranges[index][1] : 1)
        )
      );

    const nsObjsNorm = normalize(nsObjs);
    const nsArchiveNorm = normalize(nsArchive);

    if (false) {
      let sanity = pop =>
        pop.forEach(item =>
          item.forEach(halp => {
            if (halp < 0 || halp > 1) {
              console.log("halp:", halp);
            }
          })
        );

      sanity(nsObjsNorm);
      sanity(nsArchiveNorm);
    }

    collated = [...nsObjsNorm, ...nsArchiveNorm];
    nsObjs = nsObjsNorm;
  }

  const distances = nsObjs.map(solution =>
    collated
      .map((f, index) => {
        return { index, distance: minkowskiDistance(solution, f, p) };
      })
      .sort((a, b) => a.distance - b.distance)
      .filter(a => a.distance > 0)
      .slice(0, kNN)
  );

  // collapse local competition objectives into their respective metrics
  const lcs = distances.map((item, idx) =>
    lc[0].map(
      (_, col) =>
        item.reduce(
          (acc, val) => acc + (lc[idx][col] > lc[val.index][col]),
          0
        ) / kNN
    )
  );

  const novelties = distances.map(
    item => item.reduce((acc, cur) => acc + cur.distance, 0) / kNN
  );

  return { novelties, lcs };
}

module.exports = noveltySearch;

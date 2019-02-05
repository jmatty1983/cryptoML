const assert = require("assert");

// novelty search with local competition

// p === 2 === euclidean distance
// p === 1 === manhattan distance

// see https://en.wikipedia.org/wiki/Minkowski_distance

function minkowskiDistance(a, b, p = 2) {
  // assert(a.length === b.length);
  p = Math.max(p, Number.EPSILON);
  const d = a
    .map((_, idx) => Math.pow(Math.abs(b[idx] - a[idx]), p))
    .reduce((acc, cur) => acc + cur);
  return Math.pow(d, 1 / p);
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
      .map(item => [item[0], (x => (x ? x : 1))(item[1] - item[0])]);

    // console.log(JSON.stringify(ranges))

    let normalize = x =>
      x.map(obj =>
        obj.map((value, index) => (value - ranges[index][0]) / ranges[index][1])
      );

    const nsObjsNorm = normalize(nsObjs);
    const nsArchiveNorm = normalize(nsArchive);

    if (true) {
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
      .map((f, idx) => [idx, minkowskiDistance(solution, f, p)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, kNN)
  );
  /*
  distances.forEach( dong => 
    dong.forEach( i =>
      {if( i[1]>1 ) console.log("wat? ",i[1])}
    )
  )
*/
  // console.log(kNN,distances[0].length)

  // collapse local competition objectives into their respective metrics
  const lcs = distances.map((item, idx) =>
    lc[0].map(
      (_, col) =>
        item.reduce(
          (acc, val) => acc + Number(lc[idx][col] > lc[val[0]][col]),
          0
        ) / kNN
    )
  );

  const novelties = distances.map(
    item => item.reduce((acc, cur) => acc + cur[1], 0) / kNN
  );

  /*  novelties.forEach( (i,idx)=> 
     {if( i>1 ) console.log("wat? ",i,idx,distances[idx])}
  )*/

  return { novelties, lcs };
}

module.exports = noveltySearch;

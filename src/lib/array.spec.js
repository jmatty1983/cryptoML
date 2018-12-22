const { expect } = require("chai");
const ArrayUtils = require("./array");

describe("Array Utilities Module", () => {
  it("should be defined.", () => {
    expect(ArrayUtils).not.to.be.undefined;
  });

  it("should have an average function", () => {
    expect(typeof ArrayUtils.average).to.equal("function");
  });

  it("should compute the average of an array", () => {
    const array = [1, 2, 3];
    const expectedResult = 2;

    expect(ArrayUtils.average(array)).to.equal(expectedResult);
  });

  it("should have a sum function", () => {
    expect(typeof ArrayUtils.sum).to.equal("function");
  });

  it("should compute the sum of an array", () => {
    const array = [1, 2, 3];
    const expectedResult = 6;

    expect(ArrayUtils.sum(array)).to.equal(expectedResult);
  });

  it("should have a getProp function", () => {
    expect(typeof ArrayUtils.getProp).to.equal("function");
  });

  it("should return an array of values when calling getProp with an array of objects", () => {
    const array = [
      {
        foo: 1,
        bar: 2
      },
      {
        foo: 2,
        bar: 3
      },
      {
        foo: 3,
        bar: 4
      }
    ];
    const expectedFooResult = [1, 2, 3];
    const expectedBarResult = [2, 3, 4];

    expect(ArrayUtils.getProp("foo", array)).to.eql(expectedFooResult);
    expect(ArrayUtils.getProp("bar", array)).to.eql(expectedBarResult);
  });

  it("Should have a chunk function", () => {
    expect(typeof ArrayUtils.chunk).to.equal("function");
  });

  it("should chunk an array when calling chunk", () => {
    expect(ArrayUtils.chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 0], 3)).to.eql([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [0]
    ]);
  });

  it("Should have a flatten function", () => {
    expect(typeof ArrayUtils.chunk).to.equal("function");
  });

  it("should flatten an array when calling flatten", () => {
    expect(ArrayUtils.flatten([[1, 2, 3], [4, 5, 6], [7, 8, 9], [0]])).to.eql([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      0
    ]);
  });
});

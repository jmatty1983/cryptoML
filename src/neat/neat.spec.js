const { expect } = require("chai");
const Neat = require(".");

describe("Neat Module", () => {
  it("should have an init function", () => {
    expect(typeof Neat.init).to.equal("function");
  });

  it("should initialize the object with some data when calling init", () => {
    //do sum stuffs
  });
});

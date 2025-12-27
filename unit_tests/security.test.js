const chai = require("chai");
const { expect } = chai;

const isPwned = require("../src/config/is-pawned");

describe("isPwned(password)", () => {
  it("should return true for a breached password", async () => {
    const fakeFetch = async () => ({
      text: async () => "1E4C9B93F3F0682250B6CF8331B7EE68FD8:999999"
    });

    const result = await isPwned("password", fakeFetch);
    expect(result).to.be.true;
  });

  it("should return false for a password not in the list", async () => {
    const fakeFetch = async () => ({
      text: async () => "111111111111111111111111111111111111:10"
    });

    const result = await isPwned("completelyUniquePassword123!", fakeFetch);
    expect(result).to.be.false;
  });

  it("should return false if fetch throws an error", async () => {
    const fakeFetch = async () => {
      throw new Error("Simulated fetch failure");
    };

    const result = await isPwned("anyPassword", fakeFetch);
    expect(result).to.be.false;
  });
});

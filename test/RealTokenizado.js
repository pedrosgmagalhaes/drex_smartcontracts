const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deploy } = require("./fixtures/RealTokenizado");

describe("RealTokenizado", () => {

  describe("constructor", () => {
    it("should set cnpj8, participant, and reserve", async () => {
      const { realTokenizado, reserve, participant, cnpj8 } = await loadFixture(deploy);
      expect(await realTokenizado.cnpj8()).to.equal(cnpj8);
      expect(await realTokenizado.participant()).to.equal(participant);
      expect(await realTokenizado.reserve()).to.equal(reserve.address);
    });
  });

  describe("updateReserve", () => {
    it("should revert if called by non-default account", async () => {
      const { realTokenizado, unauthorized, newReserve } = await loadFixture(deploy);
      await expect(
        realTokenizado.connect(unauthorized).updateReserve(newReserve.address)
      ).to.be.revertedWith("RealTokenizado: caller is not the default account");
    });

    it("should update reserve", async () => {
      const { realTokenizado, newReserve, defaultAccount } = await loadFixture(deploy);
      await realTokenizado.connect(defaultAccount).updateReserve(newReserve.address);
      expect(await realTokenizado.reserve()).to.equal(newReserve.address);
    });
  });
});
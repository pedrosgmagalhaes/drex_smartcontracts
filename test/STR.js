const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deploy } = require("./fixtures/STR");

describe("STR", () => {

  describe("constructor", () => {
    it("deploys without error", async () => {
      await loadFixture(deploy);
    });
  });

  describe("requestToMint", () => {
    it("should revert if called by non-verified account", async () => {
      const { strInstance, unauthorized } = await loadFixture(deploy);
      await expect(
        strInstance.connect(unauthorized).requestToMint(100)
      ).to.be.revertedWith("STR: Caller is not verified in RealDigital");
    });

    it("should mint tokens for verified account", async () => {
      const { strInstance, realDigital, enabled } = await loadFixture(deploy);
      await strInstance.connect(enabled).requestToMint(100);
      expect(await realDigital.balanceOf(enabled.address)).to.equal(100);
    });
  });

  describe("requestToBurn", () => {
    it("should revert if called by non-verified account", async () => {
      const { strInstance, unauthorized } = await loadFixture(deploy);
      await expect(
        strInstance.connect(unauthorized).requestToBurn(50)
      ).to.be.revertedWith("STR: Caller is not verified in RealDigital");
    });

    it("should burn tokens from verified account", async () => {
      const { strInstance, realDigital, enabled } = await loadFixture(deploy);
      await strInstance.connect(enabled).requestToMint(100);
      expect(await realDigital.balanceOf(enabled.address)).to.equal(100);
      await realDigital.connect(enabled).increaseAllowance(strInstance.address, 50);
      await strInstance.connect(enabled).requestToBurn(50);
      expect(await realDigital.balanceOf(enabled.address)).to.equal(50);
    });
  });
});
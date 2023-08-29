const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deploy } = require("./fixtures/RealDigitalDefaultAccount");
const { deploy: deployRealTokenizado, deployAddDefaultAccount } = require("./fixtures/RealTokenizado");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { getRoleError } = require("../util/roles");

const CNPJ8 = 12345678;

describe("RealDigitalDefaultAccount", function () {
  describe("addDefaultAccount", function () {
    it("Should add a new address", async function () {
      const { addressDiscovery, realDigitalDefaultAccount, authority, } = await loadFixture(deploy);
      const { realTokenizadoParams } = await deployRealTokenizado(addressDiscovery, realDigitalDefaultAccount);
      const randomWallet = ethers.Wallet.createRandom();
      await realDigitalDefaultAccount
        .connect(authority)
        .addDefaultAccount(realTokenizadoParams.cnpj8, randomWallet.address);
      expect(await realDigitalDefaultAccount.defaultAccount(realTokenizadoParams.cnpj8)).to.equal(
        randomWallet.address
      );
    });

    it("Should revert on addDefaultAccount if not authorized", async function () {
      const { realDigitalDefaultAccount, unauthorizedAccount } = await loadFixture(deploy);
      await expect(realDigitalDefaultAccount.connect(unauthorizedAccount).addDefaultAccount(CNPJ8, unauthorizedAccount.address)).to.be.revertedWith(
        getRoleError(unauthorizedAccount.address, "ACCESS_ROLE")
      );
    });
  });

  describe("updateDefaultAccount", function () {
    it("Default account should be able to change to a different address", async function () {
      const { realDigitalDefaultAccount, realTokenizadoParams, realTokenizado } = await loadFixture(deployAddDefaultAccount);
      const randomWallet = ethers.Wallet.createRandom();
      await realDigitalDefaultAccount.connect(realTokenizadoParams.defaultAccount).updateDefaultAccount(realTokenizadoParams.cnpj8, randomWallet.address);
      expect(await realDigitalDefaultAccount.defaultAccount(realTokenizadoParams.cnpj8)).to.equal(randomWallet.address);
      expect(await realTokenizado.hasRole(await realTokenizado.ACCESS_ROLE(), randomWallet.address)).to.equal(true);
      expect(await realTokenizado.hasRole(await realTokenizado.MOVER_ROLE(), randomWallet.address)).to.equal(true);
      expect(await realTokenizado.hasRole(await realTokenizado.FREEZER_ROLE(), randomWallet.address)).to.equal(true);
    });

    it("Unauthorized account should revert on updateDefaultAccount", async function () {
      const { realDigitalDefaultAccount, realTokenizadoParams, unauthorized } = await loadFixture(deployAddDefaultAccount);
      await expect(realDigitalDefaultAccount.connect(unauthorized).updateDefaultAccount(realTokenizadoParams.cnpj8, unauthorized.address)).to.be.revertedWith(
        "RealDigitalDefaultAccount: caller is not the default account"
      );
    });
  });


});

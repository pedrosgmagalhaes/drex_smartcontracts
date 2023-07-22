// test/real.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { parseReal, formatReal } = require("../util/parseFormatReal");
const { REAL_NAME, REAL_SYMBOL } = require("../util/constants");
const { getRoleError } = require("../util/roles");

const MINT_AMOUNT = parseReal("100");
const FREEZE_AMOUNT = parseReal("50");

const deploy = async () => {
    const RealDigital = await ethers.getContractFactory("RealDigital");
    [admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount] = await ethers.getSigners();
    const real = await RealDigital.deploy(
      REAL_NAME,
      REAL_SYMBOL,
      authority.address,
      admin.address
    );
    await real.deployed();
    return { real, admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount };
}

const deployMintTokens = async () => {
  const { real, admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount } = await deploy();

  await real.connect(authority).enableAccount(authority.address);
  await real.connect(authority).enableAccount(authorizedSender.address);
  await real.connect(authority).enableAccount(authorizedRecipient.address);

  await real.connect(authority).mint(authority.address, MINT_AMOUNT);
  expect(await real.balanceOf(authority.address)).to.equal(MINT_AMOUNT);

  await real.connect(authority).mint(authorizedSender.address, MINT_AMOUNT);
  expect(await real.balanceOf(authorizedSender.address)).to.equal(MINT_AMOUNT);

  return { real, admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount };
}

const deployMintAndFreezeTokens = async () => {
  const { real, admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount } = await deployMintTokens();
  await real.connect(authority).increaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT);
  return { real, admin, authority, authorizedSender, authorizedRecipient, unauthorizedAccount };
}


describe("RealDigital", function () {

  describe("Deployment", function () {
    it("Should set the correct roles", async function () {
      const { real, admin, authority } = await deploy();
      expect(await real.hasRole(await real.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
      expect(await real.hasRole(await real.BURNER_ROLE(), authority.address)).to.equal(true);
      expect(await real.hasRole(await real.MINTER_ROLE(), authority.address)).to.equal(true);
      expect(await real.hasRole(await real.PAUSER_ROLE(), authority.address)).to.equal(true);
      expect(await real.hasRole(await real.MOVER_ROLE(), authority.address)).to.equal(true);
      expect(await real.hasRole(await real.ACCESS_ROLE(), authority.address)).to.equal(true);
      expect(await real.hasRole(await real.FREEZER_ROLE(), authority.address)).to.equal(true);
    });

    it("Should set the correct name and symbol", async function () {
      const { real } = await loadFixture(deploy);
      expect(await real.name()).to.equal(REAL_NAME);
      expect(await real.symbol()).to.equal(REAL_SYMBOL);
    });
  });

  describe("Minting", function () {
    it("Authority should be able to mint new tokens", async function () {
      const { real, authority, authorizedRecipient } = await loadFixture(deploy);
      await real.connect(authority).mint(authorizedRecipient.address, MINT_AMOUNT);
      expect(await real.balanceOf(authorizedRecipient.address)).to.equal(MINT_AMOUNT);
    });

    it("Non-authority should not be able to mint new tokens", async function () {
      const { real, authorizedRecipient } = await loadFixture(deploy);
      await expect(
        real.connect(authorizedRecipient).mint(authorizedRecipient.address, MINT_AMOUNT)
      ).to.be.revertedWith(getRoleError(authorizedRecipient.address, "MINTER_ROLE"));
    });
  });

  describe("Burning", function () {
    it("Authority should be able to burn tokens", async function () {
      const { real, authority } = await loadFixture(deployMintTokens);
      expect(await real.balanceOf(authority.address)).to.equal(MINT_AMOUNT);
      await real.connect(authority).burn(MINT_AMOUNT);
      expect(await real.balanceOf(authority.address)).to.equal(0);
    });

    it("Non-authority should not be able to burn tokens", async function () {
      const { real, unauthorizedAccount } = await loadFixture(deployMintTokens);
      await expect(
        real.connect(unauthorizedAccount).burn(MINT_AMOUNT)
      ).to.be.revertedWith(getRoleError(unauthorizedAccount.address, "BURNER_ROLE"));
    });
  });

  // Account Management
  describe("Account Management", function () {
    it("Authority should be able to enable and disable an account", async function () {
      const { real, authority, unauthorizedAccount } = await loadFixture(deploy);
      expect(await real.authorizedAccounts(unauthorizedAccount.address)).to.equal(false);
      await real.connect(authority).enableAccount(unauthorizedAccount.address);
      expect(await real.authorizedAccounts(unauthorizedAccount.address)).to.equal(true);
      await real.connect(authority).disableAccount(unauthorizedAccount.address);
      expect(await real.authorizedAccounts(unauthorizedAccount.address)).to.equal(false);
    });

    it("Non-authority should not be able to enable and disable an account", async function () {
      const { real, unauthorizedAccount } = await loadFixture(deploy);
      await expect(
        real.connect(unauthorizedAccount).enableAccount(unauthorizedAccount.address)
      ).to.be.revertedWith(getRoleError(unauthorizedAccount.address, "ACCESS_ROLE"));
      await expect(
        real.connect(unauthorizedAccount).disableAccount(unauthorizedAccount.address)
      ).to.be.revertedWith(getRoleError(unauthorizedAccount.address, "ACCESS_ROLE"));
    });
  });

  // Frozen Balances
  describe("Frozen Balances", function () {
    it("Authority should be able to freeze balance of account", async function () {
      const { real, authority, authorizedSender } = await loadFixture(deployMintTokens);
      await real.connect(authority).increaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT);
      expect(await real.frozenBalanceOf(authorizedSender.address)).to.equal(FREEZE_AMOUNT);
    });

    it("Non-authority should not be able to freeze balance of account", async function () {
      const { real, authorizedSender } = await loadFixture(deployMintTokens);
      await expect(
        real.connect(authorizedSender).increaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT)
      ).to.be.revertedWith(getRoleError(authorizedSender.address, "FREEZER_ROLE"));
    });

    it("Authority should be able to unfreeze balance of account", async function () {
      const { real, authority, authorizedSender } = await loadFixture(deployMintAndFreezeTokens);
      await real.connect(authority).decreaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT);
      expect(await real.frozenBalanceOf(authorizedSender.address)).to.equal(0);
    });

    it("Non-authority should not be able to unfreeze balance of account", async function () {
      const { real, authorizedSender } = await loadFixture(deployMintAndFreezeTokens);
      await expect(
        real.connect(authorizedSender).decreaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT)
      ).to.be.revertedWith(getRoleError(authorizedSender.address, "FREEZER_ROLE"));
    });
  });

  // Transfers
  describe("Transfers", function () {
    it("Should reject transfer to and from a disabled account", async function () {
      const { real, authorizedSender, unauthorizedAccount } = await loadFixture(deployMintTokens);
      await expect(
        real.connect(authorizedSender).transfer(unauthorizedAccount.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("CBDCAccessControl: Both from and to accounts must be authorized");
      await expect(
        real.connect(unauthorizedAccount).transfer(authorizedSender.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("CBDCAccessControl: Both from and to accounts must be authorized");
    });

    it("Should reject transfer if amount exceeds available balance after accounting for frozen balance", async function () {
      const { real, authorizedSender, authorizedRecipient } = await loadFixture(deployMintAndFreezeTokens);
      const availableAmount = (await real.balanceOf(authorizedSender.address)).sub(await real.frozenBalanceOf(authorizedSender.address));
      await expect(
        real.connect(authorizedSender).transfer(authorizedRecipient.address, availableAmount.add(1))
      ).to.be.revertedWith("RealDigital: Insufficient liquid balance");
    });

    it("Should allow transfer if amount does not exceed available balance after accounting for frozen balance", async function () {
      const { real, authorizedSender, authorizedRecipient } = await loadFixture(deployMintAndFreezeTokens);
      const totalBalance = await real.balanceOf(authorizedSender.address);
      const frozenBalance = await real.frozenBalanceOf(authorizedSender.address);
      const availableAmount = totalBalance.sub(frozenBalance);
      await real.connect(authorizedSender).transfer(authorizedRecipient.address, availableAmount);
      expect(await real.balanceOf(authorizedRecipient.address)).to.equal(availableAmount);
      expect(await real.balanceOf(authorizedSender.address)).to.equal(frozenBalance);
    });
  });

});

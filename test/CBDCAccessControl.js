const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const deploy = async () => {
    const CBCDAccessControl = await ethers.getContractFactory("CBDCAccessControl");
    [admin, authority, testAccount] = await ethers.getSigners();
    const accessControl = await CBCDAccessControl.deploy(authority.address, admin.address);
    await accessControl.deployed();
    return { accessControl, admin, authority, testAccount };
}

describe("CBDCAccessControl", function () {
  let accessControl;
  let admin;
  let authority;
  let testAccount;

  beforeEach(async function () {
    ({ accessControl, admin, authority, testAccount } = await loadFixture(deploy));
  });

  describe("Roles", function () {
    it("should grant DEFAULT_ADMIN_ROLE role to admin", async function () {
      expect(await accessControl.hasRole(await accessControl.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("should grant BURNER_ROLE to authority", async function () {
      expect(await accessControl.hasRole(await accessControl.BURNER_ROLE(), authority.address)).to.be.true;
    });

    it("should grant MINTER_ROLE to authority", async function () {
      expect(await accessControl.hasRole(await accessControl.MINTER_ROLE(), authority.address)).to.be.true;
    });

    it("should grant PAUSER_ROLE to authority", async function () {
      expect(await accessControl.hasRole(await accessControl.PAUSER_ROLE(), authority.address)).to.be.true;
    });

    it("should grant MOVER_ROLE to authority", async function () {
      expect(await accessControl.hasRole(await accessControl.MOVER_ROLE(), authority.address)).to.be.true;
    });

    it("should grant ACCESS_ROLE to authority", async function () {
      expect(await accessControl.hasRole(await accessControl.ACCESS_ROLE(), authority.address)).to.be.true;
    });
  });

  describe("Authorized Accounts", function () {
    it("account with ACCESS_ROLE should enable and disable an account", async function () {
      expect(await accessControl.verifyAccount(testAccount.address)).to.be.false;
      await accessControl.connect(authority).enableAccount(testAccount.address);
      expect(await accessControl.verifyAccount(testAccount.address)).to.be.true;
      await accessControl.connect(authority).disableAccount(testAccount.address);
      expect(await accessControl.verifyAccount(testAccount.address)).to.be.false;
    });

    it("account without ACCESS_ROLE should not enable and disable an account", async function () {
        expect(
            accessControl.enableAccount(testAccount)
        ).to.be.revertedWith("AccessControl: account is missing the ACCESS_ROLE");
    });
  });
});
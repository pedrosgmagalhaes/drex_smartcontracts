const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deploy } = require("./fixtures/AddressDiscovery");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { getRoleError } = require("../util/roles");

describe("AddressDiscovery", function () {
  it("Should update address", async function () {
    const { addressDiscovery, authority } = await loadFixture(deploy);
    const smartContract = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("SmartContract")
    );
    const newAddress = ethers.Wallet.createRandom().address;
    await addressDiscovery.connect(authority).updateAddress(smartContract, newAddress);
    expect(await addressDiscovery.addressDiscovery(smartContract)).to.equal(newAddress);
  });

  it("Should revert if not authorized", async function () {
    const { addressDiscovery, unauthorizedAccount } = await loadFixture(deploy);
    const smartContract = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("SmartContract")
    );

    await expect(
      addressDiscovery
        .connect(unauthorizedAccount)
        .updateAddress(smartContract, unauthorizedAccount.address)
    ).to.be.revertedWith(getRoleError(unauthorizedAccount.address, "ACCESS_ROLE"));
  });

  it("admin can change authority", async function () {
    const { addressDiscovery, authority, unauthorizedAccount } = await loadFixture(deploy);
    await addressDiscovery.changeAuthority(unauthorizedAccount.address);
    const accessRole = await addressDiscovery.ACCESS_ROLE();
    expect(
      await addressDiscovery.hasRole(accessRole, authority.address)
    ).to.equal(false);
    expect(
      await addressDiscovery.hasRole(accessRole, unauthorizedAccount.address)
    ).to.equal(true);
  });

  it("non-admin can't change authority", async function () {
    const { addressDiscovery, unauthorizedAccount } = await loadFixture(deploy);
    expect(
        addressDiscovery.connect(unauthorizedAccount).changeAuthority(unauthorizedAccount.address)
        ).to.be.revertedWith("AddressDiscovery: Only admin can change authority");
  });
});

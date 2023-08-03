const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deploy } = require("./fixtures/AddressDiscovery");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { getRoleError } = require("../util/roles");

describe.only("AddressDiscovery", function () {
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
});
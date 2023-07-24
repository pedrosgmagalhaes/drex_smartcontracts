const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const deploy = async () => {
    const AddressDiscovery = await ethers.getContractFactory("AddressDiscovery");
    [admin, authority, testAccount] = await ethers.getSigners();
    const addressDiscovery = await AddressDiscovery.deploy(authority.address, admin.address);
    await addressDiscovery.deployed();
    return { addressDiscovery, admin, authority, testAccount };
}

describe("AddressDiscovery", function () {
    let addressDiscovery;
    let admin;
    let authority;
    let testAccount;

    beforeEach(async function () {
        ({ addressDiscovery, admin, authority, testAccount } = await loadFixture(deploy));
    });

    describe("Update Address", function () {
        it("should allow an account with ACCESS_ROLE to update address", async function () {
            const key = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], ["TEST_KEY"]));
            await addressDiscovery.connect(authority).updateAddress(key, testAccount.address);
            expect(await addressDiscovery.addressDiscovery(key)).to.equal(testAccount.address);
        });

        it("should not allow an account without ACCESS_ROLE to update address", async function () {
            const key = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], ["TEST_KEY"]));
            const missingRole = await addressDiscovery.ACCESS_ROLE();
            await expect(
                addressDiscovery
                    .connect(testAccount)
                    .updateAddress(key, testAccount.address)
            ).to.be.revertedWith(
                `AccessControl: account ${testAccount.address.toLowerCase()} is missing role ${missingRole}`
            );
        });

        it("admin can change authority", async function () {
            await addressDiscovery.connect(admin).changeAuthority(testAccount.address);
            expect(await addressDiscovery.authority()).to.equal(testAccount.address);
        });

        it("non-admin can't change authority", async function () {
            expect(
                addressDiscovery.connect(testAccount).changeAuthority(testAccount.address)
            ).to.be.revertedWith("AddressDiscovery: Only admin can change authority");
        });

    });
});

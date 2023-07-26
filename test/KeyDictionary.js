const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { REAL_NAME, REAL_SYMBOL } = require("../util/constants");

const deploy = async () => {
    const KeyDictionary = await ethers.getContractFactory("KeyDictionary");
    const RealDigital = await ethers.getContractFactory("RealDigital");
    [admin, authority] = await ethers.getSigners();
    const realDigital = await RealDigital.deploy(
        REAL_NAME,
        REAL_SYMBOL,
        authority.address,
        admin.address
    );
    const keyDictionary = await KeyDictionary.deploy(realDigital.address);
    const [deployer, wallet] = await ethers.getSigners();

    await keyDictionary.deployed();
    await realDigital.deployed();

    return { keyDictionary, realDigital, deployer, wallet };
}

describe("KeyDictionary", function () {
    let keyDictionary, realDigital, deployer, wallet;

    beforeEach(async function () {
        ({ keyDictionary, realDigital, deployer, wallet } = await loadFixture(deploy));
    });

    describe("Adding and getting accounts", function () {
        it("should be able to add a new account", async function () {
            const key = ethers.utils.solidityKeccak256(['string'], ['test key']);
            const taxId = 123;
            const bankNumber = 123456789;
            const account = 123;
            const branch = 123;

            await keyDictionary.connect(deployer).addAccount(key, taxId, bankNumber, account, branch, wallet.address);
            const customer = await keyDictionary.getCustomerData(key);

            expect(customer.taxId).to.equal(taxId);
            expect(customer.bankNumber).to.equal(bankNumber);
            expect(customer.account).to.equal(account);
            expect(customer.branch).to.equal(branch);
            expect(customer.wallet).to.equal(wallet.address);
            expect(customer.registered).to.be.true;
            expect(customer.owner).to.equal(deployer.address);
        });

        it("should not allow to register the same key twice", async function () {
            const key = ethers.utils.solidityKeccak256(['string'], ['test key2']);
            const taxId = 123;
            const bankNumber = 123456789;
            const account = 123;
            const branch = 123;

            await keyDictionary.connect(deployer).addAccount(key, taxId, bankNumber, account, branch, wallet.address);
            await expect(keyDictionary.connect(deployer).addAccount(key, taxId, bankNumber, account, branch, wallet.address))
                .to.be.revertedWith("Key is already registered");
        });
    });

});

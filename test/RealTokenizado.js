const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const deploy = async () => {
    const name = "RealTokenizado";
    const symbol = "RTK";
    const cnpj8 = 12345678;
    const participant = "ParticipantName";
    const [admin, authority, reserve, newReserve, unauthorized] = await ethers.getSigners();
    const RealTokenizado = await ethers.getContractFactory("RealTokenizado");
    const realTokenizadoInstance = await RealTokenizado.deploy(
      name,
      symbol,
      authority.address,
      admin.address,
      participant,
      cnpj8,
      reserve.address
    );
    await realTokenizadoInstance.deployed();
    return {
      realTokenizado: realTokenizadoInstance,
      admin,
      authority,
      reserve,
      newReserve,
      unauthorized,
      name,
      symbol,
      cnpj8,
      participant
    };
  }

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
    it("should revert if called by non-reserve", async () => {
      const { realTokenizado, unauthorized, newReserve } = await loadFixture(deploy);
      await expect(
        realTokenizado.connect(unauthorized).updateReserve(newReserve.address)
      ).to.be.revertedWith("RealTokenizado: Only reserve can update reserve");
    });

    it("should update reserve", async () => {
      const { realTokenizado, reserve, newReserve } = await loadFixture(deploy);
      await realTokenizado.connect(reserve).updateReserve(newReserve.address);
      expect(await realTokenizado.reserve()).to.equal(newReserve.address);
    });
  });
});
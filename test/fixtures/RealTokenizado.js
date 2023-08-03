const { ethers } = require("hardhat");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");
const { deploy: deployRealDigitalDefaultAccount } = require("./RealDigitalDefaultAccount");
const { roleKeccak } = require("../../util/roles");

const deploy = async (addressDiscovery) => {
  const [admin, authority, reserve, newReserve, defaultAccount, unauthorized] =
    await ethers.getSigners();

  if (!addressDiscovery) {
    addressDiscovery = (await deployAddressDiscovery()).addressDiscovery;
  }

  const { realDigitalDefaultAccount } = await deployRealDigitalDefaultAccount(addressDiscovery);

  const name = "RealTokenizado";
  const symbol = "RTK";
  const cnpj8 = 12345678;
  const participant = "ParticipantName";


  const RealTokenizado = await ethers.getContractFactory("RealTokenizado");
  const realTokenizadoInstance = await RealTokenizado.deploy(
    addressDiscovery.address,
    name,
    symbol,
    authority.address,
    admin.address,
    participant,
    cnpj8,
    reserve.address
  );
  await realTokenizadoInstance.deployed();

  // console.log("AddressDiscovery: ", addressDiscovery.address);
  // console.log("RealTokenizado: ", realTokenizadoInstance.address);
  // console.log("RealDigitalDefaultAccount: ", realDigitalDefaultAccount.address);
  // console.log("Authority: ", authority.address);
  // console.log("Admin: ", admin.address);


  await addressDiscovery
    .connect(authority)
    .updateAddress(
      ethers.utils.keccak256(ethers.utils.solidityPack(["string", "uint256"], ["RealTokenizado", cnpj8])),
      realTokenizadoInstance.address
    );

  await realDigitalDefaultAccount
    .connect(authority)
    .addDefaultAccount(cnpj8, defaultAccount.address);

  return {
    realTokenizado: realTokenizadoInstance,
    admin,
    authority,
    reserve,
    newReserve,
    defaultAccount,
    unauthorized,
    name,
    symbol,
    cnpj8,
    participant,
  };
};

module.exports = {
  deploy,
};
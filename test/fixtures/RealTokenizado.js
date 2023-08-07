const { ethers } = require("hardhat");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");
const {
  deploy: deployRealDigitalDefaultAccount,
} = require("./RealDigitalDefaultAccount");

const deploy = async (addressDiscovery, realDigitalDefaultAccount) => {
  const [admin, authority, reserve, newReserve, defaultAccount, unauthorized] =
    await ethers.getSigners();

  if (!addressDiscovery) {
    addressDiscovery = (await deployAddressDiscovery()).addressDiscovery;
  }

  if (!realDigitalDefaultAccount) {
    realDigitalDefaultAccount = (
      await deployRealDigitalDefaultAccount(addressDiscovery)
    ).realDigitalDefaultAccount;
  }

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

  await addressDiscovery
    .connect(authority)
    .updateAddress(
      ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "uint256"],
          ["RealTokenizado", cnpj8]
        )
      ),
      realTokenizadoInstance.address
    );

  return {
    addressDiscovery,
    realDigitalDefaultAccount,
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

const deployAddDefaultAccount = async (
  _addressDiscovery,
  _realDigitalDefaultAccount
) => {
  const {
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado,
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
   } = await deploy(_addressDiscovery, _realDigitalDefaultAccount);

  await realDigitalDefaultAccount
    .connect(authority)
    .addDefaultAccount(cnpj8, defaultAccount.address);

  return {
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado,
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
  deployAddDefaultAccount
};

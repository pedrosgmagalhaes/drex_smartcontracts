const { ethers } = require("hardhat");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");
const {
  deploy: deployRealDigitalDefaultAccount,
} = require("./RealDigitalDefaultAccount");

class RealTokenizadoParams {
  constructor(
    name,
    symbol,
    participant,
    cnpj8,
    reserve,
    defaultAccount,
  ) {
    this.name = name;
    this.symbol = symbol;
    this.participant = participant;
    this.cnpj8 = cnpj8;
    this.reserve = reserve;
    this.defaultAccount = defaultAccount;
  }

  getAddressDiscoveryKey() {
    return ethers.utils.keccak256(
      ethers.utils.solidityPack(["string", "uint256"], ["RealTokenizado", this.cnpj8])
    );
  }
}

const deploy = async (addressDiscovery, realDigitalDefaultAccount, realTokenizadoParams) => {
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

  if (!realTokenizadoParams) {
    realTokenizadoParams = new RealTokenizadoParams(
      "RealTokenizado",
      "RTK",
      "ParticipantName",
      12345678,
      reserve,
      defaultAccount,
    );
  }

  const RealTokenizado = await ethers.getContractFactory("RealTokenizado");
  const realTokenizadoInstance = await RealTokenizado.deploy(
    addressDiscovery.address,
    realTokenizadoParams.name,
    realTokenizadoParams.symbol,
    authority.address,
    admin.address,
    realTokenizadoParams.participant,
    realTokenizadoParams.cnpj8,
    realTokenizadoParams.reserve.address
  );
  await realTokenizadoInstance.deployed();

  await addressDiscovery
    .connect(authority)
    .updateAddress(
      realTokenizadoParams.getAddressDiscoveryKey(),
      realTokenizadoInstance.address
    );

  return {
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado: realTokenizadoInstance,
    admin,
    authority,
    realTokenizadoParams,
    newReserve,
    unauthorized,
  };
};

const deployAddDefaultAccount = async (
  _addressDiscovery,
  _realDigitalDefaultAccount,
  _realTokenizadoParams
) => {
  const {
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado,
    admin,
    authority,
    realTokenizadoParams,
    newReserve,
    unauthorized,
   } = await deploy(_addressDiscovery, _realDigitalDefaultAccount, _realTokenizadoParams);

  await realDigitalDefaultAccount
    .connect(authority)
    .addDefaultAccount(realTokenizadoParams.cnpj8, realTokenizadoParams.defaultAccount.address);

  return {
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado,
    admin,
    authority,
    realTokenizadoParams,
    newReserve,
    unauthorized,
  };
};

module.exports = {
  deploy,
  deployAddDefaultAccount,
  RealTokenizadoParams,
};

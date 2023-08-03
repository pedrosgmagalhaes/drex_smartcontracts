const { ethers } = require("hardhat");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");

const deploy = async (addressDiscovery) => {
  if (!addressDiscovery) {
    addressDiscovery = (await deployAddressDiscovery()).addressDiscovery;
  }

  const RealDigitalDefaultAccount = await ethers.getContractFactory("RealDigitalDefaultAccount");
  const [
    admin,
    authority,
    unauthorizedAccount,
  ] = await ethers.getSigners();

  const rdda = await RealDigitalDefaultAccount.deploy(
    addressDiscovery.address,
    authority.address,
    admin.address
  );
  await rdda.deployed();

  await addressDiscovery.connect(authority).updateAddress(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RealDigitalDefaultAccount")),
    rdda.address
  );

  return {
    addressDiscovery,
    realDigitalDefaultAccount: rdda,
    admin,
    authority,
    unauthorizedAccount,
  };
};

module.exports = {
  deploy,
};
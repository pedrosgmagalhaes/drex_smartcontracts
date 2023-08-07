const { ethers } = require("hardhat");

const deploy = async () => {
  const AddressDiscovery = await ethers.getContractFactory("AddressDiscovery");
  [
    admin,
    authority,
    unauthorizedAccount,
  ] = await ethers.getSigners();
  const addressDiscovery = await AddressDiscovery.deploy(
    authority.address,
    admin.address
  );
  await addressDiscovery.deployed();
  return {
    addressDiscovery,
    admin,
    authority,
    unauthorizedAccount,
  };
};

module.exports = {
  deploy,
};
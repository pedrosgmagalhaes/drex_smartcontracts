const { ethers } = require("hardhat");
const { deploy: deployRealDigital } = require("./RealDigital");

const deploy = async (
  realDigital
) => {
  const [admin, authority, enabled, unauthorized] =
    await ethers.getSigners();

  if (!realDigital) {
    realDigital = (await deployRealDigital()).real;
  }

  if (!await realDigital.verifyAccount(enabled.address)) {
    await realDigital.connect(authority).enableAccount(enabled.address);
  }

  if (await realDigital.verifyAccount(unauthorized.address)) {
    throw new Error("unauthorized account is already verified");
  }

  const STR = await ethers.getContractFactory("STR");
  const strInstance = await STR.deploy(
    realDigital.address,
  );
  await strInstance.deployed();
  await realDigital.connect(admin).grantRole(await realDigital.MINTER_ROLE(), strInstance.address);
  await realDigital.connect(admin).grantRole(await realDigital.BURNER_ROLE(), strInstance.address);

  return {
    realDigital,
    strInstance,
    enabled,
    unauthorized,
  };
};

module.exports = {
  deploy,
};

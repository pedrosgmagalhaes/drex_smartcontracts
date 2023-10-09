const { ethers } = require("hardhat");
const { expect } = require("chai");
const { parseReal } = require("../../util/parseFormatReal");
const { REAL_NAME, REAL_SYMBOL } = require("../../util/constants");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");

const MINT_AMOUNT = parseReal("100");
const FREEZE_AMOUNT = parseReal("50");

const deploy = async (addressDiscovery) => {
  if (!addressDiscovery) {
    addressDiscovery = (await deployAddressDiscovery()).addressDiscovery;
  }
  const RealDigital = await ethers.getContractFactory("RealDigital");
  [
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  ] = await ethers.getSigners();
  const real = await RealDigital.deploy(
    REAL_NAME,
    REAL_SYMBOL,
    authority.address,
    admin.address
  );
  await real.deployed();

  await addressDiscovery.connect(authority).updateAddress(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RealDigital")),
    real.address
  );

  return {
    real,
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  };
};

const deployMintTokens = async () => {
  const {
    real,
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  } = await deploy();

  await real.connect(authority).enableAccount(authority.address);
  await real.connect(authority).enableAccount(authorizedSender.address);
  await real.connect(authority).enableAccount(authorizedRecipient.address);

  await real.connect(authority).mint(authority.address, MINT_AMOUNT);
  expect(await real.balanceOf(authority.address)).to.equal(MINT_AMOUNT);

  await real.connect(authority).mint(authorizedSender.address, MINT_AMOUNT);
  expect(await real.balanceOf(authorizedSender.address)).to.equal(MINT_AMOUNT);

  return {
    real,
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  };
};

const deployMintAndFreezeTokens = async () => {
  const {
    real,
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  } = await deployMintTokens();
  await real
    .connect(authority)
    .increaseFrozenBalance(authorizedSender.address, FREEZE_AMOUNT);
  return {
    real,
    admin,
    authority,
    authorizedSender,
    authorizedRecipient,
    unauthorizedAccount,
  };
};

module.exports = {
  deploy,
  deployMintTokens,
  deployMintAndFreezeTokens,
  MINT_AMOUNT,
  FREEZE_AMOUNT
};
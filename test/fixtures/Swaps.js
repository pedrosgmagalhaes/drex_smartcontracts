const { ethers } = require("hardhat");
const { deploy: deployAddressDiscovery } = require("./AddressDiscovery");
const { deploy: deployRealDigital } = require("./RealDigital");
const { deployAddDefaultAccount } = require("./RealTokenizado");
const { RealTokenizadoParams } = require("./RealTokenizado");
const { parseReal } = require("../../util/parseFormatReal");
const { expect } = require("chai");

const keccakEncodeString = (str) => {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
};

const deploy = async (addressDiscovery, realDigital) => {
  if (!addressDiscovery) {
    addressDiscovery = (await deployAddressDiscovery()).addressDiscovery;
  }
  if (!realDigital) {
    realDigital = (await deployRealDigital()).real;
  }

  const [admin, authority] = await ethers.getSigners();
  const SwapOneStep = await ethers.getContractFactory("SwapOneStep");
  const swapOneStep = await SwapOneStep.deploy(
    realDigital.address
  );
  await swapOneStep.deployed();

  const SwapTwoSteps = await ethers.getContractFactory("SwapTwoSteps");
  const swapTwoSteps = await SwapTwoSteps.deploy(
    realDigital.address
  );
  await swapTwoSteps.deployed();

  const moverRole = keccakEncodeString("MOVER_ROLE");

  realDigital.connect(admin).grantRole(moverRole, swapOneStep.address);
  realDigital.connect(admin).grantRole(moverRole, swapTwoSteps.address);
  addressDiscovery.connect(authority).updateAddress(keccakEncodeString("SwapOneStep"), swapOneStep.address);
  addressDiscovery.connect(authority).updateAddress(keccakEncodeString("SwapTwoSteps"), swapTwoSteps.address);

  return {
    addressDiscovery,
    realDigital,
    swapOneStep,
    swapTwoSteps,
  };
};

const INITIAL_BALANCE = parseReal("1000");


const deployWithRealTokenizado = async (_addressDiscovery, _realDigital) => {
  const [admin, authority, rt1Reserve, rt1DefaultAccount, rt2Reserve, rt2DefaultAccount, enabledSender, enabledRecipient, unauthorized] = await ethers.getSigners();
  const { addressDiscovery, realDigital, swapOneStep, swapTwoSteps } = await deploy(_addressDiscovery, _realDigital);

  // either _realDigital was undefined and was deployed, or it was defined and was passed to deploy
  // in either case, the correct _realDigital to be used is in realDigital returned from deploy
  // same for _addressDiscovery
  _realDigital = realDigital;
  _addressDiscovery = addressDiscovery;

  const rtp1 = new RealTokenizadoParams(
    "RealTokenizado1",
    "RTK1",
    "ParticipantName1",
    12345678,
    rt1Reserve,
    rt1DefaultAccount,
  );
  const rtp2 = new RealTokenizadoParams(
    "RealTokenizado2",
    "RTK2",
    "ParticipantName2",
    87654321,
    rt2Reserve,
    rt2DefaultAccount,
  );

  const { realDigitalDefaultAccount, realTokenizado: rt1 } = await deployAddDefaultAccount(_addressDiscovery, undefined, swapOneStep, swapTwoSteps, rtp1);
  const { realTokenizado: rt2 } = await deployAddDefaultAccount(addressDiscovery, realDigitalDefaultAccount, swapOneStep, swapTwoSteps, rtp2);

  const enableTx1 = await rt1.connect(authority).enableAccount(enabledSender.address);
  enableTx1.wait();
  const enableTx2 = await rt2.connect(authority).enableAccount(enabledRecipient.address);
  enableTx2.wait();

  const enableRt1Reserve = await realDigital.connect(authority).enableAccount(rt1Reserve.address);
  await enableRt1Reserve.wait();
  const enableRt2Reserve = await realDigital.connect(authority).enableAccount(rt2Reserve.address);
  await enableRt2Reserve.wait();

  await realDigital.connect(authority).mint(rt1Reserve.address, INITIAL_BALANCE);
  await rt1.connect(authority).mint(enabledSender.address, INITIAL_BALANCE);

  expect(await realDigital.balanceOf(rtp1.reserve.address)).to.equal(INITIAL_BALANCE);
  expect(await rt1.balanceOf(enabledSender.address)).to.equal(INITIAL_BALANCE);
  expect(await realDigital.balanceOf(rtp2.reserve.address)).to.equal(0);
  expect(await rt2.balanceOf(enabledRecipient.address)).to.equal(0);

  const grantFreezerRd = await realDigital.grantRole(await realDigital.FREEZER_ROLE(), swapTwoSteps.address);
  await grantFreezerRd.wait();


  return {
    realDigital,
    swapOneStep,
    swapTwoSteps,
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado1: rt1,
    realTokenizado2: rt2,
    realTokenizadoParams1: rtp1,
    realTokenizadoParams2: rtp2,
    admin,
    authority,
    enabledSender,
    enabledRecipient,
    unauthorized,
  };
};


module.exports = {
  deploy,
  deployWithRealTokenizado,
  INITIAL_BALANCE
};
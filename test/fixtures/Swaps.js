const { ethers } = require("hardhat");
const { deploy: deployRealDigital } = require("./RealDigital");
const { deployAddDefaultAccount } = require("./RealTokenizado");
const { RealTokenizadoParams } = require("./RealTokenizado");
const { parseReal } = require("../../util/parseFormatReal");
const { expect } = require("chai");

const deploy = async (realDigital, swapClass) => {
  if (!realDigital) {
    realDigital = (await deployRealDigital()).real;
  }

  const Swap = await ethers.getContractFactory(swapClass);
  const [
    admin,
    authority,
    unauthorizedAccount,
  ] = await ethers.getSigners();

  const swap = await Swap.deploy(
    realDigital.address
  );
  await swap.deployed();

  realDigital.connect(admin).grantRole(await realDigital.MOVER_ROLE(), swap.address);

  return {
    realDigital,
    swap
  };
};

const INITIAL_BALANCE = parseReal("1000");


const deployWithRealTokenizado = async (_realDigital, swapClass) => {
  const [admin, authority, rt1Reserve, rt1DefaultAccount, rt2Reserve, rt2DefaultAccount, enabledSender, enabledRecipient, unauthorized] = await ethers.getSigners();
  const { realDigital, swap } = await deploy(_realDigital, swapClass);
  // either _realDigital was undefined and was deployed, or it was defined and was passed to deploy
  // in either case, the correct _realDigital to be used is in realDigital returned from deploy
  _realDigital = realDigital;

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

  const { addressDiscovery, realDigitalDefaultAccount, realTokenizado: rt1 } = await deployAddDefaultAccount(undefined, undefined, rtp1);
  const { realTokenizado: rt2 } = await deployAddDefaultAccount(addressDiscovery, realDigitalDefaultAccount, rtp2);

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

  const grantMinterRt1 = await rt1.grantRole(await rt1.MINTER_ROLE(), swap.address);
  await grantMinterRt1.wait();
  const grantMinterRt2 = await rt2.grantRole(await rt2.MINTER_ROLE(), swap.address);
  await grantMinterRt2.wait();
  const grantBurnerRt1 = await rt1.grantRole(await rt1.BURNER_ROLE(), swap.address);
  await grantBurnerRt1.wait();
  const grantBurnerRt2 = await rt2.grantRole(await rt2.BURNER_ROLE(), swap.address);
  await grantBurnerRt2.wait();

  return {
    realDigital,
    swap,
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

const deployOneStep = async (_realDigital) => {
  return deploy(_realDigital, "SwapOneStep");
};

const deployTwoStep = async (_realDigital) => {
  return deploy(_realDigital, "SwapTwoStep");
};

const deployOneStepWithRealTokenizado = async (_realDigital) => {
  return deployWithRealTokenizado(_realDigital, "SwapOneStep");
};

const deployTwoStepWithRealTokenizado = async (_realDigital) => {
  return deployWithRealTokenizado(_realDigital, "SwapTwoStep");
};



module.exports = {
  deployOneStep,
  deployTwoStep,
  deployOneStepWithRealTokenizado,
  deployTwoStepWithRealTokenizado,
  INITIAL_BALANCE
};
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { deployTwoStepsWithRealTokenizado, INITIAL_BALANCE } = require("./Swaps");

const deployInitiateSwap = async () => {
  const {
    realDigital,
    swap,
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado1,
    realTokenizado2,
    realTokenizadoParams1,
    realTokenizadoParams2,
    admin,
    authority,
    enabledSender,
    enabledRecipient,
    unauthorized,
  } = await deployTwoStepsWithRealTokenizado();

  const amount = INITIAL_BALANCE.sub(20000);
  await swap.connect(enabledSender).startSwap(
    realTokenizado1.address,
    realTokenizado2.address,
    enabledRecipient.address,
    amount
  );

  await realTokenizado1.connect(enabledSender).increaseAllowance(swap.address, amount);

  return {
    realDigital,
    swap,
    addressDiscovery,
    realDigitalDefaultAccount,
    realTokenizado1,
    realTokenizado2,
    realTokenizadoParams1,
    realTokenizadoParams2,
    admin,
    authority,
    enabledSender,
    enabledRecipient,
    unauthorized,
    proposalId: 0,
  };
};


module.exports = {
  deployInitiateSwap,
  INITIAL_BALANCE,
};

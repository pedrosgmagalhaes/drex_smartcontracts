const { deployWithRealTokenizado, INITIAL_BALANCE } = require("./Swaps");

const deployInitiateSwap = async () => {
  const {
    realDigital,
    swapOneStep,
    swapTwoSteps,
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
  } = await deployWithRealTokenizado();

  const amount = INITIAL_BALANCE.sub(20000);
  await swapTwoSteps.connect(enabledSender).startSwap(
    realTokenizado1.address,
    realTokenizado2.address,
    enabledRecipient.address,
    amount
  );

  await realTokenizado1.connect(enabledSender).increaseAllowance(swapTwoSteps.address, amount);

  return {
    realDigital,
    swapOneStep,
    swapTwoSteps,
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

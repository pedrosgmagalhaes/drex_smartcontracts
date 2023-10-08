const { task } = require("hardhat/config");

task("isEnabled", "Check if account is enabled in a contract")
  .addPositionalParam(
    "contractAddress",
    "The token contract to check (RealDigital or one of RealTokenizado)"
  )
  .addPositionalParam(
    "account",
    "The account to check"
  )
  .setAction(async (taskArgs, hre) => {
    const contract = (await hre.ethers.getContractFactory("RealDigital")).attach(taskArgs.contractAddress);
    console.log(
      `Account ${taskArgs.account} is ${
        (await contract.verifyAccount(taskArgs.account))
          ? "enabled"
          : "disabled"
      }`
    );
  });

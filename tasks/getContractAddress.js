const { task } = require("hardhat/config");
const { getDeployedContract } = require("../util/contracts");

task("getContractAddress", "Get the address of a deployed contract")
  .addPositionalParam("contractKey", "The key of the contract in the .env file")
  .setAction(async (taskArgs, hre) => {
    const contract = await getDeployedContract(taskArgs.contractKey);
    console.log(`Address of ${taskArgs.contractKey}: ${contract.address}`);
  });

const { task } = require("hardhat/config");
const { getDeployedContract, getAddressDiscoveryContractName } = require("../util/contracts");
const { ACCOUNTS } = require("../util/constants");

task("updateAddress", "Update a contract address in AddressDiscovery")
  .addPositionalParam("contractKey", "The key of the contract in AddressDiscovery")
  .addPositionalParam("newAddress", "The new address to update to")
  .setAction(async (taskArgs, hre) => {
    const addressDiscovery = await getDeployedContract("ADDRESS_DISCOVERY");
    const signers = await ethers.getSigners();
    const authority = signers[ACCOUNTS.AUTHORITY];
    const key = getAddressDiscoveryContractName(taskArgs.contractKey);
    const tx = await addressDiscovery.connect(authority).updateAddress(key, taskArgs.newAddress);
    await tx.wait();
    console.log(
      `Address of ${taskArgs.contractKey} updated to: ${taskArgs.newAddress}`
    );
  });

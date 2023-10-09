const { task } = require("hardhat/config");
const { getAddressDiscovery, getAddressDiscoveryContractName } = require("../util/contracts");

task("listContracts", "Lists the contracts deployed to the network")
  .setAction(async (taskArgs, hre) => {
    const addressDiscovery = await getAddressDiscovery();
    const contractNames = [
      'RealDigital',
      'RealTokenizado@12345678',
      'RealTokenizado@87654321',
      'RealDigitalDefaultAccount',
      'RealDigitalEnableAccount',
      'SwapOneStep',
      'SwapTwoSteps',
      'STR'
    ];

    const contracts = [{ name: 'AddressDiscovery', address: addressDiscovery.address}];
    for (const contractName of contractNames) {
      const addr = await addressDiscovery.addressDiscovery(
        getAddressDiscoveryContractName(contractName)
      );
      contracts.push({ name: contractName, address: addr });
    }

    console.table(contracts);
  });

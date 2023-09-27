const { CONTRACTS } = require("./constants");

let addressDiscovery;

const getAddressDiscoveryContractName = (humanReadableName) => {
  if (humanReadableName.startsWith("RealTokenizado@")) {
    const split = humanReadableName.split("@");
    return ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["string", "uint256"],
        ["RealTokenizado@", split[1]]
      )
    );
  }

  return ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(humanReadableName)
  );
};

const getDeployedContract = async (contractKey) => {
  if (!addressDiscovery) {
    if (!process.env.ADDRESS_DISCOVERY_ADDR) {
      throw new Error("No address found for ADDRESS_DISCOVERY in .env");
    }

    const AddressDiscovery = await ethers.getContractFactory(
      "AddressDiscovery"
    );
    addressDiscovery = await AddressDiscovery.attach(
      process.env.ADDRESS_DISCOVERY_ADDR
    );
  }

  if (contractKey === CONTRACTS.ADDRESS_DISCOVERY) {
    return addressDiscovery;
  }

  let contractName = contractKey;
  if (contractName.startsWith("RealTokenizado")) {
    contractName = "RealTokenizado";
  }

  const addr = await addressDiscovery.addressDiscovery(
    getAddressDiscoveryContractName(contractKey)
  );

  const Contract = await ethers.getContractFactory(contractName);
  return await Contract.attach(addr);
};

module.exports = {
  getDeployedContract,
  getAddressDiscoveryContractName
};

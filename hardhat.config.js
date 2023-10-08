require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("./tasks/getContractAddress");
require("./tasks/updateAddress");
require("./tasks/isEnabled");
require("./tasks/listContracts");

const ACCOUNTS_FROM_ENV_MNEMONIC = {
  mnemonic: process.env.MNEMONIC ?? "",
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: ACCOUNTS_FROM_ENV_MNEMONIC,
    },
    besuPrivate: {
      url: process.env.BESU_PRIVATE_URL ?? "",
      accounts: ACCOUNTS_FROM_ENV_MNEMONIC,
    },
  },
};

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("./tasks/getContractAddress");
require("./tasks/updateAddress");

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
    besuPrivate: {
      url: process.env.BESU_PRIVATE_URL ?? "",
      accounts: {
        mnemonic: process.env.MNEMONIC ?? "",
      }
    },
  },
};

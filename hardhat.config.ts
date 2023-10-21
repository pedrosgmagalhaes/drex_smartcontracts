import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config } from "dotenv";
import glob from "glob";
import path from "path";

config();

// load all tasks
glob.sync("./tasks/**/*.{ts,js}").forEach((file) => require(path.resolve(file)));

const ACCOUNTS_FROM_ENV_MNEMONIC = {
  mnemonic: process.env.MNEMONIC ?? "",
};

/** @type import('hardhat/config').HardhatUserConfig */
const hardhatConfig: HardhatUserConfig = {
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

export default hardhatConfig;

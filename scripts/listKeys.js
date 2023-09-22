const ethers = require("ethers");
require("dotenv").config();

let mnemonic = process.env.MNEMONIC;

const listLength = 20;
const base = "m/44'/60'/0'/0/";

const accounts = [];

for (let i = 0; i < listLength; i++) {
  let wallet = ethers.Wallet.fromMnemonic(mnemonic, base + i);
  accounts.push({ address: wallet.address, key: wallet.privateKey });
}

console.table(accounts);

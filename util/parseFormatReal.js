const { ethers } = require("hardhat");
const { REAL_DECIMALS } = require("./constants");

const parseReal = (realString) => {
    return ethers.utils.parseUnits(realString, REAL_DECIMALS);
}

const formatReal = (realBigNumber) => {
    return ethers.utils.formatUnits(realBigNumber, REAL_DECIMALS);
}

module.exports = {
    parseReal,
    formatReal
}
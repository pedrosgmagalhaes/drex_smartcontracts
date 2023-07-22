const { ethers } = require("hardhat");

const roleKeccak = (role) => {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

const getRoleError = (address, role) => {
    return `AccessControl: account ${address.toLowerCase()} is missing role ${roleKeccak(role)}`;
}

module.exports = {
    getRoleError
}
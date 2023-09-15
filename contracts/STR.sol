// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RealDigital.sol";

contract STR {
    RealDigital private token;

    constructor(RealDigital _token) {
        token = _token;
    }

    modifier onlyVerifiedAccount() {
        require(
            token.verifyAccount(msg.sender),
            "STR: Caller is not verified in RealDigital"
        );
        _;
    }

    function requestToMint(uint256 amount) public onlyVerifiedAccount {
        token.mint(msg.sender, amount);
    }

    function requestToBurn(uint256 amount) public onlyVerifiedAccount {
        token.burnFrom(msg.sender, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RealDigital.sol";

contract STR {
    RealDigital private token;

    constructor(RealDigital _token) {
        token = _token;
    }

    function requestToMint(uint256 amount) public {
        // Requires the caller to have the MINTER_ROLE in the RealDigital contract
        require(
            token.hasRole(token.MINTER_ROLE(), msg.sender),
            "STR: Caller does not have Minter role in RealDigital"
        );

        // Mints the specified amount to the caller's address
        token.mint(msg.sender, amount);
    }

    function requestToBurn(uint256 amount) public {
        // Requires the caller to have the BURNER_ROLE in the RealDigital contract
        require(
            token.hasRole(token.BURNER_ROLE(), msg.sender),
            "STR: Caller does not have Burner role in RealDigital"
        );

        // Burns the specified amount from the caller's address
        token.burnFrom(msg.sender, amount);
    }
}

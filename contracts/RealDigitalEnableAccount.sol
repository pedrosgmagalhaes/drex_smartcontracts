// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CBDCAccessControl.sol";

contract RealDigitalEnableAccount {
    CBDCAccessControl accessControl;

    constructor(CBDCAccessControl _accessControlAddress) {
        accessControl = _accessControlAddress;
    }

    function disableAccount() public {
        require(
            accessControl.hasRole(accessControl.ACCESS_ROLE(), msg.sender),
            "RealDigitalEnableAccount: Caller does not have ACCESS_ROLE in CBDCAccessControl"
        );

        accessControl.disableAccount(msg.sender);
    }

    function enableAccount(address member) public {
        require(
            accessControl.hasRole(accessControl.ACCESS_ROLE(), msg.sender),
            "RealDigitalEnableAccount: Caller does not have ACCESS_ROLE in CBDCAccessControl"
        );

        accessControl.enableAccount(member);
    }
}

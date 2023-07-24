// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CBDCAccessControl.sol";

contract AddressDiscovery is CBDCAccessControl {
    mapping(bytes32 => address) public addressDiscovery;

    constructor(address _authority, address _admin) CBDCAccessControl(_authority, _admin) {}

    function updateAddress(bytes32 smartContract, address newAddress) public onlyRole(ACCESS_ROLE) {
        addressDiscovery[smartContract] = newAddress;
    }
}

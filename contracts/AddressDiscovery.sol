// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AddressDiscovery is AccessControl {
    address internal authority;
    address internal admin;

    bytes32 public constant ACCESS_ROLE = keccak256("ACCESS_ROLE");

    mapping(bytes32 => address) public addressDiscovery;

    event AddressUpdated(bytes32 indexed smartContract, address indexed newAddress);

    constructor(address _authority, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACCESS_ROLE, _authority);
    }

    function updateAddress(bytes32 smartContract, address newAddress) external onlyRole(ACCESS_ROLE) {
        addressDiscovery[smartContract] = newAddress;
        emit AddressUpdated(smartContract, newAddress);
    }

    function changeAuthority(address newAuthority) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ACCESS_ROLE, authority);
        authority = newAuthority;
        grantRole(ACCESS_ROLE, newAuthority);
    }
}

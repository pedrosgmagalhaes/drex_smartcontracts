// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./RealDigital.sol";
import "./AddressDiscovery.sol";
import "./CBDCAccessControl.sol";

contract RealDigitalDefaultAccount is AccessControl {
    bytes32 public constant ACCESS_ROLE = keccak256("ACCESS_ROLE");
    mapping(uint256 => address) public defaultAccount;
    AddressDiscovery immutable public addressDiscovery;

    constructor(AddressDiscovery _ad, address _authority, address _admin) {
        addressDiscovery = _ad;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACCESS_ROLE, _authority);
    }

    function addDefaultAccount(uint256 cnpj8, address account) public onlyRole(ACCESS_ROLE) {
        defaultAccount[cnpj8] = account;
        RealDigital rd = getRealTokenizado(cnpj8);
        bytes32[] memory roles = getParticipantRoles(rd);
        for (uint256 i = 0; i < roles.length; i++) {
            rd.grantRole(roles[i], account);
        }
    }

    function updateDefaultAccount(uint256 cnpj8, address account) public {
        require(msg.sender == defaultAccount[cnpj8], "RealDigitalDefaultAccount: caller is not the default account");
        RealDigital rd = getRealTokenizado(cnpj8);
        bytes32[] memory roles = getParticipantRoles(rd);
        for (uint256 i = 0; i < roles.length; i++) {
            rd.revokeRole(roles[i], msg.sender);
            rd.grantRole(roles[i], account);
        }
        defaultAccount[cnpj8] = account;
    }

    function getRealTokenizado(uint256 cnpj8) internal view returns (RealDigital) {
        address _address = addressDiscovery.addressDiscovery(keccak256(abi.encodePacked("RealTokenizado", cnpj8)));
        require(_address != address(0), "RealDigitalDefaultAccount: RealTokenizado not found for given cnpj8");
        return RealDigital(_address);
    }

    function getParticipantRoles(RealDigital _rd) internal view returns (bytes32[] memory) {
        bytes32[] memory roles = new bytes32[](3);
        roles[0] = _rd.MOVER_ROLE();
        roles[1] = _rd.FREEZER_ROLE();
        roles[2] = _rd.ACCESS_ROLE();
        return roles;
    }
}

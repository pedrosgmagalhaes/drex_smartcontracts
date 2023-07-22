// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CBCDAccessControl is AccessControl {
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MOVER_ROLE = keccak256("MOVER_ROLE");
    bytes32 public constant ACCESS_ROLE = keccak256("ACCESS_ROLE");

    mapping(address => bool) public authorizedAccounts;

    event EnabledAccount(address indexed member);
    event DisabledAccount(address indexed member);

    modifier checkAccess(address from, address to) {
        require(
            authorizedAccounts[from] && authorizedAccounts[to],
            "CBDCAccessControl: Both from and to accounts must be authorized"
        );
        _;
    }


    constructor(address _authority, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(BURNER_ROLE, _authority);
        _grantRole(MINTER_ROLE, _authority);
        _grantRole(PAUSER_ROLE, _authority);
        _grantRole(MOVER_ROLE, _authority);
        _grantRole(ACCESS_ROLE, _authority);
    }

    function disableAccount(address member) public onlyRole(ACCESS_ROLE) {
        authorizedAccounts[member] = false;
        emit DisabledAccount(member);
    }

    function enableAccount(address member) public onlyRole(ACCESS_ROLE) {
        authorizedAccounts[member] = true;
        emit EnabledAccount(member);
    }

    function verifyAccount(address account) public view virtual returns (bool) {
        return authorizedAccounts[account];
    }
}

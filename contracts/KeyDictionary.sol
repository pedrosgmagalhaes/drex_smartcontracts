// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./RealDigital.sol";

contract KeyDictionary {
    struct CustomerData {
        uint256 taxId;
        uint256 bankNumber;
        uint256 account;
        uint256 branch;
        address wallet;
        bool registered;
        address owner;
    }

    RealDigital public token;
    mapping(bytes32 => CustomerData) private customers;
    mapping(address => bytes32) private keys;

    event KeyRequested(
        address indexed owner,
        uint256 proposalId,
        bytes32 indexed key
    );

    constructor(address _token) {
        token = RealDigital(_token);
    }

    function addAccount(
        bytes32 key,
        uint256 _taxId,
        uint256 _bankNumber,
        uint256 _account,
        uint256 _branch,
        address _wallet
    ) public {
        require(!customers[key].registered, "Key is already registered");
        CustomerData storage customer = customers[key];
        customer.taxId = _taxId;
        customer.bankNumber = _bankNumber;
        customer.account = _account;
        customer.branch = _branch;
        customer.wallet = _wallet;
        customer.registered = true;
        customer.owner = msg.sender;
        keys[_wallet] = key;
    }

    function authorizeKey(uint256 proposalId, bytes32 key) public {
        require(customers[key].registered, "Key is not registered");
        emit KeyRequested(customers[key].owner, proposalId, key);
    }

    function getCustomerData(
        bytes32 key
    ) public view returns (CustomerData memory) {
        return customers[key];
    }

    function getKey(address wallet) public view returns (bytes32) {
        return keys[wallet];
    }

    function getWallet(bytes32 key) public view returns (address) {
        return customers[key].wallet;
    }

    function requestKey(
        bytes32 key,
        uint256 _taxId,
        uint256 _bankNumber,
        uint256 _account,
        uint256 _branch,
        address _wallet
    ) public {
        require(!customers[key].registered, "Key is already registered");
        addAccount(key, _taxId, _bankNumber, _account, _branch, _wallet);
    }

    function updateData(
        bytes32 key,
        uint256 _taxId,
        uint256 _bankNumber,
        uint256 _account,
        uint256 _branch,
        address _wallet
    ) public {
        require(customers[key].owner == msg.sender, "Not the owner");
        addAccount(key, _taxId, _bankNumber, _account, _branch, _wallet);
    }
}

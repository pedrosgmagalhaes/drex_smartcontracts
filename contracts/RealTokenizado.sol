// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RealDigital.sol";

contract RealTokenizado is RealDigital {
    // reordered for optimum storage packing
    uint256 public cnpj8; // First 8 digits of the institution's CNPJ
    address public reserve; // Participant institution's reserve wallet.
    string public participant; // String representing the participant's name.

    constructor(
        string memory _name,
        string memory _symbol,
        address _authority,
        address _admin,
        string memory _participant,
        uint256 _cnpj8,
        address _reserve
    ) RealDigital(_name, _symbol, _authority, _admin) {
        participant = _participant;
        cnpj8 = _cnpj8;
        reserve = _reserve;
    }

    function updateReserve(address _newReserve) public {
        require(_msgSender() == authority, "RealTokenizado: Only authority can update reserve");
        reserve = _newReserve;
    }
}
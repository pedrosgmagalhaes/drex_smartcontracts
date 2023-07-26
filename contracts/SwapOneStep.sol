// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CBDCAccessControl.sol";
import "./RealDigital.sol";
import "./RealTokenizado.sol";

contract SwapOneStep is CBDCAccessControl {
    RealDigital private CBDC;

    event SwapExecuted(
        uint256 senderNumber,
        uint256 receiverNumber,
        address sender,
        address receiver,
        uint256 amount
    );

    constructor(
        RealDigital _CBDC,
        address _authority,
        address _admin
    ) CBDCAccessControl(_authority, _admin) {
        CBDC = _CBDC;
    }

    function executeSwap(
        RealTokenizado tokenSender,
        RealTokenizado tokenReceiver,
        address receiver,
        uint256 amount
    ) public {
        // Check the balance of the sender
        require(
            tokenSender.balanceOf(msg.sender) >= amount,
            "SwapOneStep: Sender does not have enough balance"
        );

        // Check that the receiver token's reserve has enough balance
        require(
            tokenReceiver.balanceOf(tokenReceiver.reserve()) >= amount,
            "SwapOneStep: Receiver token reserve does not have enough balance"
        );

        // Transfer the amount from the sender to the sender token's reserve
        tokenSender.transferFrom(msg.sender, tokenSender.reserve(), amount);

        // Transfer the equivalent amount from the receiver token's reserve to the receiver
        tokenReceiver.transferFrom(tokenReceiver.reserve(), receiver, amount);

        // Emit the SwapExecuted event
        emit SwapExecuted(
            tokenSender.cnpj8(),
            tokenReceiver.cnpj8(),
            msg.sender,
            receiver,
            amount
        );
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override returns (bool) {
        return
            interfaceId == type(AccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

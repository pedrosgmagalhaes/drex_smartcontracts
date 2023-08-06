// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CBDCAccessControl.sol";
import "./RealDigital.sol";
import "./RealTokenizado.sol";

contract SwapOneStep {
    RealDigital public CBDC;

    event SwapExecuted(
        uint256 senderNumber,
        uint256 receiverNumber,
        address sender,
        address receiver,
        uint256 amount
    );

    constructor(
        RealDigital _CBDC
    ) {
        CBDC = _CBDC;
    }

    function executeSwap(
        RealTokenizado tokenSender,
        RealTokenizado tokenReceiver,
        address receiver,
        uint256 amount
    ) public {
        require(tokenSender.verifyAccount(msg.sender), "SwapOneStep: Sender is not authorized");
        require(tokenReceiver.verifyAccount(receiver), "SwapOneStep: Receiver is not authorized");
        require(
            tokenSender.balanceOf(msg.sender) - tokenSender.frozenBalanceOf(msg.sender) >= amount,
            "SwapOneStep: Sender does not have enough balance"
        );

        // burn the senders RealTokenizado
        tokenSender.burnFrom(msg.sender, amount);
        // transfer the CBDC from the sender participant's reserve to the receiver participant's reserve
        CBDC.move(tokenSender.reserve(), tokenReceiver.reserve(), amount);
        // mint the receivers RealTokenizado
        tokenReceiver.mint(receiver, amount);

        // Emit the SwapExecuted event
        emit SwapExecuted(
            tokenSender.cnpj8(),
            tokenReceiver.cnpj8(),
            msg.sender,
            receiver,
            amount
        );
    }
}

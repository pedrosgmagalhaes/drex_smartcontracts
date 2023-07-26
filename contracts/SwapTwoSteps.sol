// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CBDCAccessControl.sol";
import "./RealDigital.sol";
import "./RealTokenizado.sol";

contract SwapTwoSteps is CBDCAccessControl {
    struct Proposal {
        RealTokenizado tokenSender;
        RealTokenizado tokenReceiver;
        address receiver;
        uint256 amount;
        bool executed;
    }

    RealDigital private CBDC;
    mapping(uint256 => Proposal) private proposals;
    uint256 private proposalCount;

    event SwapStarted(
        uint256 senderNumber,
        uint256 receiverNumber,
        address sender,
        address receiver,
        uint256 amount
    );
    event SwapExecuted(
        uint256 senderNumber,
        uint256 receiverNumber,
        address sender,
        address receiver,
        uint256 amount
    );
    event SwapCancelled(uint256 proposalId, string reason);

    constructor(
        RealDigital _CBDC,
        address _authority,
        address _admin
    ) CBDCAccessControl(_authority, _admin) {
        CBDC = _CBDC;
        proposalCount = 0;
    }

    function startSwap(
        RealTokenizado tokenSender,
        RealTokenizado tokenReceiver,
        address receiver,
        uint256 amount
    ) public {
        // Check the balance of the sender
        require(
            tokenSender.balanceOf(msg.sender) >= amount,
            "SwapTwoSteps: Sender does not have enough balance"
        );
        // Create a proposal
        proposals[proposalCount] = Proposal({
            tokenSender: tokenSender,
            tokenReceiver: tokenReceiver,
            receiver: receiver,
            amount: amount,
            executed: false
        });
        // Emit the SwapStarted event
        emit SwapStarted(
            tokenSender.cnpj8(),
            tokenReceiver.cnpj8(),
            msg.sender,
            receiver,
            amount
        );
        proposalCount++;
    }

    function executeSwap(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "SwapTwoSteps: Proposal already executed");

        // Check that the receiver token's reserve has enough balance
        require(
            proposal.tokenReceiver.balanceOf(
                proposal.tokenReceiver.reserve()
            ) >= proposal.amount,
            "SwapTwoSteps: Receiver token reserve does not have enough balance"
        );

        // Transfer the amount from the sender to the sender token's reserve
        proposal.tokenSender.transferFrom(
            msg.sender,
            proposal.tokenSender.reserve(),
            proposal.amount
        );

        // Transfer the equivalent amount from the receiver token's reserve to the receiver
        proposal.tokenReceiver.transferFrom(
            proposal.tokenReceiver.reserve(),
            proposal.receiver,
            proposal.amount
        );

        // Mark proposal as executed
        proposal.executed = true;

        // Emit the SwapExecuted event
        emit SwapExecuted(
            proposal.tokenSender.cnpj8(),
            proposal.tokenReceiver.cnpj8(),
            msg.sender,
            proposal.receiver,
            proposal.amount
        );
    }

    function cancelSwap(uint256 proposalId, string memory reason) public {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "SwapTwoSteps: Proposal already executed");

        // Delete the proposal
        delete proposals[proposalId];

        // Emit the SwapCancelled event
        emit SwapCancelled(proposalId, reason);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override returns (bool) {
        return
            interfaceId == type(AccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

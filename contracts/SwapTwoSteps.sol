// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CBDCAccessControl.sol";
import "./RealDigital.sol";
import "./RealTokenizado.sol";

contract SwapTwoSteps {
    enum SwapStatus {
      PENDING,          // Swap operation registered, pending cancellation or execution.
      EXECUTED,         // Swap operation executed.
      CANCELLED         // Swap operation cancelled.
    }

    struct SwapProposal {
      RealTokenizado tokenSender;      // The address of the Real Tokenizado contract of the paying participant
      RealTokenizado tokenReceiver;    // The address of the Real Tokenizado contract of the receiving participant
      address sender;                  // The address of the payer's wallet
      address receiver;                // The address of the receiver's wallet
      uint256 amount;                  // Amount of Reais to be moved.
      SwapStatus status;               // Current situation of the operation.
      uint256 timestamp;               // The timestamp of the operation.
    }

    uint256 private immutable EXPIRATION_TIME = 60; // 60 seconds
    RealDigital private CBDC;
    mapping(uint256 => SwapProposal) public swapProposals;
    uint256 private _nextProposalId = 0;

    event SwapStarted(
      uint256 proposalId,
      uint256 senderNumber,
      uint256 receiverNumber,
      address sender,
      address receiver,
      uint256 amount
    );
    event SwapExecuted(
      uint256 proposalId,
      uint256 senderNumber,
      uint256 receiverNumber,
      address sender,
      address receiver,
      uint256 amount
    );
    event SwapCancelled(uint256 proposalId, string reason);
    event ExpiredProposal(uint256 proposalId);

    constructor(RealDigital _CBDC) {
        CBDC = _CBDC;
    }

    function startSwap(
        RealTokenizado tokenSender,
        RealTokenizado tokenReceiver,
        address receiver,
        uint256 amount
    ) public {
        require(tokenSender.verifyAccount(msg.sender), "SwapTwoSteps: Sender is not authorized");
        require(tokenReceiver.verifyAccount(receiver), "SwapTwoSteps: Receiver is not authorized");

        _secureFunds(tokenSender, msg.sender, amount);

        swapProposals[_nextProposalId++] = SwapProposal({
            tokenSender: tokenSender,
            tokenReceiver: tokenReceiver,
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            status: SwapStatus.PENDING,
            timestamp: block.timestamp
        });
        // Emit the SwapStarted event
        emit SwapStarted(
            _nextProposalId - 1,
            tokenSender.cnpj8(),
            tokenReceiver.cnpj8(),
            msg.sender,
            receiver,
            amount
        );
    }

    function executeSwap(uint256 proposalId) public {
        require(proposalId < _nextProposalId, "SwapTwoSteps: Proposal does not exist");
        SwapProposal storage proposal = swapProposals[proposalId];
        require(proposal.receiver == msg.sender, "SwapTwoSteps: Only the receiver can accept the swap");
        require(proposal.status == SwapStatus.PENDING, "SwapTwoSteps: Proposal already closed");
        // re-check authorization as it might have changed since the proposal was created
        require(proposal.tokenSender.verifyAccount(proposal.sender), "SwapTwoSteps: Sender is not authorized");
        require(proposal.tokenReceiver.verifyAccount(proposal.receiver), "SwapTwoSteps: Receiver is not authorized");
        require(block.timestamp - proposal.timestamp <= EXPIRATION_TIME, "SwapTwoSteps: Proposal expired");

        _releaseFunds(proposal.tokenSender, proposal.sender, proposal.amount);

        // doublecheck if the sender still has enough balance
        // the funds could have been unfrozen by the authority in the meantime
        require(
            proposal.tokenSender.balanceOf(proposal.sender) - proposal.tokenSender.frozenBalanceOf(proposal.sender) >= proposal.amount,
            "SwapTwoSteps: Sender does not have enough balance"
        );

        // burn the senders RealTokenizado
        proposal.tokenSender.burnFrom(proposal.sender, proposal.amount);
        // transfer the CBDC from the sender participant's reserve to the receiver participant's reserve
        CBDC.move(proposal.tokenSender.reserve(), proposal.tokenReceiver.reserve(), proposal.amount);
        // mint the receivers RealTokenizado
        proposal.tokenReceiver.mint(proposal.receiver, proposal.amount);

        proposal.status = SwapStatus.EXECUTED;
        proposal.timestamp = block.timestamp;

        emit SwapExecuted(
            proposalId,
            proposal.tokenSender.cnpj8(),
            proposal.tokenReceiver.cnpj8(),
            proposal.sender,
            proposal.receiver,
            proposal.amount
        );
    }

    function cancelSwap(uint256 proposalId, string memory reason) public {
        require(proposalId < _nextProposalId, "SwapTwoSteps: Proposal does not exist");
        SwapProposal storage proposal = swapProposals[proposalId];
        require(
          block.timestamp - proposal.timestamp > EXPIRATION_TIME || proposal.receiver == msg.sender || proposal.sender == msg.sender,
          "SwapTwoSteps: Only the sender or receiver can cancel the swap"
        );
        require(proposal.status == SwapStatus.PENDING, "SwapTwoSteps: Proposal already closed");

        _releaseFunds(proposal.tokenSender, proposal.sender, proposal.amount);
        proposal.status = SwapStatus.CANCELLED;
        proposal.timestamp = block.timestamp;

        // if the swap expired emit SwapExpired
        // otherwise emit SwapCancelled
        if (block.timestamp - proposal.timestamp > EXPIRATION_TIME) {
          emit ExpiredProposal(proposalId);
        } else {
          emit SwapCancelled(proposalId, reason);
        }
    }

    function _secureFunds(RealTokenizado _sentToken, address _sender, uint256 _amount) internal {
        require(
            _sentToken.balanceOf(_sender) - _sentToken.frozenBalanceOf(_sender) >= _amount,
            "SwapTwoSteps: Sender does not have enough balance"
        );
        _sentToken.increaseFrozenBalance(_sender, _amount);
        CBDC.increaseFrozenBalance(_sentToken.reserve(), _amount);
    }

    function _releaseFunds(RealTokenizado _sentToken, address _sender, uint256 _amount) internal {
        _sentToken.decreaseFrozenBalance(_sender, _amount);
        CBDC.decreaseFrozenBalance(_sentToken.reserve(), _amount);
    }
}

const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  deployTwoStepsWithRealTokenizado: deployWithRealTokenizado,
  INITIAL_BALANCE,
} = require("./fixtures/Swaps");
const { deployInitiateSwap } = require("./fixtures/SwapTwoStep");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { setNextBlockTimestamp } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time");

const EXPIRATION_TIME = 60;

describe("SwapTwoSteps", function () {
  describe("startSwap", function () {
    it("Should start a swap", async function () {
      const {
        swap,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await realTokenizado1.connect(enabledSender).increaseAllowance(swap.address, amount);

      const senderFrozenBefore = await realTokenizado1.frozenBalanceOf(
        enabledSender.address
      );
      const cbdcFrozenBefore = await realDigital.frozenBalanceOf(
        realTokenizado1.reserve()
      );

      await swap
        .connect(enabledSender)
        .startSwap(
          realTokenizado1.address,
          realTokenizado2.address,
          enabledRecipient.address,
          amount
        );

      expect(await realTokenizado1.frozenBalanceOf(enabledSender.address)).to.equal(senderFrozenBefore.add(amount));
      expect(await realDigital.frozenBalanceOf(realTokenizado1.reserve())).to.equal(cbdcFrozenBefore.add(amount));

      const proposal = await swap.swapProposals(0);
      expect(proposal.sender).to.equal(enabledSender.address);
      expect(proposal.receiver).to.equal(enabledRecipient.address);
      expect(proposal.amount).to.equal(amount);
      expect(proposal.tokenSender).to.equal(realTokenizado1.address);
      expect(proposal.tokenReceiver).to.equal(realTokenizado2.address);
    });

    it("Should revert if sender is not enabled", async function () {
      const {
        swap,
        realTokenizado1,
        realTokenizado2,
        unauthorized,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swap
          .connect(unauthorizedAccount)
          .startSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            unauthorized.address,
            amount
          )
      ).to.be.revertedWith("SwapTwoSteps: Sender is not authorized");
    });

    it("Should revert if recipient is not enabled", async function () {
      const {
        swap,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        unauthorized,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swap
          .connect(enabledSender)
          .startSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            unauthorized.address,
            amount
          )
      ).to.be.revertedWith("SwapTwoSteps: Receiver is not authorized");
    });

    it("Should revert on insufficient balance", async function () {
      const {
        swap,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.add(20000);

      await expect(
        swap
          .connect(enabledSender)
          .startSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            enabledRecipient.address,
            amount
          )
      ).to.be.revertedWith("SwapTwoSteps: Sender does not have enough balance");
    });
  });

  describe("executeSwap", function () {
    it("Should execute a swap", async function () {
      const {
        swap,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      let proposal = await swap.swapProposals(proposalId);
      const senderBalanceBefore = await realTokenizado1.balanceOf(enabledSender.address);
      const recipientBalanceBefore = await realTokenizado2.balanceOf(enabledRecipient.address);
      const cbdcParticipant1BalanceBefore = await realDigital.balanceOf(realTokenizado1.reserve());
      const cbdcParticipant2BalanceBefore = await realDigital.balanceOf(realTokenizado2.reserve());

      await swap.connect(enabledRecipient).executeSwap(proposalId);

      expect(await realTokenizado1.balanceOf(enabledSender.address)).to.equal(senderBalanceBefore.sub(proposal.amount));
      expect(await realTokenizado2.balanceOf(enabledRecipient.address)).to.equal(recipientBalanceBefore.add(proposal.amount));
      expect(await realDigital.balanceOf(realTokenizado1.reserve())).to.equal(cbdcParticipant1BalanceBefore.sub(proposal.amount));
      expect(await realDigital.balanceOf(realTokenizado2.reserve())).to.equal(cbdcParticipant2BalanceBefore.add(proposal.amount));

      proposal = await swap.swapProposals(proposalId);
      expect(proposal.status).to.equal(1);
    });

    it("Should revert if proposal does not exist", async function () {
      const {
        swap,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swap
          .connect(enabledRecipient)
          .executeSwap(0)
      ).to.be.revertedWith("SwapTwoSteps: Proposal does not exist");
    });

    it("Should revert if caller is not the receiver", async function () {
      const {
        swap,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      await expect(
        swap.connect(enabledSender).executeSwap(proposalId)
      ).to.be.revertedWith(
        "SwapTwoSteps: Only the receiver can accept the swap"
      );
    });

    it("Should revert if proposal is not in status 0", async function () {
      const {
        swap,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      await swap.connect(enabledRecipient).cancelSwap(proposalId, "test");

      await expect(
        swap.connect(enabledRecipient).executeSwap(proposalId)
      ).to.be.revertedWith(
        "SwapTwoSteps: Proposal already closed"
      );
    });

    it("Should revert if proposal expired", async function () {
      const {
        swap,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      const proposal = await swap.swapProposals(proposalId);
      await setNextBlockTimestamp(proposal.timestamp.toNumber() + EXPIRATION_TIME + 1);

      await expect(
        swap.connect(enabledRecipient).executeSwap(proposalId)
      ).to.be.revertedWith(
        "SwapTwoSteps: Proposal expired"
      );
    });
  });

  describe("cancelSwap", function () {
    it("Sender can cancel a swap", async function () {
      const {
        swap,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      const senderBalanceBefore = await realTokenizado1.balanceOf(enabledSender.address);
      const cbdcParticipant1BalanceBefore = await realDigital.balanceOf(realTokenizado1.reserve());
      const receiverBalanceBefore = await realTokenizado2.balanceOf(enabledRecipient.address);
      const cbdcParticipant2BalanceBefore = await realDigital.balanceOf(realTokenizado2.reserve());

      await swap.connect(enabledSender).cancelSwap(proposalId, "test");

      expect(await realTokenizado1.balanceOf(enabledSender.address)).to.equal(senderBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado1.reserve())).to.equal(cbdcParticipant1BalanceBefore);
      expect(await realTokenizado2.balanceOf(enabledRecipient.address)).to.equal(receiverBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado2.reserve())).to.equal(cbdcParticipant2BalanceBefore);

      const proposalAfter = await swap.swapProposals(proposalId);
      expect(proposalAfter.status).to.equal(2);
    });

    it("Receiver can cancel a swap", async function () {
      const {
        swap,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      const senderBalanceBefore = await realTokenizado1.balanceOf(enabledSender.address);
      const cbdcParticipant1BalanceBefore = await realDigital.balanceOf(realTokenizado1.reserve());
      const receiverBalanceBefore = await realTokenizado2.balanceOf(enabledRecipient.address);
      const cbdcParticipant2BalanceBefore = await realDigital.balanceOf(realTokenizado2.reserve());

      await swap.connect(enabledRecipient).cancelSwap(proposalId, "test");

      expect(await realTokenizado1.balanceOf(enabledSender.address)).to.equal(senderBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado1.reserve())).to.equal(cbdcParticipant1BalanceBefore);
      expect(await realTokenizado2.balanceOf(enabledRecipient.address)).to.equal(receiverBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado2.reserve())).to.equal(cbdcParticipant2BalanceBefore);

      const proposalAfter = await swap.swapProposals(proposalId);
      expect(proposalAfter.status).to.equal(2);
    });

    it("Unauthorized can't cancel a swap", async function () {
      const {
        swap,
        unauthorized,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      await expect(
        swap.connect(unauthorized).cancelSwap(proposalId, "test")
      ).to.be.revertedWith("SwapTwoSteps: Only the sender or receiver can cancel the swap");
    });

    it("Anyone can cancel a swap if expired", async function () {
      const {
        swap,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
        unauthorized,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      const proposal = await swap.swapProposals(proposalId);
      await setNextBlockTimestamp(proposal.timestamp.toNumber() + EXPIRATION_TIME + 1);

      const senderBalanceBefore = await realTokenizado1.balanceOf(enabledSender.address);
      const cbdcParticipant1BalanceBefore = await realDigital.balanceOf(realTokenizado1.reserve());
      const receiverBalanceBefore = await realTokenizado2.balanceOf(enabledRecipient.address);
      const cbdcParticipant2BalanceBefore = await realDigital.balanceOf(realTokenizado2.reserve());

      await swap.connect(unauthorized).cancelSwap(proposalId, "test");

      expect(await realTokenizado1.balanceOf(enabledSender.address)).to.equal(senderBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado1.reserve())).to.equal(cbdcParticipant1BalanceBefore);
      expect(await realTokenizado2.balanceOf(enabledRecipient.address)).to.equal(receiverBalanceBefore);
      expect(await realDigital.balanceOf(realTokenizado2.reserve())).to.equal(cbdcParticipant2BalanceBefore);

      const proposalAfter = await swap.swapProposals(proposalId);
      expect(proposalAfter.status).to.equal(2);
    });

    it("Can't cancel an executed swap", async function () {
      const {
        swap,
        enabledRecipient,
        proposalId
      } = await loadFixture(deployInitiateSwap);

      await swap.connect(enabledRecipient).executeSwap(proposalId);

      await expect(
        swap.connect(enabledRecipient).cancelSwap(proposalId, "test")
      ).to.be.revertedWith("SwapTwoSteps: Proposal already closed");
    });

    it("Should revert if proposal does not exist", async function () {
      const {
        swap,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swap
          .connect(enabledRecipient)
          .cancelSwap(0, "test")
      ).to.be.revertedWith("SwapTwoSteps: Proposal does not exist");
    });
  });
});

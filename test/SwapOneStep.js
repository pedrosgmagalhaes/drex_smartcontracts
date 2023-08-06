const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  deployWithRealTokenizado,
  INITIAL_BALANCE,
} = require("./fixtures/SwapOneStep");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SwapOneStep", function () {
  describe("executeSwap", function () {
    it("Should swap tokens", async function () {
      const {
        swapOneStep,
        realDigital,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);
      const expectedSenderBalancePost = INITIAL_BALANCE.sub(amount);

      await realTokenizado1.connect(enabledSender).increaseAllowance(swapOneStep.address, amount);

      expect(realTokenizado1.address).to.not.be.equal(realTokenizado2.address);
      expect(await realTokenizado1.reserve()).to.not.be.equal(await realTokenizado2.reserve());
      expect(await realDigital.balanceOf(realTokenizado1.reserve())).to.equal(INITIAL_BALANCE);
      expect(await realDigital.balanceOf(realTokenizado2.reserve())).to.equal(0);

      await swapOneStep
        .connect(enabledSender)
        .executeSwap(
          realTokenizado1.address,
          realTokenizado2.address,
          enabledRecipient.address,
          amount
        );

      const senderBalancePost = await realTokenizado1.balanceOf(
        enabledSender.address
      );
      const recipientBalancePost = await realTokenizado2.balanceOf(
        enabledRecipient.address
      );

      expect(senderBalancePost).to.equal(expectedSenderBalancePost);
      expect(recipientBalancePost).to.equal(amount);

      const senderParticipantRealBalancePost = await realDigital.balanceOf(
        realTokenizado1.reserve()
      );
      const recipientParticipantRealBalancePost = await realDigital.balanceOf(
        realTokenizado2.reserve()
      );

      expect(senderParticipantRealBalancePost).to.equal(expectedSenderBalancePost);
      expect(recipientParticipantRealBalancePost).to.equal(amount);
    });

    it("Should revert if sender is not enabled", async function () {
      const {
        swapOneStep,
        realTokenizado1,
        realTokenizado2,
        unauthorized,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swapOneStep
          .connect(unauthorizedAccount)
          .executeSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            unauthorized.address,
            amount
          )
      ).to.be.revertedWith("SwapOneStep: Sender is not authorized");
    });

    it("Should revert if recipient is not enabled", async function () {
      const {
        swapOneStep,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        unauthorized,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.sub(20000);

      await expect(
        swapOneStep
          .connect(enabledSender)
          .executeSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            unauthorized.address,
            amount
          )
      ).to.be.revertedWith("SwapOneStep: Receiver is not authorized");
    });

    it("Should revert on insufficient balance", async function () {
      const {
        swapOneStep,
        realTokenizado1,
        realTokenizado2,
        enabledSender,
        enabledRecipient,
      } = await loadFixture(deployWithRealTokenizado);
      const amount = INITIAL_BALANCE.add(20000);

      await expect(
        swapOneStep
          .connect(enabledSender)
          .executeSwap(
            realTokenizado1.address,
            realTokenizado2.address,
            enabledRecipient.address,
            amount
          )
      ).to.be.revertedWith("SwapOneStep: Sender does not have enough balance");
    });
  });
});

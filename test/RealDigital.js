// test/RealDigital.js
const { expect } = require("chai");

describe("RealDigital", function () {
  let RealDigital, realDigital, admin, minterAndBurner, addrs;

  beforeEach(async function () {
    addrs = await ethers.getSigners();
    RealDigital = await ethers.getContractFactory("RealDigital");

    admin = addrs[0];
    minterAndBurner = addrs[1];

    realDigital = await RealDigital.deploy(
      "RealDigital",
      "RD",
      admin.address
    );

    await realDigital.deployed();

    await realDigital.grantRole(realDigital.MINTER_ROLE(), minterAndBurner.address);
    await realDigital.grantRole(realDigital.BURNER_ROLE(), minterAndBurner.address);
  });


  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const role = await realDigital.DEFAULT_ADMIN_ROLE();
      const hasRole = await realDigital.hasRole(role, admin.address);
      expect(hasRole).to.equal(true);
    });

    it("Should set the right burner and minter", async function () {
      expect(await realDigital.hasRole(ethers.utils.id("BURNER_ROLE"), minterAndBurner.address)).to.equal(true);
      expect(await realDigital.hasRole(ethers.utils.id("MINTER_ROLE"), minterAndBurner.address)).to.equal(true);
    });
  });

  describe("Minting", function () {
    it("Should mint new tokens", async function () {
      const amount = ethers.utils.parseEther("100");

      await realDigital.connect(minterAndBurner).mint(minterAndBurner.address, amount);

      const balance = await realDigital.balanceOf(minterAndBurner.address);
      expect(balance).to.equal(amount);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("50");

      await realDigital.connect(minterAndBurner).mint(minterAndBurner.address, ethers.utils.parseEther("100"));

      await realDigital.connect(minterAndBurner).burn(burnAmount);

      const balanceAfterBurn = await realDigital.balanceOf(minterAndBurner.address);
      expect(balanceAfterBurn).to.equal(ethers.utils.parseEther("50"));
    });
  });

  // Account Management
  describe("Account Management", function () {
    it("Should disable an account", async function () {
      // Enable account first
      await realDigital.connect(admin).enableAccount(addrs[2].address);
      expect(await realDigital.authorizedAccount(addrs[2].address)).to.equal(true);

      // Disable account
      await realDigital.connect(admin).disableAccount(addrs[2].address);
      expect(await realDigital.authorizedAccount(addrs[2].address)).to.equal(false);
    });

    it("Should enable an account", async function () {
      // Ensure account is disabled first
      await realDigital.connect(admin).disableAccount(addrs[2].address);
      expect(await realDigital.authorizedAccount(addrs[2].address)).to.equal(false);

      // Enable account
      await realDigital.connect(admin).enableAccount(addrs[2].address);
      expect(await realDigital.authorizedAccount(addrs[2].address)).to.equal(true);
    });
  });

  // Frozen Balances
  describe("Frozen Balances", function () {
    it("Should increase the frozen balance", async function () {
      await realDigital.connect(admin).increaseFrozenBalance(addrs[2].address, ethers.utils.parseEther("50"));
      expect(await realDigital.frozenBalanceOf(addrs[2].address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should decrease the frozen balance", async function () {
      // Increase balance first
      await realDigital.connect(admin).increaseFrozenBalance(addrs[2].address, ethers.utils.parseEther("50"));
      // Decrease balance
      await realDigital.connect(admin).decreaseFrozenBalance(addrs[2].address, ethers.utils.parseEther("25"));
      expect(await realDigital.frozenBalanceOf(addrs[2].address)).to.equal(ethers.utils.parseEther("25"));
    });
  });

  // Transfers
  describe("Transfers", function () {
    it("Should reject transfer from a disabled account", async function () {
      // Ensure account is disabled
      await realDigital.connect(admin).disableAccount(addrs[2].address);

      // Attempt to transfer
      await expect(
        realDigital.connect(addrs[2]).transfer(addrs[3].address, ethers.utils.parseEther("10"))
      ).to.be.revertedWith("Sender account is disabled");
    });

    it("Should reject transfer if amount exceeds available balance after accounting for frozen balance", async function () {
      // Ensure account is enabled and has enough tokens
      await realDigital.connect(admin).enableAccount(addrs[2].address);
      await realDigital.connect(minterAndBurner).mint(addrs[2].address, ethers.utils.parseEther("100"));
      await realDigital.connect(admin).increaseFrozenBalance(addrs[2].address, ethers.utils.parseEther("75"));

      // Attempt to transfer
      await expect(
        realDigital.connect(addrs[2]).transfer(addrs[3].address, ethers.utils.parseEther("50"))
      ).to.be.revertedWith("Transfer amount exceeds available balance");
    });

    it("Should transfer tokens correctly", async function () {
      // Ensure account is enabled and has enough tokens
      await realDigital.connect(admin).enableAccount(addrs[2].address);
      await realDigital.connect(minterAndBurner).mint(addrs[2].address, ethers.utils.parseEther("100"));
      await realDigital.connect(admin).increaseFrozenBalance(addrs[2].address, ethers.utils.parseEther("25"));

      // Transfer tokens
      await realDigital.connect(addrs[2]).transfer(addrs[3].address, ethers.utils.parseEther("50"));
      expect(await realDigital.balanceOf(addrs[3].address)).to.equal(ethers.utils.parseEther("50"));
    });
  });

});

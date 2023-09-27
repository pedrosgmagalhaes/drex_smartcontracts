const hre = require("hardhat");
const { ACCOUNTS, REAL_NAME, REAL_SYMBOL } = require("../util/constants");
const { getAddressDiscoveryContractName, getDeployedContract } = require("../util/contracts");

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[ACCOUNTS.ADMIN];
  const authority = signers[ACCOUNTS.AUTHORITY];
  const participant12345678 = signers[ACCOUNTS.PARTICIPANT_12345678_DEFAULT];
  const participant87654321 = signers[ACCOUNTS.PARTICIPANT_87654321_DEFAULT];

  console.log(`Deployer: ${admin.address}`);
  console.log(`Admin: ${admin.address}`);
  console.log(`Authority: ${authority.address}`);
  console.log();

  const contracts = [];

  console.log(`Deploying AddressDiscovery...`);
  const AddressDiscovery = await ethers.getContractFactory("AddressDiscovery");
  const addressDiscovery = await AddressDiscovery.deploy(
    authority.address,
    admin.address
  );
  await addressDiscovery.deployed();
  contracts.push({name: "AddressDiscovery", address: addressDiscovery.address});
  console.log(`AddressDiscovery deployed to: ${addressDiscovery.address}`);
  console.log();

  console.log(`Deploying RealDigital...`);
  const RealDigital = await ethers.getContractFactory("RealDigital");
  const real = await RealDigital.deploy(
    REAL_NAME,
    REAL_SYMBOL,
    authority.address,
    admin.address
  );
  await real.deployed();
  contracts.push({name: "RealDigital", address: real.address});
  console.log(`RealDigital deployed to: ${real.address}`);
  console.log();

  console.log(`Adding RealDigital to AddressDiscovery...`);
  const registerRealTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("RealDigital"), real.address);
  await registerRealTx.wait();
  console.log(`RealDigital added to AddressDiscovery`);
  console.log();

  console.log(`Deploy SwapOneStep...`);
  const SwapOneStep = await ethers.getContractFactory("SwapOneStep");
  const swapOneStep = await SwapOneStep.deploy(
    real.address
  );
  await swapOneStep.deployed();
  contracts.push({name: "SwapOneStep", address: swapOneStep.address});
  console.log(`SwapOneStep deployed to: ${swapOneStep.address}`);
  console.log();

  console.log(`Adding SwapOneStep to AddressDiscovery...`);
  const registerSwapOneStepTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("SwapOneStep"), swapOneStep.address);
  await registerSwapOneStepTx.wait();
  console.log(`SwapOneStep added to AddressDiscovery`);
  console.log();

  console.log(`Deploy SwapTwoSteps...`);
  const SwapTwoSteps = await ethers.getContractFactory("SwapTwoSteps");
  const swapTwoSteps = await SwapTwoSteps.deploy(
    real.address
  );
  await swapTwoSteps.deployed();
  contracts.push({name: "SwapTwoSteps", address: swapTwoSteps.address});
  console.log(`SwapTwoSteps deployed to: ${swapTwoSteps.address}`);
  console.log();

  console.log(`Adding SwapTwoSteps to AddressDiscovery...`);
  const registerSwapTwoStepsTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("SwapTwoSteps"), swapTwoSteps.address);
  await registerSwapTwoStepsTx.wait();
  console.log(`SwapTwoSteps added to AddressDiscovery`);
  console.log();

  console.log(`Granting FREEZER_ROLE on RealDigital to SwapTwoSteps...`);
  const grantFreezerRoleTx = await real
    .connect(admin)
    .grantRole(await real.FREEZER_ROLE(), swapTwoSteps.address);
  await grantFreezerRoleTx.wait();
  console.log(`FREEZER_ROLE granted to SwapTwoSteps`);
  console.log();

  console.log(`Deploying RealDigitalDefaultAccount...`);
  const RealDigitalDefaultAccount = await ethers.getContractFactory(
    "RealDigitalDefaultAccount"
  );
  const rdda = await RealDigitalDefaultAccount.deploy(
    addressDiscovery.address,
    authority.address,
    admin.address
  );
  await rdda.deployed();
  contracts.push({name: "RealDigitalDefaultAccount", address: rdda.address});
  console.log(`RealDigitalDefaultAccount deployed to: ${rdda.address}`);
  console.log();

  console.log(`Adding RealDigitalDefaultAccount to AddressDiscovery...`);
  const registerRddaTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("RealDigitalDefaultAccount"), rdda.address);
  await registerRddaTx.wait();
  console.log(`RealDigitalDefaultAccount added to AddressDiscovery`);
  console.log();

  console.log(`Deploying RealDigitalEnableAccount...`);
  const RealDigitalEnableAccount = await ethers.getContractFactory(
    "RealDigitalEnableAccount"
  );
  const rdea = await RealDigitalEnableAccount.deploy(real.address);
  await rdea.deployed();
  contracts.push({name: "RealDigitalEnableAccount", address: rdea.address});
  console.log(`RealDigitalEnableAccount deployed to: ${rdea.address}`);
  console.log();

  console.log(`Adding RealDigitalEnableAccount to AddressDiscovery...`);
  const registerRdeaTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("RealDigitalEnableAccount"), rdea.address);
  await registerRdeaTx.wait();
  console.log(`RealDigitalEnableAccount added to AddressDiscovery`);
  console.log();

  console.log(
    `Granting admin role on RealDigital contract to RealDigitalEnableAccount...`
  );
  const grantAdminRoleTx = await real
    .connect(admin)
    .grantRole(await real.DEFAULT_ADMIN_ROLE(), rdea.address);
  await grantAdminRoleTx.wait();
  console.log(`Admin role granted to RealDigitalEnableAccount`);
  console.log();


  const participants = [
    { cjnp8: 12345678, address: participant12345678.address },
    { cjnp8: 87654321, address: participant87654321.address },
  ];

  console.log(`Deploy RealTokenizado for each participant...`);
  const realTokenizados = participants.map((participant) => {
    return {
      name: "RealTokenizado@" + participant.cjnp8,
      symbol: "DREX@" + participant.cjnp8,
      authority: participant.address,
      cnpj8: participant.cjnp8,
      deployedAddress: null,
    };
  });
  const RealTokenizado = await ethers.getContractFactory("RealTokenizado");
  for (let i = 0; i < realTokenizados.length; i++) {
    const realTokenizado = realTokenizados[i];
    const realTokenizadoInstance = await RealTokenizado.deploy(
      addressDiscovery.address,
      realTokenizado.name,
      realTokenizado.symbol,
      realTokenizado.authority,
      admin.address,
      "" + realTokenizado.cjnp8,
      realTokenizado.cnpj8,
      realTokenizado.authority
    );
    await realTokenizadoInstance.deployed();
    contracts.push({name: realTokenizado.name, address: realTokenizadoInstance.address});
    realTokenizado.deployedAddress = realTokenizadoInstance.address;
  }
  console.log(`RealTokenizado deployed to:`);
  console.table(realTokenizados);
  console.log();

  console.log(`Adding RealTokenizados to AddressDiscovery...`);
  for (const rt of realTokenizados) {
    const registerRtTx = await addressDiscovery
      .connect(authority)
      .updateAddress(
        getAddressDiscoveryContractName(rt.name),
        rt.deployedAddress
      );
    await registerRtTx.wait();
  }
  console.log(`RealTokenizados added to AddressDiscovery`);
  console.log();

  console.log(
    `Register default participant accounts in RealDigitalDefaultAccount...`
  );
  for (const participant of participants) {
    const registerParticipantTx = await rdda
      .connect(authority)
      .addDefaultAccount(participant.cjnp8, participant.address);
    await registerParticipantTx.wait();
  }
  console.log(`Registered participants:`);
  console.table(participants);
  console.log();

  console.log(`Enabling participant default accounts...`);
  for (const participant of participants) {
    const enableParticipantTx = await real.connect(authority).enableAccount(participant.address);
    await enableParticipantTx.wait();
    const realTokenizado = getDeployedContract("RealTokenizado@" + participant.cjnp8);
    const tokenizadoEnableParticipantTx = await realTokenizado.connect(participant).enableAccount(participant.address);
    await tokenizadoEnableParticipantTx.wait();
  }
  console.log(`Participant accounts enabled in both RealDigital and RealTokenizado`);

  console.log(`Deploying STR...`);
  const STR = await ethers.getContractFactory("STR");
  const strInstance = await STR.deploy(real.address);
  await strInstance.deployed();
  contracts.push({name: "STR", address: strInstance.address});
  console.log(`STR deployed to: ${strInstance.address}`);
  console.log();

  console.log(`Adding STR to AddressDiscovery...`);
  const registerStrTx = await addressDiscovery
    .connect(authority)
    .updateAddress(getAddressDiscoveryContractName("STR"), strInstance.address);
  await registerStrTx.wait();
  console.log(`STR added to AddressDiscovery`);
  console.log();

  console.log(`Granting MINER_ROLE and BURNER_ROLE on RealDigital to STR...`);
  const grantMinterTx = await real
    .connect(admin)
    .grantRole(await real.MINTER_ROLE(), strInstance.address);
  await grantMinterTx.wait();
  const grantBurnerTx = await real
    .connect(admin)
    .grantRole(await real.BURNER_ROLE(), strInstance.address);
  await grantBurnerTx.wait();
  console.log(`MINER_ROLE and BURNER_ROLE granted to STR`);
  console.log();

  console.log();
  console.log(`SUMMARY:`)
  console.log(`DeployedContracts:`);
  console.table(contracts);
  console.log(`Participants:`);
  console.table(participants);
  console.log(`Admin: ${admin.address}`);
  console.log(`Authority: ${authority.address}`);
  console.log(`Contract deployer: ${admin.address}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

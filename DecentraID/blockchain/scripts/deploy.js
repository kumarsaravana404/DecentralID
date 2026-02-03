const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy IdentityRegistry
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log(`IdentityRegistry deployed to: ${await identityRegistry.getAddress()}`);

  // 2. Deploy VerificationRegistry
  const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
  const verificationRegistry = await VerificationRegistry.deploy(await identityRegistry.getAddress());
  await verificationRegistry.waitForDeployment();
  console.log(`VerificationRegistry deployed to: ${await verificationRegistry.getAddress()}`);

  // 3. Deploy CredentialRegistry
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy();
  await credentialRegistry.waitForDeployment();
  console.log(`CredentialRegistry deployed to: ${await credentialRegistry.getAddress()}`);

  // Save addresses for frontend/backend usage
  const fs = require("fs");
  const config = {
    IdentityRegistry: await identityRegistry.getAddress(),
    VerificationRegistry: await verificationRegistry.getAddress(),
    CredentialRegistry: await credentialRegistry.getAddress()
  };
  fs.writeFileSync("../web/config.json", JSON.stringify(config, null, 2));
  fs.writeFileSync("../backend/config.json", JSON.stringify(config, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

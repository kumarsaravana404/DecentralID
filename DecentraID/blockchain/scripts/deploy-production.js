const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Starting DecentraID Contract Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("📍 Network:", network);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy IdentityRegistry
  console.log("📝 Deploying IdentityRegistry...");
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("✅ IdentityRegistry deployed to:", identityAddress);

  // Deploy VerificationRegistry
  console.log("\n📝 Deploying VerificationRegistry...");
  const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
  const verificationRegistry = await VerificationRegistry.deploy();
  await verificationRegistry.waitForDeployment();
  const verificationAddress = await verificationRegistry.getAddress();
  console.log("✅ VerificationRegistry deployed to:", verificationAddress);

  // Deploy CredentialRegistry
  console.log("\n📝 Deploying CredentialRegistry...");
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy();
  await credentialRegistry.waitForDeployment();
  const credentialAddress = await credentialRegistry.getAddress();
  console.log("✅ CredentialRegistry deployed to:", credentialAddress);

  // Save configuration
  const configPath = path.join(__dirname, "..", "..", "backend", "config.json");
  let config = {};
  
  // Load existing config if it exists
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.log("⚠️  Could not read existing config, creating new one");
    }
  }

  // Update config for this network
  config[network] = {
    IdentityRegistry: identityAddress,
    VerificationRegistry: verificationAddress,
    CredentialRegistry: credentialAddress
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("\n💾 Configuration saved to:", configPath);

  // Wait for block confirmations before verification
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await identityRegistry.deploymentTransaction().wait(5);
    await verificationRegistry.deploymentTransaction().wait(5);
    await credentialRegistry.deploymentTransaction().wait(5);

    // Verify contracts on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contracts on Etherscan...");
      
      try {
        await hre.run("verify:verify", {
          address: identityAddress,
          constructorArguments: [],
        });
        console.log("✅ IdentityRegistry verified");
      } catch (e) {
        console.log("⚠️  IdentityRegistry verification failed:", e.message);
      }

      try {
        await hre.run("verify:verify", {
          address: verificationAddress,
          constructorArguments: [],
        });
        console.log("✅ VerificationRegistry verified");
      } catch (e) {
        console.log("⚠️  VerificationRegistry verification failed:", e.message);
      }

      try {
        await hre.run("verify:verify", {
          address: credentialAddress,
          constructorArguments: [],
        });
        console.log("✅ CredentialRegistry verified");
      } catch (e) {
        console.log("⚠️  CredentialRegistry verification failed:", e.message);
      }
    }
  }

  console.log("\n✨ Deployment Complete!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:              ", network);
  console.log("IdentityRegistry:     ", identityAddress);
  console.log("VerificationRegistry: ", verificationAddress);
  console.log("CredentialRegistry:   ", credentialAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (network === "sepolia") {
    console.log("🔗 View on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${identityAddress}`);
    console.log(`   https://sepolia.etherscan.io/address/${verificationAddress}`);
    console.log(`   https://sepolia.etherscan.io/address/${credentialAddress}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

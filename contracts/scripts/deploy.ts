import { ethers } from "ethers";
import hre from "hardhat";

// Create ethers providers and signers manually since we're using viem toolbox
async function getEthersSetup() {
  const network = hre.network;
  const accounts = hre.network.config.accounts as string[];
  
  let provider: ethers.JsonRpcProvider;
  
  if (network.name === "hardhat" || network.name === "localhost") {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  } else if (network.name === "fuji") {
    provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  } else {
    throw new Error(`Unsupported network: ${network.name}`);
  }
  
  // Get deployer wallet
  let deployer: ethers.Wallet;
  if (Array.isArray(accounts) && accounts.length > 0) {
    deployer = new ethers.Wallet(accounts[0], provider);
  } else {
    throw new Error("No accounts configured");
  }
  
  return { provider, deployer };
}

async function main() {
  console.log("🚀 Starting ConnectX Deployment on Avalanche Fuji...\n");

  const { provider, deployer } = await getEthersSetup();
  
  console.log("Deployer account:", deployer.address);
  
  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "AVAX\n");

  if (parseFloat(ethers.formatEther(balance)) < 1.0) {
    console.warn("⚠️  WARNING: Low balance! Consider having at least 1 AVAX for deployment\n");
  }

  // Get network info
  const network = await provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Get current gas price
  const feeData = await provider.getFeeData();
  console.log("Current gas price:", ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "gwei\n");

  let deployedContracts: any = {};

  try {
    console.log("📋 DEPLOYMENT PLAN:");
    console.log("===================");
    console.log("1. Deploy DeveloperReputation");
    console.log("2. Deploy DeveloperBadge");
    console.log("3. Deploy SimpleBountyVerifier");
    console.log("4. Deploy BountyMarketplace");
    console.log("5. Configure contract integrations");
    console.log("6. Set up roles and permissions");
    console.log("7. Initialize default configurations\n");

    // 1. Deploy DeveloperReputation
    console.log("📊 Deploying DeveloperReputation...");
    const DeveloperReputation = await hre.ethers.getContractFactory("DeveloperReputation");
    const developerReputation = await DeveloperReputation.deploy();
    await developerReputation.waitForDeployment();
    
    const reputationAddress = await developerReputation.getAddress();
    deployedContracts.developerReputation = reputationAddress;
    console.log("✅ DeveloperReputation deployed at:", reputationAddress);
    
    // Wait for a few confirmations
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Deploy DeveloperBadge
    console.log("\n🏅 Deploying DeveloperBadge...");
    const DeveloperBadge = await hre.ethers.getContractFactory("DeveloperBadge");
    const developerBadge = await DeveloperBadge.deploy();
    await developerBadge.waitForDeployment();
    
    const badgeAddress = await developerBadge.getAddress();
    deployedContracts.developerBadge = badgeAddress;
    console.log("✅ DeveloperBadge deployed at:", badgeAddress);
    
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Deploy SimpleBountyVerifier
    console.log("\n✅ Deploying SimpleBountyVerifier...");
    const SimpleBountyVerifier = await hre.ethers.getContractFactory("SimpleBountyVerifier");
    const simpleBountyVerifier = await SimpleBountyVerifier.deploy();
    await simpleBountyVerifier.waitForDeployment();
    
    const verifierAddress = await simpleBountyVerifier.getAddress();
    deployedContracts.simpleBountyVerifier = verifierAddress;
    console.log("✅ SimpleBountyVerifier deployed at:", verifierAddress);
    
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Deploy BountyMarketplace
    console.log("\n🏪 Deploying BountyMarketplace...");
    const feeRecipient = deployer.address; // Can be changed later
    const BountyMarketplace = await hre.ethers.getContractFactory("BountyMarketplace");
    const bountyMarketplace = await BountyMarketplace.deploy(feeRecipient);
    await bountyMarketplace.waitForDeployment();
    
    const marketplaceAddress = await bountyMarketplace.getAddress();
    deployedContracts.bountyMarketplace = marketplaceAddress;
    console.log("✅ BountyMarketplace deployed at:", marketplaceAddress);
    console.log("   Fee recipient set to:", feeRecipient);

    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("\n🔧 CONFIGURING CONTRACTS...");
    console.log("============================");

    // 5. Set contract addresses in BountyMarketplace
    console.log("🔗 Setting contract addresses in BountyMarketplace...");
    const setAddressesTx = await bountyMarketplace.setContractAddresses(
      badgeAddress,
      reputationAddress,
      verifierAddress
    );
    await setAddressesTx.wait();
    console.log("✅ Contract addresses configured");

    // 6. Grant roles
    console.log("\n👥 Setting up roles and permissions...");
    
    // Grant MINTER_ROLE to BountyMarketplace in DeveloperBadge
    console.log("🏅 Granting MINTER_ROLE to marketplace...");
    const grantMinterTx = await developerBadge.setMinterRole(marketplaceAddress);
    await grantMinterTx.wait();
    console.log("✅ MINTER_ROLE granted to marketplace");

    // Grant MARKETPLACE_ROLE to BountyMarketplace in DeveloperReputation
    console.log("📊 Granting MARKETPLACE_ROLE to marketplace...");
    const grantMarketplaceTx = await developerReputation.setMarketplaceRole(marketplaceAddress);
    await grantMarketplaceTx.wait();
    console.log("✅ MARKETPLACE_ROLE granted to marketplace");

    // Grant VERIFIER_ROLE to deployer (can add more verifiers later)
    console.log("✅ Granting VERIFIER_ROLE to deployer...");
    const VERIFIER_ROLE = await bountyMarketplace.VERIFIER_ROLE();
    const grantVerifierTx = await bountyMarketplace.grantRole(VERIFIER_ROLE, deployer.address);
    await grantVerifierTx.wait();
    console.log("✅ VERIFIER_ROLE granted to deployer");

    // Grant MAINTAINER_ROLE to deployer (can add more maintainers later)
    console.log("🛠️  Granting MAINTAINER_ROLE to deployer...");
    const MAINTAINER_ROLE = await bountyMarketplace.MAINTAINER_ROLE();
    const grantMaintainerTx = await bountyMarketplace.grantRole(MAINTAINER_ROLE, deployer.address);
    await grantMaintainerTx.wait();
    console.log("✅ MAINTAINER_ROLE granted to deployer");

    // 7. Initialize default configurations
    console.log("\n⚙️  Initializing default configurations...");
    
    // Initialize reputation tiers (this calls initializeDefaultTiers)
    console.log("📊 Initializing reputation tiers...");
    const initTiersTx = await developerReputation.initializeDefaultTiers();
    await initTiersTx.wait();
    console.log("✅ Default reputation tiers initialized");

    // Initialize streak rewards
    console.log("🔥 Initializing streak rewards...");
    const initStreaksTx = await developerReputation.initializeStreakRewards();
    await initStreaksTx.wait();
    console.log("✅ Default streak rewards initialized");

    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    
    // Display all deployed addresses
    console.log("\n📋 DEPLOYED CONTRACT ADDRESSES:");
    console.log("===============================");
    console.log("DeveloperReputation :", deployedContracts.developerReputation);
    console.log("DeveloperBadge      :", deployedContracts.developerBadge);
    console.log("SimpleBountyVerifier:", deployedContracts.simpleBountyVerifier);
    console.log("BountyMarketplace   :", deployedContracts.bountyMarketplace);

    // Save deployment info to file
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      gasUsed: "Estimated ~13.5M gas total",
      feeRecipient: feeRecipient
    };

    // Write to deployments folder
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🔧 NEXT STEPS:");
    console.log("==============");
    console.log("1. Verify contracts on Snowtrace (if on mainnet)");
    console.log("2. Update your frontend with the new contract addresses");
    console.log("3. Test basic functionality:");
    console.log("   - Create a test bounty");
    console.log("   - Claim and submit work");
    console.log("   - Verify and pay bounty");
    console.log("4. Add additional verifiers/maintainers as needed");
    console.log("5. Configure platform fee if different from 2.5%");

    console.log("\n⚡ QUICK TEST COMMANDS:");
    console.log("======================");
    console.log("// Check total bounties");
    console.log(`// await bountyMarketplace.getTotalBounties()`);
    console.log("// Check reputation tiers");
    console.log(`// await developerReputation.getReputationTier(0)`);
    console.log("// Check badge counts");
    console.log(`// await developerBadge.totalSupply()`);

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error("=====================");
    console.error("Error:", error);
    
    // If we have partial deployment, show what was deployed
    if (Object.keys(deployedContracts).length > 0) {
      console.log("\n⚠️  PARTIALLY DEPLOYED CONTRACTS:");
      console.log("=================================");
      Object.entries(deployedContracts).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
      });
      console.log("\nYou may need to complete the setup manually.");
    }
    
    process.exitCode = 1;
  }
}

// Enhanced error handling
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});

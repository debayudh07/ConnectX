import { ethers } from "ethers";
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting ConnectX Deployment...\n");

  // Network configuration
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  // Set up provider and deployer based on network
  let provider: ethers.JsonRpcProvider;
  let deployer: ethers.Wallet;

  if (networkName === "fuji") {
    provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    // You'll need to set your private key in environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Please set PRIVATE_KEY environment variable");
    }
    deployer = new ethers.Wallet(privateKey, provider);
  } else if (networkName === "localhost" || networkName === "hardhat") {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    // For local development, create a test wallet
    deployer = ethers.Wallet.createRandom().connect(provider);
  } else {
    throw new Error(`Unsupported network: ${networkName}`);
  }

  console.log("Deployer account:", deployer.address);
  
  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "AVAX\n");

  if (parseFloat(ethers.formatEther(balance)) < 1.0) {
    console.warn("⚠️  WARNING: Low balance! Consider having at least 1 AVAX for deployment\n");
  }

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

    // Get contract artifacts
    const reputationArtifact = await hre.artifacts.readArtifact("DeveloperReputation");
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");
    const verifierArtifact = await hre.artifacts.readArtifact("SimpleBountyVerifier");
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");

    // 1. Deploy DeveloperReputation
    console.log("📊 Deploying DeveloperReputation...");
    const ReputationFactory = new ethers.ContractFactory(
      reputationArtifact.abi,
      reputationArtifact.bytecode,
      deployer
    );
    const developerReputation = await ReputationFactory.deploy();
    await developerReputation.waitForDeployment();
    
    const reputationAddress = await developerReputation.getAddress();
    deployedContracts.developerReputation = reputationAddress;
    console.log("✅ DeveloperReputation deployed at:", reputationAddress);
    
    // Wait for confirmations
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Deploy DeveloperBadge
    console.log("\n🏅 Deploying DeveloperBadge...");
    const BadgeFactory = new ethers.ContractFactory(
      badgeArtifact.abi,
      badgeArtifact.bytecode,
      deployer
    );
    const developerBadge = await BadgeFactory.deploy();
    await developerBadge.waitForDeployment();
    
    const badgeAddress = await developerBadge.getAddress();
    deployedContracts.developerBadge = badgeAddress;
    console.log("✅ DeveloperBadge deployed at:", badgeAddress);
    
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Deploy SimpleBountyVerifier
    console.log("\n✅ Deploying SimpleBountyVerifier...");
    const VerifierFactory = new ethers.ContractFactory(
      verifierArtifact.abi,
      verifierArtifact.bytecode,
      deployer
    );
    const simpleBountyVerifier = await VerifierFactory.deploy();
    await simpleBountyVerifier.waitForDeployment();
    
    const verifierAddress = await simpleBountyVerifier.getAddress();
    deployedContracts.simpleBountyVerifier = verifierAddress;
    console.log("✅ SimpleBountyVerifier deployed at:", verifierAddress);
    
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Deploy BountyMarketplace
    console.log("\n🏪 Deploying BountyMarketplace...");
    const feeRecipient = deployer.address; // Can be changed later
    const MarketplaceFactory = new ethers.ContractFactory(
      marketplaceArtifact.abi,
      marketplaceArtifact.bytecode,
      deployer
    );
    const bountyMarketplace = await MarketplaceFactory.deploy(feeRecipient);
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
    
    // Initialize reputation tiers
    console.log("📊 Initializing reputation tiers...");
    try {
      const initTiersTx = await developerReputation.initializeDefaultTiers();
      await initTiersTx.wait();
      console.log("✅ Default reputation tiers initialized");
    } catch (error) {
      console.log("ℹ️  Reputation tiers already initialized or error:", error);
    }

    // Initialize streak rewards
    console.log("🔥 Initializing streak rewards...");
    try {
      const initStreaksTx = await developerReputation.initializeStreakRewards();
      await initStreaksTx.wait();
      console.log("✅ Default streak rewards initialized");
    } catch (error) {
      console.log("ℹ️  Streak rewards already initialized or error:", error);
    }

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
      network: networkName,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      feeRecipient: feeRecipient
    };

    // Write to deployments folder
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🔧 NEXT STEPS:");
    console.log("==============");
    console.log("1. Update your frontend with the new contract addresses");
    console.log("2. Test basic functionality:");
    console.log("   - Create a test bounty");
    console.log("   - Claim and submit work");
    console.log("   - Verify and pay bounty");
    console.log("3. Add additional verifiers/maintainers as needed");
    console.log("4. Configure platform fee if different from 2.5%");

    console.log("\n💡 ENVIRONMENT SETUP:");
    console.log("====================");
    console.log("Add to your .env file:");
    console.log(`DEVELOPER_REPUTATION_ADDRESS=${deployedContracts.developerReputation}`);
    console.log(`DEVELOPER_BADGE_ADDRESS=${deployedContracts.developerBadge}`);
    console.log(`SIMPLE_BOUNTY_VERIFIER_ADDRESS=${deployedContracts.simpleBountyVerifier}`);
    console.log(`BOUNTY_MARKETPLACE_ADDRESS=${deployedContracts.bountyMarketplace}`);

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
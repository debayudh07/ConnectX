import { ethers } from "ethers";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting ConnectX Deployment...\n");

  // For this deployment script, we'll use environment variables
  const privateKey = "";
  
  console.log("Environment check:");
  console.log("FUJI_PRIVATE_KEY exists:", !!process.env.FUJI_PRIVATE_KEY);
  console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
  console.log("Selected key exists:", !!privateKey);
  console.log();
  
  if (!privateKey) {
    console.log("⚠️  No FUJI_PRIVATE_KEY or PRIVATE_KEY found in environment variables.");
    console.log("📝 To deploy, set your private key:");
    console.log("   export FUJI_PRIVATE_KEY=your_private_key_here");
    console.log("   or");
    console.log("   export PRIVATE_KEY=your_private_key_here");
    console.log("\n🏗️  For now, showing deployment addresses that would be used...\n");
  }

  // Set up provider
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  let deployer: ethers.HDNodeWallet | ethers.Wallet;
  if (privateKey) {
    deployer = new ethers.Wallet(privateKey, provider);
    console.log("Deployer account:", deployer.address);
    
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "AVAX\n");

    if (parseFloat(ethers.formatEther(balance)) < 1.0) {
      console.warn("⚠️  WARNING: Low balance! Consider having at least 1 AVAX for deployment\n");
    }
  } else {
    // Create a dummy wallet for address calculation
    deployer = ethers.Wallet.createRandom();
    console.log("Simulated deployer address:", deployer.address);
    console.log("(This is just for demonstration - not a real deployment)\n");
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
    console.log("5. Save deployment addresses");
    console.log("6. Show setup commands\n");

    // Get contract artifacts
    const reputationArtifact = await hre.artifacts.readArtifact("DeveloperReputation");
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");
    const verifierArtifact = await hre.artifacts.readArtifact("SimpleBountyVerifier");
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");

    if (privateKey) {
      // Real deployment
      console.log("🚀 STARTING REAL DEPLOYMENT...\n");

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
      
      // Wait between deployments
      await new Promise(resolve => setTimeout(resolve, 3000));

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
      
      await new Promise(resolve => setTimeout(resolve, 3000));

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
      
      await new Promise(resolve => setTimeout(resolve, 3000));

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

      console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
      console.log("=====================================");
      
    } else {
      // Simulation mode
      console.log("📝 SIMULATION MODE - Predicting deployment addresses...\n");
      
      // Calculate predicted addresses
      const nonce = await provider.getTransactionCount(deployer.address);
      
      deployedContracts.developerReputation = ethers.getCreateAddress({
        from: deployer.address,
        nonce: nonce
      });
      
      deployedContracts.developerBadge = ethers.getCreateAddress({
        from: deployer.address,
        nonce: nonce + 1
      });
      
      deployedContracts.simpleBountyVerifier = ethers.getCreateAddress({
        from: deployer.address,
        nonce: nonce + 2
      });
      
      deployedContracts.bountyMarketplace = ethers.getCreateAddress({
        from: deployer.address,
        nonce: nonce + 3
      });
      
      console.log("📊 Predicted contract addresses:");
    }
    
    // Display all deployed/predicted addresses
    console.log("\n📋 CONTRACT ADDRESSES:");
    console.log("======================");
    console.log("DeveloperReputation :", deployedContracts.developerReputation);
    console.log("DeveloperBadge      :", deployedContracts.developerBadge);
    console.log("SimpleBountyVerifier:", deployedContracts.simpleBountyVerifier);
    console.log("BountyMarketplace   :", deployedContracts.bountyMarketplace);

    // Save deployment info to file
    const deploymentInfo = {
      network: "fuji",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      isSimulation: !privateKey
    };

    // Write to deployments folder
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `fuji-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    // Show setup commands
    console.log("\n🔧 POST-DEPLOYMENT SETUP COMMANDS:");
    console.log("===================================");
    console.log("Run these commands after deployment to configure the contracts:\n");
    
    console.log("1️⃣ Set contract addresses in BountyMarketplace:");
    console.log(`npx hardhat run --network fuji scripts/setup/01-set-addresses.ts`);
    
    console.log("\n2️⃣ Grant roles between contracts:");
    console.log(`npx hardhat run --network fuji scripts/setup/02-grant-roles.ts`);
    
    console.log("\n3️⃣ Initialize default configurations:");
    console.log(`npx hardhat run --network fuji scripts/setup/03-initialize.ts`);

    console.log("\n💡 ENVIRONMENT VARIABLES:");
    console.log("=========================");
    console.log("Add these to your .env file:");
    console.log(`DEVELOPER_REPUTATION_ADDRESS=${deployedContracts.developerReputation}`);
    console.log(`DEVELOPER_BADGE_ADDRESS=${deployedContracts.developerBadge}`);
    console.log(`SIMPLE_BOUNTY_VERIFIER_ADDRESS=${deployedContracts.simpleBountyVerifier}`);
    console.log(`BOUNTY_MARKETPLACE_ADDRESS=${deployedContracts.bountyMarketplace}`);

    console.log("\n📱 FRONTEND INTEGRATION:");
    console.log("========================");
    console.log("Update your frontend config with these addresses for Avalanche Fuji testnet.");

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
    }
    
    process.exitCode = 1;
  }
}

// Enhanced error handling
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
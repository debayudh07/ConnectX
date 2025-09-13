import { ethers } from "ethers";
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("⚡ OPTIMIZED ConnectX Deployment - Gas Reduction Strategy\n");

  // Check for private key
  const privateKey = process.env.FUJI_PRIVATE_KEY;
  if (!privateKey) {
    console.log("❌ Please set FUJI_PRIVATE_KEY environment variable");
    process.exit(1);
  }

  // Set up provider with optimized settings
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log("Deployer account:", deployer.address);
  
  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "AVAX\n");

  // Get optimized gas price (25% below current for longer wait but cheaper cost)
  const feeData = await provider.getFeeData();
  const currentGasPrice = feeData.gasPrice || 0n;
  const optimizedGasPrice = (currentGasPrice * 75n) / 100n; // 25% reduction
  
  console.log("Current gas price:", ethers.formatUnits(currentGasPrice, "gwei"), "gwei");
  console.log("Optimized gas price:", ethers.formatUnits(optimizedGasPrice, "gwei"), "gwei");
  console.log("Gas savings: 25% per transaction\n");

  let deployedContracts: any = {};
  let totalGasUsed = 0n;
  let totalCost = 0n;

  try {
    console.log("🎯 OPTIMIZED DEPLOYMENT STRATEGY:");
    console.log("================================");
    console.log("1. Deploy in reverse dependency order (most independent first)");
    console.log("2. Use reduced gas price with longer confirmation times");
    console.log("3. Bundle initialization transactions");
    console.log("4. Skip optional features during deployment");
    console.log("5. Use efficient contract configuration\n");

    // Get contract artifacts
    const reputationArtifact = await hre.artifacts.readArtifact("DeveloperReputation");
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");
    const verifierArtifact = await hre.artifacts.readArtifact("SimpleBountyVerifier");
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");

    // 1. Deploy SimpleBountyVerifier (smallest, no dependencies)
    console.log("✅ Step 1: Deploying SimpleBountyVerifier (optimized)...");
    const VerifierFactory = new ethers.ContractFactory(
      verifierArtifact.abi,
      verifierArtifact.bytecode,
      deployer
    );
    
    const verifierTx = await VerifierFactory.getDeployTransaction();
    const verifierGasEstimate = await provider.estimateGas(verifierTx);
    
    const simpleBountyVerifier = await VerifierFactory.deploy({
      gasPrice: optimizedGasPrice,
      gasLimit: verifierGasEstimate + 10000n // Small buffer
    });
    
    const verifierReceipt = await simpleBountyVerifier.deploymentTransaction()?.wait();
    const verifierAddress = await simpleBountyVerifier.getAddress();
    deployedContracts.simpleBountyVerifier = verifierAddress;
    
    if (verifierReceipt) {
      totalGasUsed += verifierReceipt.gasUsed;
      totalCost += verifierReceipt.gasUsed * optimizedGasPrice;
    }
    
    console.log("✅ SimpleBountyVerifier deployed at:", verifierAddress);
    console.log("   Gas used:", verifierReceipt?.gasUsed.toString());
    
    // Wait longer for cheaper gas
    console.log("⏳ Waiting 8 seconds for next deployment...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 2. Deploy DeveloperReputation (independent)
    console.log("\n📊 Step 2: Deploying DeveloperReputation (optimized)...");
    const ReputationFactory = new ethers.ContractFactory(
      reputationArtifact.abi,
      reputationArtifact.bytecode,
      deployer
    );
    
    const reputationTx = await ReputationFactory.getDeployTransaction();
    const reputationGasEstimate = await provider.estimateGas(reputationTx);
    
    const developerReputation = await ReputationFactory.deploy({
      gasPrice: optimizedGasPrice,
      gasLimit: reputationGasEstimate + 15000n
    });
    
    const reputationReceipt = await developerReputation.deploymentTransaction()?.wait();
    const reputationAddress = await developerReputation.getAddress();
    deployedContracts.developerReputation = reputationAddress;
    
    if (reputationReceipt) {
      totalGasUsed += reputationReceipt.gasUsed;
      totalCost += reputationReceipt.gasUsed * optimizedGasPrice;
    }
    
    console.log("✅ DeveloperReputation deployed at:", reputationAddress);
    console.log("   Gas used:", reputationReceipt?.gasUsed.toString());
    
    console.log("⏳ Waiting 8 seconds for next deployment...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 3. Deploy DeveloperBadge (independent, largest)
    console.log("\n🏅 Step 3: Deploying DeveloperBadge (optimized)...");
    const BadgeFactory = new ethers.ContractFactory(
      badgeArtifact.abi,
      badgeArtifact.bytecode,
      deployer
    );
    
    const badgeTx = await BadgeFactory.getDeployTransaction();
    const badgeGasEstimate = await provider.estimateGas(badgeTx);
    
    const developerBadge = await BadgeFactory.deploy({
      gasPrice: optimizedGasPrice,
      gasLimit: badgeGasEstimate + 20000n
    });
    
    const badgeReceipt = await developerBadge.deploymentTransaction()?.wait();
    const badgeAddress = await developerBadge.getAddress();
    deployedContracts.developerBadge = badgeAddress;
    
    if (badgeReceipt) {
      totalGasUsed += badgeReceipt.gasUsed;
      totalCost += badgeReceipt.gasUsed * optimizedGasPrice;
    }
    
    console.log("✅ DeveloperBadge deployed at:", badgeAddress);
    console.log("   Gas used:", badgeReceipt?.gasUsed.toString());
    
    console.log("⏳ Waiting 8 seconds for next deployment...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 4. Deploy BountyMarketplace (depends on others)
    console.log("\n🏪 Step 4: Deploying BountyMarketplace (optimized)...");
    const feeRecipient = deployer.address;
    const MarketplaceFactory = new ethers.ContractFactory(
      marketplaceArtifact.abi,
      marketplaceArtifact.bytecode,
      deployer
    );
    
    const marketplaceTx = await MarketplaceFactory.getDeployTransaction(feeRecipient);
    const marketplaceGasEstimate = await provider.estimateGas(marketplaceTx);
    
    const bountyMarketplace = await MarketplaceFactory.deploy(feeRecipient, {
      gasPrice: optimizedGasPrice,
      gasLimit: marketplaceGasEstimate + 20000n
    });
    
    const marketplaceReceipt = await bountyMarketplace.deploymentTransaction()?.wait();
    const marketplaceAddress = await bountyMarketplace.getAddress();
    deployedContracts.bountyMarketplace = marketplaceAddress;
    
    if (marketplaceReceipt) {
      totalGasUsed += marketplaceReceipt.gasUsed;
      totalCost += marketplaceReceipt.gasUsed * optimizedGasPrice;
    }
    
    console.log("✅ BountyMarketplace deployed at:", marketplaceAddress);
    console.log("   Gas used:", marketplaceReceipt?.gasUsed.toString());

    console.log("\n🔧 OPTIMIZED CONFIGURATION PHASE:");
    console.log("=================================");

    // 5. Batch configuration transactions for gas efficiency
    console.log("🔗 Step 5: Configuring contract integrations (batched)...");
    
    // Instead of individual transactions, we'll prepare multiple operations
    // and execute them with optimized gas settings
    
    // Configure BountyMarketplace with all addresses at once
    const setAddressesTx = await bountyMarketplace.setContractAddresses(
      badgeAddress,
      reputationAddress,
      verifierAddress,
      {
        gasPrice: optimizedGasPrice
      }
    );
    
    const configReceipt = await setAddressesTx.wait();
    totalGasUsed += configReceipt.gasUsed;
    totalCost += configReceipt.gasUsed * optimizedGasPrice;
    
    console.log("✅ Contract addresses configured");
    console.log("   Gas used:", configReceipt.gasUsed.toString());

    // 6. Essential role grants only (defer optional roles)
    console.log("\n👥 Step 6: Essential role configuration...");
    
    // Grant only the most critical roles needed for basic functionality
    const grantMinterTx = await developerBadge.setMinterRole(marketplaceAddress, {
      gasPrice: optimizedGasPrice
    });
    await grantMinterTx.wait();
    
    const grantMarketplaceTx = await developerReputation.setMarketplaceRole(marketplaceAddress, {
      gasPrice: optimizedGasPrice
    });
    await grantMarketplaceTx.wait();
    
    console.log("✅ Essential roles configured");

    // 7. Skip expensive initialization for now (can be done later)
    console.log("\n⚠️  Step 7: Deferring expensive initializations...");
    console.log("   - Reputation tiers initialization: DEFERRED");
    console.log("   - Streak rewards setup: DEFERRED");
    console.log("   - Additional verifier roles: DEFERRED");
    console.log("   ℹ️  These can be initialized later with separate transactions");

    console.log("\n🎉 OPTIMIZED DEPLOYMENT COMPLETED!");
    console.log("=====================================");
    
    // Calculate savings
    const standardGasPrice = currentGasPrice;
    const standardCost = totalGasUsed * standardGasPrice;
    const actualCost = totalCost;
    const savings = standardCost - actualCost;
    
    console.log("\n💰 GAS COST ANALYSIS:");
    console.log("=====================");
    console.log("Total gas used:", totalGasUsed.toString());
    console.log("Standard cost (current gas price):", ethers.formatEther(standardCost), "AVAX");
    console.log("Optimized cost (reduced gas price):", ethers.formatEther(actualCost), "AVAX");
    console.log("💸 SAVINGS:", ethers.formatEther(savings), "AVAX");
    console.log("💸 Percentage saved:", ((Number(savings) / Number(standardCost)) * 100).toFixed(1), "%");
    
    // Display all deployed addresses
    console.log("\n📋 DEPLOYED CONTRACT ADDRESSES:");
    console.log("===============================");
    console.log("SimpleBountyVerifier:", deployedContracts.simpleBountyVerifier);
    console.log("DeveloperReputation :", deployedContracts.developerReputation);
    console.log("DeveloperBadge      :", deployedContracts.developerBadge);
    console.log("BountyMarketplace   :", deployedContracts.bountyMarketplace);

    // Save deployment info
    const deploymentInfo = {
      network: "fuji",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      gasOptimization: {
        totalGasUsed: totalGasUsed.toString(),
        optimizedGasPrice: optimizedGasPrice.toString(),
        standardCost: ethers.formatEther(standardCost),
        actualCost: ethers.formatEther(actualCost),
        savings: ethers.formatEther(savings),
        savingsPercentage: ((Number(savings) / Number(standardCost)) * 100).toFixed(1) + "%"
      }
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `fuji-optimized-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🔧 POST-DEPLOYMENT OPTIMIZATION TASKS:");
    console.log("======================================");
    console.log("Run these later (when gas prices are low):");
    console.log("1. npx hardhat run scripts/optimize/init-reputation-tiers.ts");
    console.log("2. npx hardhat run scripts/optimize/init-streak-rewards.ts");
    console.log("3. npx hardhat run scripts/optimize/add-additional-roles.ts");

    console.log("\n💡 FURTHER OPTIMIZATION OPPORTUNITIES:");
    console.log("======================================");
    console.log("• Deploy during off-peak hours (00:00-06:00 UTC)");
    console.log("• Monitor gas prices using Avalanche gas tracker");
    console.log("• Consider using multisig for admin functions to save individual transaction costs");
    console.log("• Batch user interactions where possible");
    console.log("• Implement gas station network (GSN) for user subsidization");

    console.log("\n📱 INTEGRATION:");
    console.log("===============");
    console.log("Update your .env file:");
    console.log(`DEVELOPER_REPUTATION_ADDRESS=${deployedContracts.developerReputation}`);
    console.log(`DEVELOPER_BADGE_ADDRESS=${deployedContracts.developerBadge}`);
    console.log(`SIMPLE_BOUNTY_VERIFIER_ADDRESS=${deployedContracts.simpleBountyVerifier}`);
    console.log(`BOUNTY_MARKETPLACE_ADDRESS=${deployedContracts.bountyMarketplace}`);

  } catch (error) {
    console.error("\n❌ OPTIMIZED DEPLOYMENT FAILED:");
    console.error("================================");
    console.error("Error:", error);
    
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

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
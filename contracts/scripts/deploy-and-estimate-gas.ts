import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("🚀 Estimating gas costs for ConnectX deployment on Avalanche Fuji...\n");

  // Get deployer account and provider
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  // For estimation, we'll use a dummy signer
  const wallet = ethers.Wallet.createRandom();
  const signer = wallet.connect(provider);
  
  console.log("Using provider: Avalanche Fuji Testnet");
  
  // Get current gas price on Fuji (typical range: 25-100 nAVAX)
  const gasPrice = await provider.getFeeData();
  
  console.log("Current Gas Price:", ethers.formatEther(gasPrice.gasPrice || 0n), "AVAX");
  console.log("Max Fee Per Gas:", ethers.formatEther(gasPrice.maxFeePerGas || 0n), "AVAX");
  console.log("Max Priority Fee:", ethers.formatEther(gasPrice.maxPriorityFeePerGas || 0n), "AVAX\n");

  const feeRecipient = wallet.address; // Using dummy address for estimation
  
  try {
    // Get contract artifacts
    const DeveloperReputationArtifact = await hre.artifacts.readArtifact("DeveloperReputation");
    const DeveloperBadgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");
    const SimpleBountyVerifierArtifact = await hre.artifacts.readArtifact("SimpleBountyVerifier");
    const BountyMarketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");

    // Create contract factories
    const DeveloperReputationFactory = new ethers.ContractFactory(
      DeveloperReputationArtifact.abi,
      DeveloperReputationArtifact.bytecode,
      signer
    );
    
    const DeveloperBadgeFactory = new ethers.ContractFactory(
      DeveloperBadgeArtifact.abi,
      DeveloperBadgeArtifact.bytecode,
      signer
    );
    
    const SimpleBountyVerifierFactory = new ethers.ContractFactory(
      SimpleBountyVerifierArtifact.abi,
      SimpleBountyVerifierArtifact.bytecode,
      signer
    );
    
    const BountyMarketplaceFactory = new ethers.ContractFactory(
      BountyMarketplaceArtifact.abi,
      BountyMarketplaceArtifact.bytecode,
      signer
    );

    // 1. Estimate DeveloperReputation deployment
    console.log("📊 Estimating DeveloperReputation deployment...");
    const reputationDeployTx = await DeveloperReputationFactory.getDeployTransaction();
    const reputationGasEstimate = await provider.estimateGas(reputationDeployTx);
    const reputationGasCost = reputationGasEstimate * (gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n);
    
    console.log("Gas required:", reputationGasEstimate.toString());
    console.log("Estimated cost:", ethers.formatEther(reputationGasCost), "AVAX\n");

    // 2. Estimate DeveloperBadge deployment
    console.log("🏅 Estimating DeveloperBadge deployment...");
    const badgeDeployTx = await DeveloperBadgeFactory.getDeployTransaction();
    const badgeGasEstimate = await provider.estimateGas(badgeDeployTx);
    const badgeGasCost = badgeGasEstimate * (gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n);
    
    console.log("Gas required:", badgeGasEstimate.toString());
    console.log("Estimated cost:", ethers.formatEther(badgeGasCost), "AVAX\n");

    // 3. Estimate SimpleBountyVerifier deployment
    console.log("✅ Estimating SimpleBountyVerifier deployment...");
    const verifierDeployTx = await SimpleBountyVerifierFactory.getDeployTransaction();
    const verifierGasEstimate = await provider.estimateGas(verifierDeployTx);
    const verifierGasCost = verifierGasEstimate * (gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n);
    
    console.log("Gas required:", verifierGasEstimate.toString());
    console.log("Estimated cost:", ethers.formatEther(verifierGasCost), "AVAX\n");

    // 4. Estimate BountyMarketplace deployment
    console.log("🏪 Estimating BountyMarketplace deployment...");
    const marketplaceDeployTx = await BountyMarketplaceFactory.getDeployTransaction(feeRecipient);
    const marketplaceGasEstimate = await provider.estimateGas(marketplaceDeployTx);
    const marketplaceGasCost = marketplaceGasEstimate * (gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n);
    
    console.log("Gas required:", marketplaceGasEstimate.toString());
    console.log("Estimated cost:", ethers.formatEther(marketplaceGasCost), "AVAX\n");

    // Calculate totals
    const totalGas = reputationGasEstimate + badgeGasEstimate + verifierGasEstimate + marketplaceGasEstimate;
    const totalCost = reputationGasCost + badgeGasCost + verifierGasCost + marketplaceGasCost;

    console.log("=" .repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=" .repeat(60));
    console.log("Total Gas Required:", totalGas.toString());
    console.log("Total Deployment Cost:", ethers.formatEther(totalCost), "AVAX");
    
    // Add buffer for setup transactions (20% extra)
    const bufferCost = totalCost * 20n / 100n;
    const totalWithBuffer = totalCost + bufferCost;
    
    console.log("Setup transactions buffer (+20%):", ethers.formatEther(bufferCost), "AVAX");
    console.log("Total with buffer:", ethers.formatEther(totalWithBuffer), "AVAX");
    
    // Convert to USD (approximate AVAX price)
    const avaxPriceUSD = 25; // Approximate AVAX price - update as needed
    const totalCostUSD = parseFloat(ethers.formatEther(totalWithBuffer)) * avaxPriceUSD;
    
    console.log("Estimated cost in USD: $", totalCostUSD.toFixed(2));
    console.log("=" .repeat(60));

    // Additional setup cost estimation
    console.log("\n🔧 POST-DEPLOYMENT SETUP COSTS:");
    console.log("- Set contract addresses: ~50,000 gas");
    console.log("- Grant roles (3 contracts): ~150,000 gas");
    console.log("- Initialize configurations: ~100,000 gas");
    
    const setupGas = 300000n; // 300k gas for setup
    const setupCost = setupGas * (gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n);
    console.log("Total setup cost:", ethers.formatEther(setupCost), "AVAX");
    
    const grandTotal = totalWithBuffer + setupCost;
    const grandTotalUSD = parseFloat(ethers.formatEther(grandTotal)) * avaxPriceUSD;
    
    console.log("\n🎯 FINAL ESTIMATE:");
    console.log("Total deployment + setup:", ethers.formatEther(grandTotal), "AVAX");
    console.log("Total in USD: $", grandTotalUSD.toFixed(2));
    
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("- Ensure you have at least", ethers.formatEther(grandTotal * 150n / 100n), "AVAX for safety");
    console.log("- Monitor gas prices before deployment");
    console.log("- Consider deploying during low network usage");

  } catch (error) {
    console.error("Error estimating gas costs:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
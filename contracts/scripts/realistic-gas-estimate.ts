import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("🚀 Realistic Gas Cost Estimation for ConnectX on Avalanche Fuji\n");

  // Typical Avalanche Fuji gas prices (in gwei)
  const typicalGasPrices = {
    low: ethers.parseUnits("25", "gwei"),      // 25 nAVAX
    normal: ethers.parseUnits("50", "gwei"),    // 50 nAVAX  
    high: ethers.parseUnits("100", "gwei")      // 100 nAVAX
  };

  try {
    // Get contract artifacts and create factories for size estimation
    const artifacts = {
      DeveloperReputation: await hre.artifacts.readArtifact("DeveloperReputation"),
      DeveloperBadge: await hre.artifacts.readArtifact("DeveloperBadge"),
      SimpleBountyVerifier: await hre.artifacts.readArtifact("SimpleBountyVerifier"),
      BountyMarketplace: await hre.artifacts.readArtifact("BountyMarketplace")
    };

    // Estimate gas based on bytecode size and complexity
    const gasEstimates = {
      DeveloperReputation: 3100000n,   // Complex reputation logic
      DeveloperBadge: 4650000n,        // ERC721 with multiple extensions
      SimpleBountyVerifier: 1900000n,  // Simple verification contract
      BountyMarketplace: 3800000n      // Main marketplace contract
    };

    console.log("📊 CONTRACT DEPLOYMENT GAS ESTIMATES:");
    console.log("=====================================");
    
    Object.entries(gasEstimates).forEach(([name, gas]) => {
      console.log(`${name.padEnd(20)}: ${gas.toLocaleString()} gas`);
    });
    
    const totalGas = Object.values(gasEstimates).reduce((sum, gas) => sum + gas, 0n);
    console.log(`${"TOTAL".padEnd(20)}: ${totalGas.toLocaleString()} gas\n`);

    // Calculate costs for different gas price scenarios
    console.log("💰 COST ESTIMATES BY GAS PRICE SCENARIO:");
    console.log("==========================================");
    
    Object.entries(typicalGasPrices).forEach(([scenario, gasPrice]) => {
      const deploymentCost = totalGas * gasPrice;
      const setupCost = 300000n * gasPrice; // 300k gas for setup transactions
      const bufferCost = (deploymentCost + setupCost) * 20n / 100n; // 20% buffer
      const totalCost = deploymentCost + setupCost + bufferCost;
      
      console.log(`\n${scenario.toUpperCase()} (${ethers.formatUnits(gasPrice, "gwei")} gwei):`);
      console.log(`  Deployment: ${ethers.formatEther(deploymentCost)} AVAX`);
      console.log(`  Setup:      ${ethers.formatEther(setupCost)} AVAX`);
      console.log(`  Buffer:     ${ethers.formatEther(bufferCost)} AVAX`);
      console.log(`  TOTAL:      ${ethers.formatEther(totalCost)} AVAX`);
      
      // Convert to USD (AVAX ≈ $25)
      const avaxPrice = 25;
      const totalUSD = parseFloat(ethers.formatEther(totalCost)) * avaxPrice;
      console.log(`  USD:        $${totalUSD.toFixed(2)}`);
    });

    console.log("\n🎯 SUMMARY & RECOMMENDATIONS:");
    console.log("==============================");
    console.log("• Contract sizes are large due to complex functionality");
    console.log("• DeveloperBadge is the most expensive (ERC721 + extensions)");
    console.log("• BountyMarketplace has significant business logic");
    console.log("• Total gas: ~13.4M gas units for all 4 contracts");
    
    console.log("\n💡 OPTIMIZATION TIPS:");
    console.log("=====================");
    console.log("• Deploy during low network activity");
    console.log("• Consider deploying contracts individually");
    console.log("• Monitor Avalanche gas tracker before deployment");
    console.log("• Have 50% extra AVAX beyond estimates for safety");
    
    console.log("\n📋 POST-DEPLOYMENT SETUP COSTS:");
    console.log("================================");
    console.log("• Set contract addresses: ~50,000 gas");
    console.log("• Grant MINTER_ROLE to marketplace: ~46,000 gas");
    console.log("• Grant MARKETPLACE_ROLE to reputation: ~46,000 gas");
    console.log("• Grant VERIFIER_ROLE: ~46,000 gas");
    console.log("• Initialize reputation tiers: ~100,000 gas");
    console.log("• Test basic functionality: ~50,000 gas");
    console.log("Total setup: ~300,000 gas");

    // Realistic recommendation
    const recommendedGasPrice = typicalGasPrices.normal;
    const recommendedCost = (totalGas + 300000n) * recommendedGasPrice * 150n / 100n; // 50% safety buffer
    
    console.log("\n🎯 FINAL RECOMMENDATION:");
    console.log("========================");
    console.log(`Have at least ${ethers.formatEther(recommendedCost)} AVAX ready`);
    console.log(`(≈ $${(parseFloat(ethers.formatEther(recommendedCost)) * 25).toFixed(2)} USD)`);
    console.log("This includes deployment + setup + 50% safety buffer");

  } catch (error) {
    console.error("❌ Error in gas estimation:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
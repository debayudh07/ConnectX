import { ethers } from "ethers";
import hre from "hardhat";

const EXISTING_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function deployOptimizedBadge() {
  console.log("🚀 DEPLOYING OPTIMIZED DEVELOPER BADGE");
  console.log("=====================================\n");

  const privateKey = "cacabf3f9c7dfc4ba678bba406847031bb6cbe6725bad9e0d8424f90efbb2a1f";
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log("🔑 Deployer account:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "AVAX\n");

  try {
    // Get optimized gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    const optimizedGasPrice = (gasPrice * 75n) / 100n; // 25% reduction
    
    console.log("⛽ Optimized gas price:", ethers.formatUnits(optimizedGasPrice, "gwei"), "gwei\n");

    // 1. Deploy the optimized DeveloperBadge contract
    console.log("1️⃣ Deploying DeveloperBadgeOptimized...");
    
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadgeOptimized");
    const BadgeFactory = new ethers.ContractFactory(
      badgeArtifact.abi,
      badgeArtifact.bytecode,
      deployer
    );
    
    const badgeContract = await BadgeFactory.deploy({
      gasPrice: optimizedGasPrice
    });
    
    const deploymentTx = await badgeContract.deploymentTransaction()?.wait();
    const newBadgeAddress = await badgeContract.getAddress();
    
    console.log("✅ DeveloperBadgeOptimized deployed at:", newBadgeAddress);
    console.log();

    // 2. Update BountyMarketplace to use new badge contract
    console.log("2️⃣ Updating BountyMarketplace configuration...");
    
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");
    const bountyMarketplace = new ethers.Contract(
      EXISTING_ADDRESSES.BOUNTY_MARKETPLACE,
      marketplaceArtifact.abi,
      deployer
    );
    
    const updateTx = await bountyMarketplace.setContractAddresses(
      newBadgeAddress, // New optimized badge contract
      EXISTING_ADDRESSES.DEVELOPER_REPUTATION,
      EXISTING_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
      {
        gasPrice: optimizedGasPrice,
        gasLimit: 150000
      }
    );
    
    console.log("📤 Update transaction sent:", updateTx.hash);
    await updateTx.wait();
    console.log("✅ BountyMarketplace updated with new badge contract");
    console.log();

    // 3. Grant MINTER_ROLE to BountyMarketplace
    console.log("3️⃣ Granting MINTER_ROLE to BountyMarketplace...");
    
    const grantRoleTx = await badgeContract.setMinterRole(
      EXISTING_ADDRESSES.BOUNTY_MARKETPLACE,
      {
        gasPrice: optimizedGasPrice,
        gasLimit: 100000
      }
    );
    
    console.log("📤 Grant role transaction sent:", grantRoleTx.hash);
    await grantRoleTx.wait();
    console.log("✅ MINTER_ROLE granted to BountyMarketplace");
    console.log();

    // 4. Test the optimized minting
    console.log("4️⃣ Testing optimized minting...");
    
    try {
      const testMintTx = await badgeContract.mintBadge(
        deployer.address,
        999, // Test bounty ID
        '{"test": "metadata"}',
        {
          gasPrice: optimizedGasPrice,
          gasLimit: 200000 // Much lower gas limit
        }
      );
      
      console.log("📤 Test mint transaction sent:", testMintTx.hash);
      const receipt = await testMintTx.wait();
      console.log("✅ Test mint successful! Gas used:", receipt.gasUsed.toString());
      
      // Check total supply
      const totalSupply = await badgeContract.totalSupply();
      console.log("📊 New total supply:", totalSupply.toString());
      
      // Get token URI to verify it works
      if (totalSupply > 0) {
        const tokenURI = await badgeContract.tokenURI(totalSupply - 1n);
        console.log("🎨 Sample token URI length:", tokenURI.length, "characters");
      }
      
    } catch (e) {
      console.log("❌ Test mint failed:", e);
    }
    console.log();

    // 5. Final verification
    console.log("5️⃣ Final verification...");
    
    const connectedBadgeAddress = await bountyMarketplace.developerBadge();
    console.log("BountyMarketplace.developerBadge():", connectedBadgeAddress);
    console.log("New DeveloperBadgeOptimized     :", newBadgeAddress);
    console.log("✅ Address match:", connectedBadgeAddress.toLowerCase() === newBadgeAddress.toLowerCase() ? "YES" : "NO");
    
    const minterRole = await badgeContract.MINTER_ROLE();
    const hasMinterRole = await badgeContract.hasRole(minterRole, EXISTING_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("✅ BountyMarketplace has MINTER_ROLE:", hasMinterRole ? "YES" : "NO");
    console.log();

    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    console.log("📋 NEW CONTRACT ADDRESSES:");
    console.log("DeveloperBadgeOptimized:", newBadgeAddress);
    console.log();
    console.log("📋 EXISTING CONTRACT ADDRESSES:");
    console.log("BountyMarketplace      :", EXISTING_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("DeveloperReputation    :", EXISTING_ADDRESSES.DEVELOPER_REPUTATION);
    console.log("SimpleBountyVerifier   :", EXISTING_ADDRESSES.SIMPLE_BOUNTY_VERIFIER);
    console.log();
    console.log("✅ NFT badges should now mint successfully with reduced gas usage!");
    console.log("🧪 Test by completing a bounty and verifying the work.");

  } catch (error) {
    console.error("❌ Error during deployment:", error);
  }
}

deployOptimizedBadge().catch(console.error);
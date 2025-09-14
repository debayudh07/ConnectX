import { ethers } from "ethers";
import hre from "hardhat";

const CONTRACT_ADDRESSES = {
  DEVELOPER_BADGE: '0x6F0E57ec6b55F13f64E328c691319dDD3924aE98',
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function testMintBadge() {
  console.log("🧪 TESTING NFT MINTING DIRECTLY");
  console.log("==============================\n");

  const privateKey = "cacabf3f9c7dfc4ba678bba406847031bb6cbe6725bad9e0d8424f90efbb2a1f";
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const signer = new ethers.Wallet(privateKey, provider);
  
  try {
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadgeMinimal");
    const developerBadge = new ethers.Contract(
      CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      badgeArtifact.abi,
      signer
    );

    console.log("📋 Test Parameters:");
    console.log("Developer address:", signer.address);
    console.log("Bounty ID:", 999); // Test bounty ID
    console.log("Badge contract:", CONTRACT_ADDRESSES.DEVELOPER_BADGE);
    console.log();

    // Test 1: Check if we have minter role
    console.log("1️⃣ Checking minter permissions...");
    const minterRole = await developerBadge.MINTER_ROLE();
    const hasMinterRole = await developerBadge.hasRole(minterRole, signer.address);
    console.log("My address has MINTER_ROLE:", hasMinterRole);
    
    const marketplaceHasMinterRole = await developerBadge.hasRole(minterRole, CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("BountyMarketplace has MINTER_ROLE:", marketplaceHasMinterRole);
    console.log();

    // Test 2: Try to mint directly (if we have permission)
    if (hasMinterRole) {
      console.log("2️⃣ Attempting direct mint...");
      try {
        const tx = await developerBadge.mintBadge(
          signer.address,
          999,
          '{"test": "metadata"}',
          {
            gasLimit: 500000
          }
        );
        
        console.log("📤 Mint transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Mint successful! Gas used:", receipt.gasUsed.toString());
        
        // Check total supply
        const totalSupply = await developerBadge.totalSupply();
        console.log("New total supply:", totalSupply.toString());
        
      } catch (e) {
        console.log("❌ Direct mint failed:", e);
      }
    } else {
      console.log("2️⃣ Cannot test direct mint - no MINTER_ROLE");
    }
    
    // Test 3: Simulate marketplace call
    console.log("3️⃣ Simulating marketplace mint call...");
    try {
      // Estimate gas for mint operation
      const gasEstimate = await developerBadge.estimateGas.mintBadge(
        signer.address,
        999,
        '{"test": "metadata"}'
      );
      console.log("Gas estimate for mint:", gasEstimate.toString());
      
      if (gasEstimate > 300000) {
        console.log("⚠️ High gas usage detected - this might cause transaction failures");
      }
      
    } catch (e) {
      console.log("❌ Gas estimation failed:", e);
    }
    
    // Test 4: Check current total supply
    console.log("4️⃣ Current NFT state...");
    const totalSupply = await developerBadge.totalSupply();
    console.log("Current total supply:", totalSupply.toString());
    
    if (totalSupply > 0) {
      const lastTokenId = await developerBadge.tokenByIndex(Number(totalSupply) - 1);
      const owner = await developerBadge.ownerOf(lastTokenId);
      console.log("Last minted token:", lastTokenId.toString(), "owned by:", owner);
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
  }
}

testMintBadge().catch(console.error);
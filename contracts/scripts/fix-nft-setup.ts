import { ethers } from "ethers";
import hre from "hardhat";

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  DEVELOPER_BADGE: '0x04CE909c5688D63C3cB4b7381D367d4bfe5992Be',
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function fixContractConnections() {
  console.log("🔧 FIXING NFT MINTING SETUP");
  console.log("===========================\n");

  // Check for private key
  const privateKey = "cacabf3f9c7dfc4ba678bba406847031bb6cbe6725bad9e0d8424f90efbb2a1f";
  if (!privateKey) {
    console.log("❌ Please set FUJI_PRIVATE_KEY environment variable");
    process.exit(1);
  }

  // Set up provider and signer
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const signer = new ethers.Wallet(privateKey, provider);
  
  console.log("🔑 Deployer account:", signer.address);
  
  // Check balance
  const balance = await provider.getBalance(signer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "AVAX\n");

  try {
    // Get contract artifacts
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");

    // Connect to deployed contracts
    const bountyMarketplace = new ethers.Contract(
      CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      marketplaceArtifact.abi,
      signer
    );

    const developerBadge = new ethers.Contract(
      CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      badgeArtifact.abi,
      signer
    );

    console.log("📋 Contract Instances Created");
    console.log("BountyMarketplace:", CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("DeveloperBadge   :", CONTRACT_ADDRESSES.DEVELOPER_BADGE);
    console.log();

    // Get gas settings
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    
    console.log("⛽ Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");

    // Step 1: Set contract addresses on BountyMarketplace
    console.log("1️⃣ Setting contract addresses on BountyMarketplace...");
    
    const setAddressesTx = await bountyMarketplace.setContractAddresses(
      CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
      CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
      {
        gasPrice: gasPrice,
        gasLimit: 150000
      }
    );
    
    console.log("📤 Transaction sent:", setAddressesTx.hash);
    const setAddressesReceipt = await setAddressesTx.wait();
    console.log("✅ Contract addresses set! Gas used:", setAddressesReceipt.gasUsed.toString());
    console.log();

    // Step 2: Grant MINTER_ROLE to BountyMarketplace
    console.log("2️⃣ Granting MINTER_ROLE to BountyMarketplace...");
    
    const grantRoleTx = await developerBadge.setMinterRole(
      CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      {
        gasPrice: gasPrice,
        gasLimit: 100000
      }
    );
    
    console.log("📤 Transaction sent:", grantRoleTx.hash);
    const grantRoleReceipt = await grantRoleTx.wait();
    console.log("✅ MINTER_ROLE granted! Gas used:", grantRoleReceipt.gasUsed.toString());
    console.log();

    // Step 3: Verify the fixes
    console.log("3️⃣ Verifying fixes...");
    
    const connectedBadgeAddress = await bountyMarketplace.developerBadge();
    const connectedReputationAddress = await bountyMarketplace.developerReputation();
    
    console.log("BountyMarketplace.developerBadge()    :", connectedBadgeAddress);
    console.log("Expected                              :", CONTRACT_ADDRESSES.DEVELOPER_BADGE);
    console.log("✅ Badge address correct:", 
      connectedBadgeAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_BADGE.toLowerCase() ? "YES" : "NO");
    
    console.log("BountyMarketplace.developerReputation():", connectedReputationAddress);
    console.log("Expected                                :", CONTRACT_ADDRESSES.DEVELOPER_REPUTATION);
    console.log("✅ Reputation address correct:", 
      connectedReputationAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_REPUTATION.toLowerCase() ? "YES" : "NO");

    // Check MINTER_ROLE
    const minterRole = await developerBadge.MINTER_ROLE();
    const hasMinterRole = await developerBadge.hasRole(minterRole, CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("✅ BountyMarketplace has MINTER_ROLE:", hasMinterRole ? "YES" : "NO");
    console.log();

    if (connectedBadgeAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_BADGE.toLowerCase() && 
        connectedReputationAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_REPUTATION.toLowerCase() &&
        hasMinterRole) {
      console.log("🎉 SUCCESS! All connections and permissions are now correct!");
      console.log("📊 NFT badges should now mint automatically when bounties are verified and paid.");
      console.log();
      console.log("🔬 TESTING RECOMMENDATION:");
      console.log("1. Submit a test bounty");
      console.log("2. Claim the bounty");
      console.log("3. Submit work for the bounty");
      console.log("4. Verify and pay the bounty");
      console.log("5. Check if the NFT badge appears in the developer's wallet");
    } else {
      console.log("❌ Some issues remain. Please check the verification output above.");
    }

  } catch (error: any) {
    console.error("❌ Error during fix:", error);
    
    if (error.message?.includes("user rejected")) {
      console.log("💡 Transaction was rejected by user");
    } else if (error.message?.includes("insufficient funds")) {
      console.log("💡 Insufficient funds for gas");
    } else if (error.message?.includes("nonce")) {
      console.log("💡 Nonce issue - try again in a moment");
    } else {
      console.log("💡 Check your private key and network connection");
    }
  }
}

fixContractConnections().catch(console.error);
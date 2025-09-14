import { ethers } from "ethers";

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  DEVELOPER_BADGE: '0x6F0E57ec6b55F13f64E328c691319dDD3924aE98', // Updated to minimal contract
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

// ABI snippets for the specific functions we need
const DeveloperBadgeABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const BountyMarketplaceABI = [
  {
    "inputs": [],
    "name": "developerBadge",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "developerReputation",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkNFTMintingSetup() {
  console.log("🔍 NFT Minting Setup Verification");
  console.log("=================================\n");

  // Set up provider
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  // Connect to contracts
  const bountyMarketplace = new ethers.Contract(
    CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    BountyMarketplaceABI,
    provider
  );
  
  const developerBadge = new ethers.Contract(
    CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    DeveloperBadgeABI,
    provider
  );

  try {
    console.log("📋 Contract Addresses:");
    console.log("BountyMarketplace:", CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("DeveloperBadge   :", CONTRACT_ADDRESSES.DEVELOPER_BADGE);
    console.log("DeveloperRep     :", CONTRACT_ADDRESSES.DEVELOPER_REPUTATION);
    console.log();

    // 1. Check if BountyMarketplace has correct DeveloperBadge address
    console.log("1️⃣ Checking contract connections...");
    const connectedBadgeAddress = await bountyMarketplace.developerBadge();
    const connectedReputationAddress = await bountyMarketplace.developerReputation();
    
    console.log("BountyMarketplace.developerBadge():", connectedBadgeAddress);
    console.log("Expected DeveloperBadge address    :", CONTRACT_ADDRESSES.DEVELOPER_BADGE);
    console.log("✅ Badge address match:", 
      connectedBadgeAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_BADGE.toLowerCase() ? "YES" : "NO");
    
    console.log("BountyMarketplace.developerReputation():", connectedReputationAddress);
    console.log("Expected DeveloperRep address          :", CONTRACT_ADDRESSES.DEVELOPER_REPUTATION);
    console.log("✅ Reputation address match:", 
      connectedReputationAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_REPUTATION.toLowerCase() ? "YES" : "NO");
    console.log();

    // 2. Check MINTER_ROLE permissions
    console.log("2️⃣ Checking MINTER_ROLE permissions...");
    const minterRole = await developerBadge.MINTER_ROLE();
    const hasMinterRole = await developerBadge.hasRole(minterRole, CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    
    console.log("MINTER_ROLE constant:", minterRole);
    console.log("BountyMarketplace has MINTER_ROLE:", hasMinterRole ? "✅ YES" : "❌ NO");
    console.log();

    // 3. Summary and recommendations
    console.log("📊 DIAGNOSIS SUMMARY:");
    console.log("====================");
    
    if (connectedBadgeAddress.toLowerCase() !== CONTRACT_ADDRESSES.DEVELOPER_BADGE.toLowerCase()) {
      console.log("❌ ISSUE: BountyMarketplace not connected to correct DeveloperBadge contract");
      console.log("🔧 SOLUTION: Call setContractAddresses() on BountyMarketplace");
    }
    
    if (!hasMinterRole) {
      console.log("❌ ISSUE: BountyMarketplace does not have MINTER_ROLE on DeveloperBadge");
      console.log("🔧 SOLUTION: Call setMinterRole() on DeveloperBadge to grant role to BountyMarketplace");
    }
    
    if (connectedBadgeAddress.toLowerCase() === CONTRACT_ADDRESSES.DEVELOPER_BADGE.toLowerCase() && hasMinterRole) {
      console.log("✅ All connections and permissions look correct!");
      console.log("💡 If NFTs still aren't minting, check:");
      console.log("   - Transaction logs for failed mint attempts");
      console.log("   - Ensure verifyAndPayBounty() is being called successfully");
      console.log("   - Check if bounty payment process is completing");
    }
    
    console.log();
    console.log("🔧 MANUAL VERIFICATION COMMANDS:");
    console.log("================================");
    console.log("To fix missing MINTER_ROLE (if needed):");
    console.log(`DeveloperBadge.setMinterRole("${CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE}")`);
    console.log();
    console.log("To fix contract addresses (if needed):");
    console.log(`BountyMarketplace.setContractAddresses(`);
    console.log(`  "${CONTRACT_ADDRESSES.DEVELOPER_BADGE}",`);
    console.log(`  "${CONTRACT_ADDRESSES.DEVELOPER_REPUTATION}",`);
    console.log(`  "${CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER}"`);
    console.log(`)`);

  } catch (error) {
    console.error("❌ Error during verification:", error);
  }
}

checkNFTMintingSetup().catch(console.error);
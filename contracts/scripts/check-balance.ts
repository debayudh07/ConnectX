import { ethers } from "ethers";

const CONTRACT_ADDRESSES = {
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function checkContractBalance() {
  console.log("💰 CHECKING CONTRACT BALANCE");
  console.log("============================\n");

  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  try {
    const balance = await provider.getBalance(CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
    console.log("BountyMarketplace Balance:", ethers.formatEther(balance), "AVAX");
    
    if (Number(ethers.formatEther(balance)) === 0) {
      console.log("❌ CRITICAL ISSUE: Contract has 0 AVAX balance!");
      console.log("💡 SOLUTION: The contract needs AVAX to pay bounties.");
      console.log("   Bounties are created but the contract has no funds to pay developers.");
      console.log("   This is why verifyAndPayBounty() calls are failing.");
    } else {
      console.log("✅ Contract has sufficient balance for payments");
    }
    
  } catch (error) {
    console.error("❌ Error checking balance:", error);
  }
}

checkContractBalance().catch(console.error);
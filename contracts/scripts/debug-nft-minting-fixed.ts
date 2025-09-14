import { ethers } from "ethers";
import hre from "hardhat";

const CONTRACT_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  DEVELOPER_BADGE: '0x04CE909c5688D63C3cB4b7381D367d4bfe5992Be',
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function debugNFTMinting() {
  console.log("🔍 DEBUGGING NFT MINTING ISSUE");
  console.log("===============================\n");

  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  try {
    // Get contract artifacts
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadge");

    // Connect to deployed contracts (read-only)
    const bountyMarketplace = new ethers.Contract(
      CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      marketplaceArtifact.abi,
      provider
    );

    const developerBadge = new ethers.Contract(
      CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      badgeArtifact.abi,
      provider
    );

    console.log("📊 CONTRACT STATE ANALYSIS");
    console.log("==========================");

    // 1. Check total bounties created
    console.log("1️⃣ Checking bounty activity...");
    try {
      const totalBounties = await bountyMarketplace.getTotalBounties();
      console.log("Total Bounties Created:", totalBounties.toString());
      
      if (totalBounties > 0) {
        // Get all bounties
        const allBounties = await bountyMarketplace.getAllBounties();
        console.log(`Found ${allBounties.length} bounties:`);
        
        allBounties.slice(0, 5).forEach((bounty: any, i: number) => {
          console.log(`Bounty ${i + 1}:`, {
            id: bounty.id.toString(),
            status: bounty.status,
            maintainer: bounty.maintainer,
            claimedBy: bounty.claimedBy,
            isCompleted: bounty.isCompleted,
            rewardAmount: ethers.formatEther(bounty.rewardAmount)
          });
        });
      } else {
        console.log("⚠️ No bounties have been created yet!");
      }
    } catch (e) {
      console.log("❌ Error reading bounty data:", e);
    }
    console.log();

    // 2. Check NFT badge stats
    console.log("2️⃣ Checking NFT badge stats...");
    try {
      const totalSupply = await developerBadge.totalSupply();
      console.log("Total NFT badges minted:", totalSupply.toString());
      
      if (totalSupply > 0) {
        console.log("✅ NFT badges ARE being minted!");
        
        // Check some recent badges
        for (let i = 0; i < Math.min(Number(totalSupply), 5); i++) {
          try {
            const tokenId = await developerBadge.tokenByIndex(i);
            const owner = await developerBadge.ownerOf(tokenId);
            const metadata = await developerBadge.badgeMetadata(tokenId);
            
            console.log(`Badge #${tokenId}:`, {
              owner: owner,
              bountyId: metadata.bountyId.toString(),
              badgeType: metadata.badgeType.toString(),
              achievementName: metadata.achievementName
            });
          } catch (e) {
            console.log(`Badge ${i}: Error reading data`);
          }
        }
      } else {
        console.log("❌ No NFT badges have been minted yet!");
      }
    } catch (e) {
      console.log("❌ Error reading NFT data:", e);
    }
    console.log();

    // 3. Check recent events
    console.log("3️⃣ Checking recent events...");
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - 1000, 0); // Last 1000 blocks
      
      console.log(`Searching events from block ${fromBlock} to ${currentBlock}...`);
      
      // Check BountyPaid events
      const paidEvents = await bountyMarketplace.queryFilter(
        bountyMarketplace.filters.BountyPaid(),
        fromBlock,
        currentBlock
      );
      
      console.log(`Found ${paidEvents.length} BountyPaid events:`);
      paidEvents.forEach((event, i) => {
        if ('args' in event) {
          console.log(`  Event ${i + 1}:`, {
            bountyId: event.args[0].toString(),
            developer: event.args[1],
            payment: ethers.formatEther(event.args[2]),
            badgeTokenId: event.args[3].toString()
          });
        }
      });
      
      // Check BadgeMinted events
      const mintEvents = await developerBadge.queryFilter(
        developerBadge.filters.BadgeMinted(),
        fromBlock,
        currentBlock
      );
      
      console.log(`Found ${mintEvents.length} BadgeMinted events:`);
      mintEvents.forEach((event, i) => {
        if ('args' in event) {
          console.log(`  Event ${i + 1}:`, {
            tokenId: event.args[0].toString(),
            developer: event.args[1],
            bountyId: event.args[2].toString(),
            badgeType: event.args[3].toString(),
            achievementName: event.args[4]
          });
        }
      });
      
      // Check BountyVerified events
      const verifiedEvents = await bountyMarketplace.queryFilter(
        bountyMarketplace.filters.BountyVerified(),
        fromBlock,
        currentBlock
      );
      
      console.log(`Found ${verifiedEvents.length} BountyVerified events:`);
      verifiedEvents.forEach((event, i) => {
        if ('args' in event) {
          console.log(`  Event ${i + 1}:`, {
            bountyId: event.args[0].toString(),
            developer: event.args[1],
            verifiedAt: new Date(Number(event.args[2]) * 1000).toLocaleString()
          });
        }
      });
      
    } catch (e) {
      console.log("❌ Error reading events:", e);
    }
    console.log();

    // 4. Provide diagnosis
    console.log("🔬 DIAGNOSIS & RECOMMENDATIONS");
    console.log("==============================");
    
    const totalBounties = await bountyMarketplace.getTotalBounties();
    const totalSupply = await developerBadge.totalSupply();
    
    if (Number(totalBounties) === 0) {
      console.log("❌ ISSUE: No bounties have been created yet");
      console.log("💡 SOLUTION: Create a test bounty to test the minting process");
    } else if (Number(totalSupply) === 0) {
      console.log("❌ ISSUE: Bounties exist but no NFTs have been minted");
      console.log("💡 POSSIBLE CAUSES:");
      console.log("   - Bounties haven't been completed/verified yet");
      console.log("   - verifyAndPayBounty() hasn't been called");
      console.log("   - Minting is failing silently (check transaction logs)");
      console.log("   - Gas limit issues during minting");
    } else {
      console.log("✅ NFT minting appears to be working!");
      console.log("💡 If you're not seeing badges in your UI, check:");
      console.log("   - Frontend NFT display logic");
      console.log("   - Contract ABI updates");
      console.log("   - Wallet NFT refresh");
    }

  } catch (error) {
    console.error("❌ Error during debugging:", error);
  }
}

debugNFTMinting().catch(console.error);
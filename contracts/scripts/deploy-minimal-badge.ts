import { ethers } from "ethers";
import hre from "hardhat";

const EXISTING_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

async function deployMinimalBadge() {
  console.log("🚀 DEPLOYING MINIMAL DEVELOPER BADGE");
  console.log("===================================\n");

  const privateKey = "cacabf3f9c7dfc4ba678bba406847031bb6cbe6725bad9e0d8424f90efbb2a1f";
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log("🔑 Deployer account:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "AVAX\n");

  try {
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    
    console.log("⛽ Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");

    // 1. Deploy the minimal badge contract
    console.log("1️⃣ Deploying DeveloperBadgeMinimal...");
    
    const badgeArtifact = await hre.artifacts.readArtifact("DeveloperBadgeMinimal");
    const BadgeFactory = new ethers.ContractFactory(
      badgeArtifact.abi,
      badgeArtifact.bytecode,
      deployer
    );
    
    const badgeContract = await BadgeFactory.deploy({
      gasPrice: gasPrice,
      gasLimit: 3000000
    });
    
    const deploymentTx = await badgeContract.deploymentTransaction()?.wait();
    const newBadgeAddress = await badgeContract.getAddress();
    
    console.log("✅ DeveloperBadgeMinimal deployed at:", newBadgeAddress);
    console.log("   Gas used:", deploymentTx?.gasUsed.toString());
    console.log();

    // 2. Update BountyMarketplace
    console.log("2️⃣ Updating BountyMarketplace configuration...");
    
    const marketplaceArtifact = await hre.artifacts.readArtifact("BountyMarketplace");
    const bountyMarketplace = new ethers.Contract(
      EXISTING_ADDRESSES.BOUNTY_MARKETPLACE,
      marketplaceArtifact.abi,
      deployer
    );
    
    const updateTx = await bountyMarketplace.setContractAddresses(
      newBadgeAddress,
      EXISTING_ADDRESSES.DEVELOPER_REPUTATION,
      EXISTING_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
      {
        gasPrice: gasPrice,
        gasLimit: 150000
      }
    );
    
    console.log("📤 Update transaction sent:", updateTx.hash);
    await updateTx.wait();
    console.log("✅ BountyMarketplace updated");
    console.log();

    // 3. Grant MINTER_ROLE
    console.log("3️⃣ Granting MINTER_ROLE...");
    
    const grantTx = await badgeContract.setMinterRole(
      EXISTING_ADDRESSES.BOUNTY_MARKETPLACE,
      {
        gasPrice: gasPrice,
        gasLimit: 100000
      }
    );
    
    console.log("📤 Grant role transaction sent:", grantTx.hash);
    await grantTx.wait();
    console.log("✅ MINTER_ROLE granted");
    console.log();

    // 4. Test minimal minting with very low gas
    console.log("4️⃣ Testing minimal minting...");
    
    try {
      const testMintTx = await badgeContract.mintBadge(
        deployer.address,
        999,
        "",
        {
          gasPrice: gasPrice,
          gasLimit: 150000 // Even lower gas limit
        }
      );
      
      console.log("📤 Test mint transaction sent:", testMintTx.hash);
      const receipt = await testMintTx.wait();
      console.log("✅ MINIMAL MINT SUCCESSFUL! Gas used:", receipt.gasUsed.toString());
      
      const totalSupply = await badgeContract.totalSupply();
      console.log("📊 Total supply:", totalSupply.toString());
      
    } catch (e) {
      console.log("❌ Test mint failed:", e);
    }
    console.log();

    console.log("🎉 MINIMAL BADGE DEPLOYMENT COMPLETE!");
    console.log("=====================================");
    console.log("📋 NEW ADDRESS:");
    console.log("DeveloperBadgeMinimal:", newBadgeAddress);
    console.log();
    console.log("✅ Ultra-simplified NFT contract deployed!");
    console.log("🧪 This should work with much lower gas consumption.");

  } catch (error) {
    console.error("❌ Error during deployment:", error);
  }
}

deployMinimalBadge().catch(console.error);
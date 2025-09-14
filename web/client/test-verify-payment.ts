#!/usr/bin/env tsx

/**
 * Test script to verify the verifyAndPayBounty function and role-based access control
 * 
 * This script tests:
 * 1. Role checking functionality 
 * 2. verifyAndPayBounty function with proper error handling
 * 3. Role granting functions
 */

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES } from './contractsABI/contractConfig';

// We'll use a minimal ABI for testing
const BountyMarketplaceABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {"internalType": "address", "name": "account", "type": "address"}],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalBounties",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "verifyAndPayBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {"internalType": "address", "name": "account", "type": "address"}],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Test configuration
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
const TEST_PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!TEST_PRIVATE_KEY) {
  console.error('Please set PRIVATE_KEY environment variable');
  process.exit(1);
}

// Role constants
const ROLE_CONSTANTS = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  MAINTAINER_ROLE: '0x46925e0f0cc76e485772167edccb8dc449d43b23b55fc4e756b063f49099e6a0',
  VERIFIER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
};

async function main() {
  // Setup clients
  const account = privateKeyToAccount(TEST_PRIVATE_KEY as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(RPC_URL)
  });

  console.log('🔍 Testing verifyAndPayBounty function and role management...');
  console.log('Account:', account.address);
  console.log('Contract:', CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
  
  try {
    // Step 1: Check current roles
    console.log('\n📋 Checking current roles...');
    
    const hasAdminRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.ADMIN_ROLE, account.address]
    });

    const hasVerifierRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.VERIFIER_ROLE, account.address]
    });

    console.log('✅ Admin Role:', hasAdminRole);
    console.log('✅ Verifier Role:', hasVerifierRole);

    const canVerify = hasAdminRole || hasVerifierRole;
    console.log('🔐 Can verify bounties:', canVerify);

    // Step 2: Get total bounties to test with
    const totalBounties = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'getTotalBounties'
    });

    console.log('📊 Total bounties:', totalBounties.toString());

    if (totalBounties === BigInt(0)) {
      console.log('⚠️  No bounties found. Please create a bounty first to test verification.');
      return;
    }

    // Step 3: Try to verify the first bounty
    const testBountyId = BigInt(1);
    console.log(`\n🧪 Testing verifyAndPayBounty for bounty ID: ${testBountyId}`);

    if (!canVerify) {
      console.log('❌ Cannot verify: User does not have VERIFIER_ROLE or ADMIN_ROLE');
      
      if (hasAdminRole) {
        console.log('🔧 Granting VERIFIER_ROLE to current account...');
        const grantTx = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
          abi: BountyMarketplaceABI,
          functionName: 'grantRole',
          args: [ROLE_CONSTANTS.VERIFIER_ROLE, account.address]
        });
        
        console.log('⏳ Waiting for role grant transaction...', grantTx);
        await publicClient.waitForTransactionReceipt({ hash: grantTx });
        console.log('✅ VERIFIER_ROLE granted successfully!');
      } else {
        console.log('⚠️  Cannot grant role: User is not an admin');
        console.log('💡 Solution: Ask an admin to grant you VERIFIER_ROLE or ADMIN_ROLE');
        return;
      }
    }

    // Step 4: Attempt to verify the bounty
    console.log('\n🚀 Attempting to call verifyAndPayBounty...');
    
    try {
      // Simulate the transaction first
      await publicClient.simulateContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [testBountyId],
        account: account.address
      });

      console.log('✅ Simulation successful - transaction should work');

      // Execute the actual transaction
      const verifyTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [testBountyId]
      });

      console.log('⏳ Waiting for verification transaction...', verifyTx);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: verifyTx });
      
      console.log('🎉 verifyAndPayBounty executed successfully!');
      console.log('📄 Transaction receipt:', receipt.transactionHash);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

    } catch (simulationError: any) {
      console.error('❌ Transaction simulation failed:', simulationError.message);
      
      if (simulationError.message?.includes('caller is not a verifier or admin')) {
        console.log('🔒 Access Control Error: Make sure you have VERIFIER_ROLE or ADMIN_ROLE');
      } else if (simulationError.message?.includes('bounty not in submitted state')) {
        console.log('📋 Bounty State Error: Bounty must be in SUBMITTED state to verify');
      } else if (simulationError.message?.includes('no submission found')) {
        console.log('📝 Submission Error: No work submission found for this bounty');
      } else {
        console.log('🐛 Unknown error - check bounty state and requirements');
      }
    }

  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Export for testing
export { ROLE_CONSTANTS };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
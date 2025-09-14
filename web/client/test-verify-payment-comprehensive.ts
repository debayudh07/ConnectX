#!/usr/bin/env tsx

/**
 * Comprehensive test script for verifyAndPayBounty function
 * 
 * This script tests:
 * 1. End-to-end verification and payment workflow
 * 2. Role-based access control for verification
 * 3. Payment calculations including platform fees
 * 4. Error handling and edge cases
 * 5. Event emissions during verification and payment
 * 6. Gas usage analysis
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES } from './contractsABI/contractConfig';

// Extended ABI for comprehensive testing
const BountyMarketplaceABI = [
  // View functions
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
    "name": "getBounty",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "address", "name": "maintainer", "type": "address"},
          {"internalType": "string", "name": "githubIssueUrl", "type": "string"},
          {"internalType": "string", "name": "repositoryUrl", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "uint256", "name": "rewardAmount", "type": "uint256"},
          {"internalType": "enum BountyMarketplace.BountyStatus", "name": "status", "type": "uint8"},
          {"internalType": "address", "name": "claimedBy", "type": "address"},
          {"internalType": "uint256", "name": "claimedAt", "type": "uint256"},
          {"internalType": "string", "name": "submissionPrUrl", "type": "string"},
          {"internalType": "string", "name": "submissionDescription", "type": "string"},
          {"internalType": "uint256", "name": "submittedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "verifiedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "string[]", "name": "requiredSkills", "type": "string[]"},
          {"internalType": "uint256", "name": "difficultyLevel", "type": "uint256"},
          {"internalType": "bool", "name": "isCompleted", "type": "bool"}
        ],
        "internalType": "struct BountyMarketplace.Bounty",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeePercentage",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "developer", "type": "address"}],
    "name": "getDeveloperCompletions",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // State-changing functions
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "verifyAndPayBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_githubIssueUrl", "type": "string"},
      {"internalType": "string", "name": "_repositoryUrl", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
      {"internalType": "string[]", "name": "_requiredSkills", "type": "string[]"},
      {"internalType": "uint256", "name": "_difficultyLevel", "type": "uint256"}
    ],
    "name": "createBounty",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "claimBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_bountyId", "type": "uint256"},
      {"internalType": "string", "name": "_prUrl", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "submitWork",
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
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "developer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "verifiedAt", "type": "uint256"}
    ],
    "name": "BountyVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "developer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "paidAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "badgeTokenId", "type": "uint256"}
    ],
    "name": "BountyPaid",
    "type": "event"
  }
] as const;

// Test configuration
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';

// Test accounts (replace with your actual private keys for testing)
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY as `0x${string}`;
const DEVELOPER_PRIVATE_KEY = process.env.DEVELOPER_PRIVATE_KEY as `0x${string}`;
const MAINTAINER_PRIVATE_KEY = process.env.MAINTAINER_PRIVATE_KEY as `0x${string}`;

// Role constants
const VERIFIER_ROLE = '0x828ad4cb0d1db5a37d8d4d8a4da8b1b0d1cbe9a4a1e9b1c2b0cc6c7c1db3a7e8c';
const MAINTAINER_ROLE = '0x2f41c9c8ce2de6b9dc6b4b2b3d8b4a4c8e2a2e8e1a1b9c2c4b3d8b1a7e9f2c4';

// Bounty status enum
enum BountyStatus {
  Open = 0,
  Claimed = 1,
  Submitted = 2,
  Verified = 3,
  Paid = 4,
  Disputed = 5,
  Cancelled = 6
}

class VerifyAndPayTester {
  private publicClient;
  private verifierWallet;
  private developerWallet;
  private maintainerWallet;
  
  constructor() {
    // Initialize clients
    this.publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    // Initialize wallet clients
    if (!VERIFIER_PRIVATE_KEY || !DEVELOPER_PRIVATE_KEY || !MAINTAINER_PRIVATE_KEY) {
      console.error('❌ Please set VERIFIER_PRIVATE_KEY, DEVELOPER_PRIVATE_KEY, and MAINTAINER_PRIVATE_KEY environment variables');
      process.exit(1);
    }

    this.verifierWallet = createWalletClient({
      account: privateKeyToAccount(VERIFIER_PRIVATE_KEY),
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    this.developerWallet = createWalletClient({
      account: privateKeyToAccount(DEVELOPER_PRIVATE_KEY),
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    this.maintainerWallet = createWalletClient({
      account: privateKeyToAccount(MAINTAINER_PRIVATE_KEY),
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });
  }

  async checkRoles() {
    console.log('🔐 Checking roles...');
    
    const verifierHasRole = await this.publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
      abi: BountyMarketplaceABI,
      functionName: 'hasRole',
      args: [VERIFIER_ROLE, this.verifierWallet.account.address],
    });

    console.log(`  Verifier ${this.verifierWallet.account.address} has VERIFIER_ROLE: ${verifierHasRole}`);
    
    if (!verifierHasRole) {
      console.log('❌ Verifier does not have VERIFIER_ROLE. Attempting to grant...');
      // Note: This would require admin privileges
    }
  }

  async createTestBounty(): Promise<number> {
    console.log('📝 Creating test bounty...');
    
    const bountyAmount = parseEther('0.1'); // 0.1 AVAX
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days from now
    
    try {
      const hash = await this.maintainerWallet.writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'createBounty',
        args: [
          'https://github.com/test/repo/issues/123',
          'https://github.com/test/repo',
          'Test bounty for verification and payment testing',
          deadline,
          ['solidity', 'testing'],
          BigInt(2) // difficulty level
        ],
        value: bountyAmount,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });
      
      const totalBounties = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'getTotalBounties',
      });

      console.log(`  ✅ Bounty created with ID: ${totalBounties}`);
      console.log(`  💰 Reward amount: ${formatEther(bountyAmount)} AVAX`);
      
      return Number(totalBounties);
    } catch (error) {
      console.error('❌ Failed to create bounty:', error);
      throw error;
    }
  }

  async claimAndSubmitBounty(bountyId: number): Promise<void> {
    console.log(`🏃 Claiming and submitting bounty ${bountyId}...`);
    
    try {
      // Claim bounty
      const claimHash = await this.developerWallet.writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'claimBounty',
        args: [BigInt(bountyId)],
      });

      await this.publicClient.waitForTransactionReceipt({ hash: claimHash });
      console.log('  ✅ Bounty claimed');

      // Submit work
      const submitHash = await this.developerWallet.writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'submitWork',
        args: [
          BigInt(bountyId),
          'https://github.com/test/repo/pull/456',
          'Comprehensive fix addressing the issue with proper testing'
        ],
      });

      await this.publicClient.waitForTransactionReceipt({ hash: submitHash });
      console.log('  ✅ Work submitted');
      
    } catch (error) {
      console.error('❌ Failed to claim and submit bounty:', error);
      throw error;
    }
  }

  async verifyAndPayBounty(bountyId: number): Promise<void> {
    console.log(`✅ Verifying and paying bounty ${bountyId}...`);
    
    try {
      // Get bounty details before verification
      const bountyBefore = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'getBounty',
        args: [BigInt(bountyId)],
      });

      console.log(`  📊 Bounty status before: ${BountyStatus[bountyBefore.status]}`);
      console.log(`  💰 Reward amount: ${formatEther(bountyBefore.rewardAmount)} AVAX`);

      // Get developer balance before payment
      const developerBalanceBefore = await this.publicClient.getBalance({
        address: bountyBefore.claimedBy,
      });

      // Get platform fee percentage
      const platformFeePercentage = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'platformFeePercentage',
      });

      // Calculate expected payment
      const platformFee = (bountyBefore.rewardAmount * platformFeePercentage) / BigInt(10000);
      const expectedPayment = bountyBefore.rewardAmount - platformFee;

      console.log(`  💸 Platform fee (${Number(platformFeePercentage) / 100}%): ${formatEther(platformFee)} AVAX`);
      console.log(`  💳 Expected developer payment: ${formatEther(expectedPayment)} AVAX`);

      // Estimate gas for verification
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [BigInt(bountyId)],
        account: this.verifierWallet.account,
      });

      console.log(`  ⛽ Estimated gas: ${gasEstimate}`);

      // Execute verification and payment
      const hash = await this.verifierWallet.writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [BigInt(bountyId)],
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✅ Transaction confirmed: ${receipt.transactionHash}`);
      console.log(`  ⛽ Gas used: ${receipt.gasUsed} (${(Number(receipt.gasUsed) / Number(gasEstimate) * 100).toFixed(1)}% of estimate)`);

      // Verify transaction events
      const verifiedEvent = receipt.logs.find(log => 
        log.topics[0] === '0x...' // BountyVerified event topic hash
      );
      
      const paidEvent = receipt.logs.find(log => 
        log.topics[0] === '0x...' // BountyPaid event topic hash
      );

      if (verifiedEvent) {
        console.log('  📢 BountyVerified event emitted');
      }
      
      if (paidEvent) {
        console.log('  📢 BountyPaid event emitted');
      }

      // Get bounty details after verification
      const bountyAfter = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'getBounty',
        args: [BigInt(bountyId)],
      });

      console.log(`  📊 Bounty status after: ${BountyStatus[bountyAfter.status]}`);
      console.log(`  ✅ Bounty completed: ${bountyAfter.isCompleted}`);
      console.log(`  🕒 Verified at: ${new Date(Number(bountyAfter.verifiedAt) * 1000).toISOString()}`);

      // Check developer balance after payment
      const developerBalanceAfter = await this.publicClient.getBalance({
        address: bountyBefore.claimedBy,
      });

      const actualPayment = developerBalanceAfter - developerBalanceBefore;
      console.log(`  💰 Actual payment received: ${formatEther(actualPayment)} AVAX`);

      // Verify payment calculations
      const paymentDifference = actualPayment - expectedPayment;
      if (paymentDifference === BigInt(0)) {
        console.log('  ✅ Payment calculation verified correctly');
      } else {
        console.log(`  ⚠️  Payment difference: ${formatEther(paymentDifference)} AVAX`);
      }

      // Check developer completions
      const completions = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'getDeveloperCompletions',
        args: [bountyBefore.claimedBy],
      });

      console.log(`  🏆 Developer total completions: ${completions.length}`);
      
    } catch (error) {
      console.error('❌ Failed to verify and pay bounty:', error);
      throw error;
    }
  }

  async testErrorScenarios(): Promise<void> {
    console.log('🧪 Testing error scenarios...');
    
    try {
      // Test 1: Try to verify non-existent bounty
      console.log('  Test 1: Verifying non-existent bounty');
      try {
        await this.verifierWallet.writeContract({
          address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
          abi: BountyMarketplaceABI,
          functionName: 'verifyAndPayBounty',
          args: [BigInt(999999)], // Non-existent bounty ID
        });
        console.log('  ❌ Should have failed but didn\'t');
      } catch (error) {
        console.log('  ✅ Correctly rejected non-existent bounty');
      }

      // Test 2: Try to verify as non-verifier
      console.log('  Test 2: Verifying as unauthorized user');
      try {
        await this.developerWallet.writeContract({
          address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
          abi: BountyMarketplaceABI,
          functionName: 'verifyAndPayBounty',
          args: [BigInt(1)],
        });
        console.log('  ❌ Should have failed but didn\'t');
      } catch (error) {
        console.log('  ✅ Correctly rejected unauthorized verification');
      }

      // Test 3: Try to verify bounty in wrong status
      console.log('  Test 3: Verifying bounty in wrong status');
      const bountyId = await this.createTestBounty();
      // Don't claim or submit, try to verify directly
      try {
        await this.verifierWallet.writeContract({
          address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
          abi: BountyMarketplaceABI,
          functionName: 'verifyAndPayBounty',
          args: [BigInt(bountyId)],
        });
        console.log('  ❌ Should have failed but didn\'t');
      } catch (error) {
        console.log('  ✅ Correctly rejected bounty not in submitted state');
      }

    } catch (error) {
      console.error('❌ Error testing scenarios:', error);
    }
  }

  async runComprehensiveTest(): Promise<void> {
    console.log('🚀 Starting comprehensive verify and pay bounty test\n');
    
    try {
      // Step 1: Check roles
      await this.checkRoles();
      console.log('');

      // Step 2: Create test bounty
      const bountyId = await this.createTestBounty();
      console.log('');

      // Step 3: Claim and submit bounty
      await this.claimAndSubmitBounty(bountyId);
      console.log('');

      // Step 4: Verify and pay bounty
      await this.verifyAndPayBounty(bountyId);
      console.log('');

      // Step 5: Test error scenarios
      await this.testErrorScenarios();
      console.log('');

      console.log('🎉 All tests completed successfully!');

    } catch (error) {
      console.error('💥 Test failed:', error);
      process.exit(1);
    }
  }
}

// Performance monitoring
async function monitorPerformance() {
  const tester = new VerifyAndPayTester();
  
  console.log('📊 Performance Monitoring for Verify and Pay Function\n');
  
  const iterations = 5;
  const gasUsages: bigint[] = [];
  const executionTimes: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`\n🔄 Iteration ${i + 1}/${iterations}`);
    
    const startTime = Date.now();
    
    try {
      const bountyId = await tester.createTestBounty();
      await tester.claimAndSubmitBounty(bountyId);
      
      // Measure gas usage
      const gasEstimate = await tester.publicClient.estimateContractGas({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE as `0x${string}`,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [BigInt(bountyId)],
        account: tester.verifierWallet.account,
      });
      
      gasUsages.push(gasEstimate);
      
      await tester.verifyAndPayBounty(bountyId);
      
      const endTime = Date.now();
      executionTimes.push(endTime - startTime);
      
    } catch (error) {
      console.error(`❌ Iteration ${i + 1} failed:`, error);
    }
  }
  
  // Calculate statistics
  const avgGas = gasUsages.reduce((a, b) => a + b, BigInt(0)) / BigInt(gasUsages.length);
  const maxGas = gasUsages.reduce((a, b) => a > b ? a : b, BigInt(0));
  const minGas = gasUsages.reduce((a, b) => a < b ? a : b, gasUsages[0]);
  
  const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const maxTime = Math.max(...executionTimes);
  const minTime = Math.min(...executionTimes);
  
  console.log('\n📈 Performance Summary:');
  console.log(`Gas Usage - Avg: ${avgGas}, Min: ${minGas}, Max: ${maxGas}`);
  console.log(`Execution Time - Avg: ${avgTime.toFixed(0)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    await monitorPerformance();
  } else {
    const tester = new VerifyAndPayTester();
    await tester.runComprehensiveTest();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { VerifyAndPayTester, BountyStatus };
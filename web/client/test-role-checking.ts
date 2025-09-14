#!/usr/bin/env tsx

/**
 * Quick role verification test script
 * Run this to test role checking functionality
 */

import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CONTRACT_ADDRESSES } from './contractsABI/contractConfig';

// Minimal ABI for role checking
const RoleCheckABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {"internalType": "address", "name": "account", "type": "address"}],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERIFIER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Role constants
const ROLE_CONSTANTS = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  MAINTAINER_ROLE: '0x46925e0f0cc76e485772167edccb8dc449d43b23b55fc4e756b063f49099e6a0',
  VERIFIER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
} as const;

async function testRoleChecking(testAddress: string) {
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http('https://api.avax-test.network/ext/bc/C/rpc')
  });

  console.log('🔍 Testing role checking for address:', testAddress);
  console.log('📍 Contract:', CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE);
  
  try {
    // Test each role
    const hasDefaultAdminRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: RoleCheckABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.DEFAULT_ADMIN_ROLE as `0x${string}`, testAddress as `0x${string}`]
    });

    const hasAdminRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: RoleCheckABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.ADMIN_ROLE as `0x${string}`, testAddress as `0x${string}`]
    });

    const hasMaintainerRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: RoleCheckABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.MAINTAINER_ROLE as `0x${string}`, testAddress as `0x${string}`]
    });

    const hasVerifierRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: RoleCheckABI,
      functionName: 'hasRole',
      args: [ROLE_CONSTANTS.VERIFIER_ROLE as `0x${string}`, testAddress as `0x${string}`]
    });

    console.log('\n📋 Role Check Results:');
    console.log('✅ DEFAULT_ADMIN_ROLE:', hasDefaultAdminRole);
    console.log('🔧 ADMIN_ROLE:', hasAdminRole);
    console.log('👨‍💼 MAINTAINER_ROLE:', hasMaintainerRole);
    console.log('✔️ VERIFIER_ROLE:', hasVerifierRole);

    const canVerify = hasVerifierRole || hasAdminRole;
    console.log('\n🔐 Can verify bounties:', canVerify);

    if (!canVerify && hasAdminRole) {
      console.log('💡 Can auto-grant VERIFIER_ROLE (has admin permissions)');
    } else if (!canVerify) {
      console.log('⚠️ Cannot verify - needs role grant from admin');
    }

    return {
      hasDefaultAdminRole,
      hasAdminRole,
      hasMaintainerRole,
      hasVerifierRole,
      canVerify
    };

  } catch (error) {
    console.error('❌ Error checking roles:', error);
    throw error;
  }
}

// Test with a sample address (replace with actual address)
const TEST_ADDRESS = '0x742d35Cc6670C02797Cc5B6b78A93C5407Ee5E8A'; // Replace with actual address

if (require.main === module) {
  testRoleChecking(TEST_ADDRESS)
    .then(results => {
      console.log('\n🎉 Role checking test completed successfully!');
      console.log('Results:', results);
    })
    .catch(error => {
      console.error('💥 Role checking test failed:', error);
    });
}

export { testRoleChecking, ROLE_CONSTANTS };
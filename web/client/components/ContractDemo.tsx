// ConnectX Contract Demo Component
// Shows how to interact with deployed contracts

'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Import contract configuration
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../contractsABI/contractConfig';
import type { BountyStructure, DeveloperStats } from '../contractsABI/contractTypes';

// Import ABIs - Note: You may need to copy these from the JSON files manually
// or configure TypeScript to handle JSON imports properly
import BountyMarketplaceABI from '../contractsABI/bountyMarketplace.json';
import DeveloperReputationABI from '../contractsABI/developerReputation.json';

interface ContractDemoProps {
  className?: string;
}

export default function ContractDemo({ className = '' }: ContractDemoProps) {
  const { address, isConnected } = useAccount();
  const [bountyId, setBountyId] = useState<string>('1');
  const [bountyTitle, setBountyTitle] = useState<string>('');
  const [bountyDescription, setBountyDescription] = useState<string>('');
  const [bountyReward, setBountyReward] = useState<string>('0.1');

  // Read contract data
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'bountyCounter',
  });

  const { data: bountyData, isLoading: bountyLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getBounty',
    args: [BigInt(bountyId)],
  }) as { data: BountyStructure | undefined, isLoading: boolean };

  const { data: developerStats, isLoading: statsLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
    abi: DeveloperReputationABI,
    functionName: 'getDeveloperStats',
    args: [address],
    enabled: !!address,
  }) as { data: DeveloperStats | undefined, isLoading: boolean };

  // Write contract functions
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createBounty = async () => {
    if (!bountyTitle || !bountyDescription || !bountyReward) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
      const skills = ['javascript', 'react'];
      const verifierContract = CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER;

      await writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
        abi: BountyMarketplaceABI,
        functionName: 'createBounty',
        args: [bountyTitle, bountyDescription, deadline, skills, verifierContract],
        value: parseEther(bountyReward),
      });
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Error creating bounty. Check console for details.');
    }
  };

  const claimBounty = async () => {
    if (!bountyId) return;

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
        abi: BountyMarketplaceABI,
        functionName: 'claimBounty',
        args: [BigInt(bountyId)],
      });
    } catch (error) {
      console.error('Error claiming bounty:', error);
      alert('Error claiming bounty. Check console for details.');
    }
  };

  if (!isConnected) {
    return (
      <div className={`p-6 bg-gray-100 rounded-lg ${className}`}>
        <h2 className="text-2xl font-bold mb-4">ConnectX Contract Demo</h2>
        <p className="text-gray-600">Please connect your wallet to interact with contracts.</p>
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}</p>
          <p><strong>Chain ID:</strong> {NETWORK_CONFIG.CHAIN_ID}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6">ConnectX Contract Demo</h2>

      {/* Network Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Network Information</h3>
        <p><strong>Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}</p>
        <p><strong>Chain ID:</strong> {NETWORK_CONFIG.CHAIN_ID}</p>
        <p><strong>Total Bounties:</strong> {bountyCounter?.toString() || 'Loading...'}</p>
      </div>

      {/* Developer Stats */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Your Developer Stats</h3>
        {statsLoading ? (
          <p>Loading stats...</p>
        ) : developerStats ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total Score:</strong> {developerStats.totalScore.toString()}</p>
              <p><strong>Bounty Completions:</strong> {developerStats.bountyCompletions.toString()}</p>
            </div>
            <div>
              <p><strong>Current Streak:</strong> {developerStats.currentStreak.toString()}</p>
              <p><strong>Tier:</strong> {developerStats.tier.toString()}</p>
            </div>
          </div>
        ) : (
          <p>No stats available</p>
        )}
      </div>

      {/* Create Bounty */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Create New Bounty</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Bounty title"
            value={bountyTitle}
            onChange={(e) => setBountyTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Bounty description"
            value={bountyDescription}
            onChange={(e) => setBountyDescription(e.target.value)}
            className="w-full p-2 border rounded h-20"
          />
          <input
            type="number"
            placeholder="Reward in AVAX"
            value={bountyReward}
            onChange={(e) => setBountyReward(e.target.value)}
            step="0.01"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={createBounty}
            disabled={isPending || isConfirming}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending || isConfirming ? 'Creating...' : 'Create Bounty'}
          </button>
        </div>
      </div>

      {/* View Bounty */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">View Bounty</h3>
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Bounty ID"
            value={bountyId}
            onChange={(e) => setBountyId(e.target.value)}
            className="w-full p-2 border rounded"
          />
          {bountyLoading ? (
            <p>Loading bounty...</p>
          ) : bountyData ? (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold">{bountyData.title}</h4>
              <p className="text-gray-600">{bountyData.description}</p>
              <p><strong>Reward:</strong> {formatEther(bountyData.reward)} AVAX</p>
              <p><strong>Status:</strong> {bountyData.status.toString()}</p>
              <p><strong>Issuer:</strong> {bountyData.issuer}</p>
              {bountyData.claimedBy !== '0x0000000000000000000000000000000000000000' && (
                <p><strong>Claimed By:</strong> {bountyData.claimedBy}</p>
              )}
              <button
                onClick={claimBounty}
                disabled={isPending || isConfirming || bountyData.status !== 0}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isPending || isConfirming ? 'Claiming...' : 'Claim Bounty'}
              </button>
            </div>
          ) : (
            <p>Bounty not found</p>
          )}
        </div>
      </div>

      {/* Transaction Status */}
      {hash && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Transaction Status</h3>
          <p><strong>Hash:</strong> {hash}</p>
          <p><strong>Status:</strong> {isConfirming ? 'Confirming...' : isConfirmed ? 'Confirmed!' : 'Pending'}</p>
          <a
            href={`${NETWORK_CONFIG.BLOCK_EXPLORER}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View on Explorer
          </a>
        </div>
      )}

      {/* Contract Addresses */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Contract Addresses</h3>
        <div className="text-sm space-y-1">
          <p><strong>BountyMarketplace:</strong> {CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE}</p>
          <p><strong>DeveloperReputation:</strong> {CONTRACT_ADDRESSES.DEVELOPER_REPUTATION}</p>
          <p><strong>DeveloperBadge:</strong> {CONTRACT_ADDRESSES.DEVELOPER_BADGE}</p>
          <p><strong>SimpleBountyVerifier:</strong> {CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER}</p>
        </div>
      </div>
    </div>
  );
}
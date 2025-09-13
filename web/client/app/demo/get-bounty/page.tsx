'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useGetBounty, useBountyMarketplace, useTransactionStatus } from '../../../contractsABI/contractHooks';
import BountyDetails from '../../../components/BountyDetails';

export default function GetBountyDemo() {
  const { isConnected } = useAccount();
  const [bountyId, setBountyId] = useState<string>('1');
  const { claimBounty, hash, isPending } = useBountyMarketplace();
  const { isConfirming, isConfirmed } = useTransactionStatus(hash);

  const handleClaimBounty = async (bountyId: bigint) => {
    try {
      await claimBounty({ bountyId });
    } catch (error) {
      console.error('Error claiming bounty:', error);
      alert('Error claiming bounty. Check console for details.');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">getBounty Function Demo</h1>
            <p className="text-gray-600">Please connect your wallet to view bounties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">getBounty Function Demo</h1>
        
        <p className="text-gray-600 mb-6">
          This demo shows how to use the <code className="bg-gray-100 px-2 py-1 rounded">useGetBounty</code> hook 
          to fetch bounty details using the contract's <code className="bg-gray-100 px-2 py-1 rounded">getBounty</code> function.
        </p>

        {/* Success Message */}
        {isConfirmed && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Bounty Claimed Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">Transaction hash: {hash}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bounty ID Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Bounty ID</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="bountyId" className="block text-sm font-medium text-gray-700 mb-2">
                Bounty ID
              </label>
              <input
                type="number"
                id="bountyId"
                value={bountyId}
                onChange={(e) => setBountyId(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter bounty ID (e.g., 1)"
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-gray-500 p-2">
                Current ID: {bountyId || 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hook Usage Example</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            <code>{`// Import the hook
import { useGetBounty } from '../contractsABI/contractHooks';

// Use in your component
const { bounty, isLoading, error, refetch } = useGetBounty(BigInt(${bountyId || '1'}));

// Access bounty data
if (bounty) {
  console.log('Bounty Title:', bounty.title);
  console.log('Reward:', formatEther(bounty.reward), 'AVAX');
  console.log('Status:', bounty.status);
  console.log('Skills:', bounty.skillsRequired);
}`}</code>
          </pre>
        </div>

        {/* Bounty Details */}
        {bountyId && (
          <BountyDetails
            bountyId={BigInt(bountyId)}
            onClaim={handleClaimBounty}
            showActions={true}
          />
        )}

        {/* Loading/Pending States */}
        {(isPending || isConfirming) && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-700">
                {isPending ? 'Submitting transaction...' : 'Confirming transaction...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
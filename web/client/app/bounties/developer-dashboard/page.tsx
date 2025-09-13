'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
  useBountyData, 
  useTotalBounties, 
  useDeveloperClaims, 
  useDeveloperCompletions, 
  useBountySubmissions 
} from '../../../contractsABI/contractHooks';
import { NETWORK_CONFIG } from '../../../contractsABI/contractConfig';

export default function DeveloperDashboardPage() {
  const { address, isConnected } = useAccount();
  
  // Get total bounties count
  const { totalBounties, isLoading: loadingTotal } = useTotalBounties();
  
  // Get developer's claimed and completed bounties
  const { claimedBountyIds, isLoading: loadingClaims } = useDeveloperClaims(address || '0x0');
  const { completedBountyIds, isLoading: loadingCompletions } = useDeveloperCompletions(address || '0x0');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Developer Dashboard</h1>
            <p className="text-gray-600 mb-6">Please connect your wallet to view your dashboard</p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}<br/>
                <strong>Chain ID:</strong> {NETWORK_CONFIG.CHAIN_ID}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Developer Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bounties</h3>
            <p className="text-3xl font-bold text-blue-600">
              {loadingTotal ? '...' : totalBounties?.toString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Claimed</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {loadingClaims ? '...' : claimedBountyIds?.length.toString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-green-600">
              {loadingCompletions ? '...' : completedBountyIds?.length.toString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Rate</h3>
            <p className="text-3xl font-bold text-purple-600">
              {(() => {
                if (loadingClaims || loadingCompletions) return '...';
                const claimed = claimedBountyIds?.length || 0;
                const completed = completedBountyIds?.length || 0;
                return claimed > 0 ? Math.round((completed / claimed) * 100) : 0;
              })()}%
            </p>
          </div>
        </div>

        {/* Your Address */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Wallet Address</p>
              <p className="text-sm text-gray-600 break-all">{address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Network</p>
              <p className="text-sm text-gray-600">{NETWORK_CONFIG.NETWORK_NAME} (Chain ID: {NETWORK_CONFIG.CHAIN_ID})</p>
            </div>
          </div>
        </div>

        {/* Claimed Bounties */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Claimed Bounties</h3>
          {loadingClaims ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading claimed bounties...</p>
            </div>
          ) : !claimedBountyIds || claimedBountyIds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't claimed any bounties yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Browse available bounties to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {claimedBountyIds.map((bountyId, index) => (
                <BountyCard key={index} bountyId={bountyId} type="claimed" />
              ))}
            </div>
          )}
        </div>

        {/* Completed Bounties */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Completed Bounties</h3>
          {loadingCompletions ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading completed bounties...</p>
            </div>
          ) : !completedBountyIds || completedBountyIds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't completed any bounties yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete claimed bounties to earn rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedBountyIds.map((bountyId, index) => (
                <BountyCard key={index} bountyId={bountyId} type="completed" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to display individual bounty cards
function BountyCard({ bountyId, type }: { bountyId: bigint; type: 'claimed' | 'completed' }) {
  const { bounty, isLoading } = useBountyData(bountyId);
  const { submissions } = useBountySubmissions(bountyId);

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-gray-500">Bounty #{bountyId.toString()} not found</p>
      </div>
    );
  }

  const getBadgeColor = (type: string) => {
    return type === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">#{bountyId.toString()}: {bounty.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{bounty.description}</p>
        </div>
        <div className="ml-4 text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(type)}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <p className="text-lg font-semibold text-green-600 mt-1">
            {formatEther(bounty.reward)} AVAX
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          <span>Deadline: {new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}</span>
        </div>
        <div>
          {submissions && submissions.length > 0 && (
            <span>{submissions.length} submission(s)</span>
          )}
        </div>
      </div>
    </div>
  );
}
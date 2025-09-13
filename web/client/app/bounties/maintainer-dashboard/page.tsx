'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
  useBountyData, 
  useTotalBounties, 
  useMaintainerBounties, 
  useBountySubmissions 
} from '../../../contractsABI/contractHooks';
import { NETWORK_CONFIG } from '../../../contractsABI/contractConfig';
import { BOUNTY_STATUS } from '../../../contractsABI/contractTypes';

export default function MaintainerDashboardPage() {
  const { address, isConnected } = useAccount();
  
  // Get total bounties count
  const { totalBounties, isLoading: loadingTotal } = useTotalBounties();
  
  // Get maintainer's bounties
  const { bountyIds, isLoading: loadingBounties } = useMaintainerBounties(address || '0x0');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Maintainer Dashboard</h1>
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

  // Calculate statistics
  const totalCreated = bountyIds?.length || 0;
  const totalValueLocked = bountyIds?.reduce((acc, bountyId) => {
    // We would need individual bounty data to calculate this properly
    return acc;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Maintainer Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bounties Created</h3>
            <p className="text-3xl font-bold text-blue-600">
              {loadingBounties ? '...' : totalCreated.toString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Total</h3>
            <p className="text-3xl font-bold text-green-600">
              {loadingTotal ? '...' : totalBounties?.toString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Contribution</h3>
            <p className="text-3xl font-bold text-purple-600">
              {(() => {
                if (loadingTotal || loadingBounties) return '...';
                const total = Number(totalBounties) || 0;
                return total > 0 ? Math.round((totalCreated / total) * 100) : 0;
              })()}%
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintainer Address</p>
              <p className="text-sm text-gray-600 break-all">{address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Network</p>
              <p className="text-sm text-gray-600">{NETWORK_CONFIG.NETWORK_NAME} (Chain ID: {NETWORK_CONFIG.CHAIN_ID})</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/bounties/create-bounties"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Create New Bounty
            </a>
            <a
              href="/bounties/view-bounties"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
            >
              Browse All Bounties
            </a>
          </div>
        </div>

        {/* Your Bounties */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Bounties</h3>
          {loadingBounties ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading your bounties...</p>
            </div>
          ) : !bountyIds || bountyIds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't created any bounties yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first bounty to get started!
              </p>
              <a
                href="/bounties/create-bounties"
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Create Your First Bounty
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bountyIds.map((bountyId, index) => (
                <MaintainerBountyCard key={index} bountyId={bountyId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to display individual bounty cards for maintainers
function MaintainerBountyCard({ bountyId }: { bountyId: bigint }) {
  const { bounty, isLoading } = useBountyData(bountyId);
  const { submissions, isLoading: loadingSubmissions } = useBountySubmissions(bountyId);
  const [showSubmissions, setShowSubmissions] = useState(false);

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">Bounty #{bountyId.toString()} not found</p>
      </div>
    );
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'Open';
      case BOUNTY_STATUS.CLAIMED: return 'Claimed';
      case BOUNTY_STATUS.COMPLETED: return 'Completed';
      case BOUNTY_STATUS.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'bg-green-100 text-green-800';
      case BOUNTY_STATUS.CLAIMED: return 'bg-yellow-100 text-yellow-800';
      case BOUNTY_STATUS.COMPLETED: return 'bg-blue-100 text-blue-800';
      case BOUNTY_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-xl font-semibold text-gray-900">
              Bounty #{bountyId.toString()}
            </h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status)}`}>
              {getStatusText(bounty.status)}
            </span>
          </div>
          <h5 className="text-lg font-medium text-gray-800 mb-2">{bounty.title}</h5>
          <p className="text-gray-600 mb-3">{bounty.description}</p>
        </div>
        <div className="ml-6 text-right">
          <p className="text-2xl font-bold text-green-600">
            {formatEther(bounty.reward)} AVAX
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Deadline:</span><br/>
          {new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">Claimed By:</span><br/>
          {bounty.claimedBy !== '0x0000000000000000000000000000000000000000' 
            ? `${bounty.claimedBy.slice(0, 6)}...${bounty.claimedBy.slice(-4)}` 
            : 'Not claimed'}
        </div>
        <div>
          <span className="font-medium">Submissions:</span><br/>
          {loadingSubmissions ? 'Loading...' : (submissions?.length || 0)} submission(s)
        </div>
      </div>

      {/* Skills Required */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700 mb-2 block">Skills Required:</span>
        <div className="flex flex-wrap gap-2">
          {bounty.skillsRequired.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Submissions Toggle */}
      {submissions && submissions.length > 0 && (
        <div>
          <button
            onClick={() => setShowSubmissions(!showSubmissions)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showSubmissions ? 'Hide' : 'Show'} Submissions ({submissions.length})
          </button>
          
          {showSubmissions && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h6 className="text-sm font-medium text-gray-700 mb-3">Submissions:</h6>
              <div className="space-y-3">
                {submissions.map((submission, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Developer: {submission.developer.slice(0, 6)}...{submission.developer.slice(-4)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                        {submission.prUrl && (
                          <a 
                            href={submission.prUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                          >
                            View PR →
                          </a>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(Number(submission.submittedAt) * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
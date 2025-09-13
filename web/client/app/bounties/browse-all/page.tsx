'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAllBounties, useBountiesByStatus } from '../../../contractsABI/contractHooks';
import { BOUNTY_STATUS } from '../../../contractsABI/contractTypes';

export default function BrowseAllBountiesPage() {
  const { address, isConnected } = useAccount();
  const [selectedStatus, setSelectedStatus] = useState<number | 'all'>('all');
  
  // Contract hooks
  const { bounties: allBounties, isLoading: loadingAll } = useAllBounties();
  const { bounties: filteredBounties, isLoading: loadingFiltered } = useBountiesByStatus(
    selectedStatus !== 'all' ? selectedStatus : 0
  );

  const bountiesToShow = selectedStatus === 'all' ? allBounties : filteredBounties;
  const isLoading = selectedStatus === 'all' ? loadingAll : loadingFiltered;

  const getStatusText = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'Open';
      case BOUNTY_STATUS.CLAIMED: return 'Claimed';
      case BOUNTY_STATUS.SUBMITTED: return 'Submitted';
      case BOUNTY_STATUS.VERIFIED: return 'Verified';
      case BOUNTY_STATUS.PAID: return 'Paid';
      case BOUNTY_STATUS.DISPUTED: return 'Disputed';
      case BOUNTY_STATUS.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'bg-green-100 text-green-800';
      case BOUNTY_STATUS.CLAIMED: return 'bg-yellow-100 text-yellow-800';
      case BOUNTY_STATUS.SUBMITTED: return 'bg-blue-100 text-blue-800';
      case BOUNTY_STATUS.VERIFIED: return 'bg-purple-100 text-purple-800';
      case BOUNTY_STATUS.PAID: return 'bg-emerald-100 text-emerald-800';
      case BOUNTY_STATUS.DISPUTED: return 'bg-orange-100 text-orange-800';
      case BOUNTY_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8">Please connect your wallet to browse bounties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse All Bounties</h1>
          <p className="text-gray-600 mt-2">Discover and claim bounties from the ConnectX marketplace</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Status</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Bounties
            </button>
            {Object.entries(BOUNTY_STATUS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedStatus === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusText(value)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading bounties...
            </div>
          </div>
        )}

        {/* Bounties Grid */}
        {!isLoading && bountiesToShow && bountiesToShow.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bountiesToShow.map((bounty) => (
              <div key={bounty.id.toString()} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bounty #{bounty.id.toString()}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bounty.status)}`}>
                      {getStatusText(bounty.status)}
                    </span>
                  </div>

                  {/* Reward Amount */}
                  <div className="text-2xl font-bold text-green-600 mb-4">
                    {Number(bounty.rewardAmount) / 1e18} AVAX
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {bounty.description}
                  </p>

                  {/* GitHub Links */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs text-gray-500">Issue:</span>
                      <a 
                        href={bounty.githubIssueUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline ml-2 break-all"
                      >
                        {bounty.githubIssueUrl.length > 40 
                          ? `${bounty.githubIssueUrl.substring(0, 40)}...` 
                          : bounty.githubIssueUrl}
                      </a>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Repo:</span>
                      <a 
                        href={bounty.repositoryUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline ml-2 break-all"
                      >
                        {bounty.repositoryUrl.length > 40 
                          ? `${bounty.repositoryUrl.substring(0, 40)}...` 
                          : bounty.repositoryUrl}
                      </a>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 block mb-2">Required Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {bounty.requiredSkills && bounty.requiredSkills.length > 0 ? (
                        bounty.requiredSkills.slice(0, 3).map((skill: string, index: number) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No specific skills</span>
                      )}
                      {bounty.requiredSkills && bounty.requiredSkills.length > 3 && (
                        <span className="text-gray-500 text-xs">+{bounty.requiredSkills.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <span>Difficulty: {bounty.difficultyLevel.toString()}/5</span>
                    <span>
                      {Number(bounty.deadline) * 1000 > Date.now() ? (
                        `${Math.ceil((Number(bounty.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                      ) : (
                        'Expired'
                      )}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-200">
                    {bounty.status === BOUNTY_STATUS.OPEN && (
                      <a 
                        href={`/bounties/view-bounties?id=${bounty.id}`}
                        className="block w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium text-center"
                      >
                        View & Claim
                      </a>
                    )}
                    {bounty.status === BOUNTY_STATUS.CLAIMED && bounty.claimedBy.toLowerCase() === address?.toLowerCase() && (
                      <a 
                        href={`/bounties/view-bounties?id=${bounty.id}`}
                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                      >
                        Submit Work
                      </a>
                    )}
                    {bounty.status === BOUNTY_STATUS.PAID && (
                      <div className="text-center">
                        <span className="text-green-600 font-medium text-sm">✅ Completed</span>
                      </div>
                    )}
                    {(bounty.status === BOUNTY_STATUS.CANCELLED || bounty.status === BOUNTY_STATUS.DISPUTED) && (
                      <div className="text-center">
                        <span className="text-red-600 font-medium text-sm">❌ Not Available</span>
                      </div>
                    )}
                    {![BOUNTY_STATUS.OPEN, BOUNTY_STATUS.CLAIMED, BOUNTY_STATUS.PAID, BOUNTY_STATUS.CANCELLED, BOUNTY_STATUS.DISPUTED].includes(bounty.status as any) && (
                      <a 
                        href={`/bounties/view-bounties?id=${bounty.id}`}
                        className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium text-center"
                      >
                        View Details
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Bounties */}
        {!isLoading && (!bountiesToShow || bountiesToShow.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No bounties found</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? "There are no bounties available at the moment." 
                : `No bounties with status "${getStatusText(selectedStatus as number)}" found.`}
            </p>
          </div>
        )}

        {/* Summary Statistics */}
        {!isLoading && bountiesToShow && bountiesToShow.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bountiesToShow.length}</div>
                <div className="text-sm text-gray-600">Total Bounties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(bountiesToShow.reduce((sum, bounty) => sum + Number(bounty.rewardAmount), 0) / 1e18).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Rewards (AVAX)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {bountiesToShow.filter(b => b.status === BOUNTY_STATUS.OPEN).length}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {bountiesToShow.filter(b => b.status === BOUNTY_STATUS.PAID).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useAllBounties, useTotalBounties } from '../../../contractsABI/contractHooks';
import { BOUNTY_STATUS } from '../../../contractsABI/contractTypes';

export default function DebugBountiesPage() {
  const { address, isConnected } = useAccount();
  const { bounties, isLoading } = useAllBounties();
  const { totalBounties } = useTotalBounties();

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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Debug Bounties</h1>
          <p className="text-gray-600">Please connect your wallet to debug bounties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Bounties</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bounties</h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalBounties?.toString() || '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Address</h3>
            <p className="text-sm font-mono text-gray-600 break-all">
              {address}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Bounties</h3>
            <p className="text-3xl font-bold text-green-600">
              {bounties ? bounties.filter(b => b.status === BOUNTY_STATUS.OPEN).length : 0}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading bounties...
            </div>
          </div>
        )}

        {!isLoading && bounties && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Bounties Debug Info</h2>
            
            {bounties.length === 0 ? (
              <p className="text-gray-600">No bounties found</p>
            ) : (
              <div className="space-y-4">
                {bounties.map((bounty, index) => (
                  <div key={bounty.id.toString()} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">ID:</span>
                        <p className="text-gray-900">{bounty.id.toString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-900">{getStatusText(bounty.status)} ({bounty.status})</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Reward:</span>
                        <p className="text-gray-900">{Number(bounty.rewardAmount) / 1e18} AVAX</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Difficulty:</span>
                        <p className="text-gray-900">{bounty.difficultyLevel.toString()}/5</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Maintainer:</span>
                        <p className="text-gray-900 font-mono text-xs break-all">{bounty.maintainer}</p>
                        {bounty.maintainer.toLowerCase() === address?.toLowerCase() && (
                          <span className="text-blue-600 text-xs font-medium">← You are the maintainer</span>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Claimed By:</span>
                        <p className="text-gray-900 font-mono text-xs break-all">
                          {bounty.claimedBy === '0x0000000000000000000000000000000000000000' 
                            ? 'Not claimed' 
                            : bounty.claimedBy}
                        </p>
                        {bounty.claimedBy.toLowerCase() === address?.toLowerCase() && (
                          <span className="text-green-600 text-xs font-medium">← You claimed this</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-900">
                          {new Date(Number(bounty.createdAt) * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Deadline:</span>
                        <p className="text-gray-900">
                          {new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${Number(bounty.deadline) * 1000 > Date.now() ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(bounty.deadline) * 1000 > Date.now() ? 'Active' : 'Expired'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Can Claim:</span>
                        <p className={`text-sm font-medium ${
                          bounty.status === BOUNTY_STATUS.OPEN &&
                          bounty.maintainer.toLowerCase() !== address?.toLowerCase() &&
                          Number(bounty.deadline) * 1000 > Date.now() &&
                          bounty.claimedBy === '0x0000000000000000000000000000000000000000'
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {bounty.status === BOUNTY_STATUS.OPEN &&
                           bounty.maintainer.toLowerCase() !== address?.toLowerCase() &&
                           Number(bounty.deadline) * 1000 > Date.now() &&
                           bounty.claimedBy === '0x0000000000000000000000000000000000000000'
                            ? '✅ Yes' 
                            : '❌ No'}
                        </p>
                        {bounty.status !== BOUNTY_STATUS.OPEN && (
                          <p className="text-xs text-gray-500">Wrong status</p>
                        )}
                        {bounty.maintainer.toLowerCase() === address?.toLowerCase() && (
                          <p className="text-xs text-gray-500">You are maintainer</p>
                        )}
                        {Number(bounty.deadline) * 1000 <= Date.now() && (
                          <p className="text-xs text-gray-500">Expired</p>
                        )}
                        {bounty.claimedBy !== '0x0000000000000000000000000000000000000000' && (
                          <p className="text-xs text-gray-500">Already claimed</p>
                        )}
                      </div>
                      <div className="md:col-span-4">
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-900 text-sm mt-1">{bounty.description}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">GitHub Issue:</span>
                        <a 
                          href={bounty.githubIssueUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                        >
                          {bounty.githubIssueUrl}
                        </a>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Repository:</span>
                        <a 
                          href={bounty.repositoryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                        >
                          {bounty.repositoryUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && !bounties && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Failed to load bounties</p>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useBountyData, useGetBounty, useBountyMarketplace, useTransactionStatus, useTotalBounties } from '../../../contractsABI/contractHooks';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../../../contractsABI/contractConfig';
import { BOUNTY_STATUS, TIER_NAMES } from '../../../contractsABI/contractTypes';
import DarkVeil from '../../../components/darkveil';

export default function ViewBountiesPage() {
  const { address, isConnected } = useAccount();
  const [bountyId, setBountyId] = useState<string>('1');
  
  // Contract hooks
  const { bounty, isLoading, refetch } = useGetBounty(BigInt(bountyId || '1'));
  const { totalBounties } = useTotalBounties();
  const { claimBounty, hash, isPending } = useBountyMarketplace();
  const { isConfirming, isConfirmed } = useTransactionStatus(hash);

  const handleClaimBounty = async () => {
    if (!bountyId || !bounty) {
      alert('No bounty selected');
      return;
    }
    
    // Check if user can claim this bounty
    if (bounty.status !== BOUNTY_STATUS.OPEN) {
      alert(`Cannot claim bounty. Current status: ${getStatusText(bounty.status)}`);
      return;
    }

    if (bounty.maintainer.toLowerCase() === address?.toLowerCase()) {
      alert('Maintainers cannot claim their own bounties');
      return;
    }

    if (Number(bounty.deadline) * 1000 <= Date.now()) {
      alert('This bounty has expired');
      return;
    }

    if (bounty.claimedBy !== '0x0000000000000000000000000000000000000000') {
      alert('This bounty has already been claimed');
      return;
    }

    console.log('Attempting to claim bounty:', {
      bountyId: BigInt(bountyId),
      bountyDetails: bounty,
      userAddress: address
    });
    
    try {
      const result = await claimBounty({ bountyId: BigInt(bountyId) });
      console.log('Claim bounty transaction initiated:', result);
    } catch (error: any) {
      console.error('Error claiming bounty:', error);
      
      // More specific error messages
      if (error?.message?.includes('user rejected')) {
        alert('Transaction was rejected by user');
      } else if (error?.message?.includes('insufficient funds')) {
        alert('Insufficient funds for gas fee');
      } else if (error?.message?.includes('bounty not available')) {
        alert('Bounty is not available for claiming');
      } else if (error?.message?.includes('deadline passed')) {
        alert('Bounty deadline has passed');
      } else if (error?.message?.includes('already claimed')) {
        alert('Bounty has already been claimed');
      } else if (error?.message?.includes('maintainer cannot claim')) {
        alert('Maintainers cannot claim their own bounties');
      } else {
        alert(`Error claiming bounty: ${error?.message || 'Unknown error'}`);
      }
    }
  };

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
      case BOUNTY_STATUS.OPEN: return 'bg-green-400/20 text-green-300 border-green-400/30';
      case BOUNTY_STATUS.CLAIMED: return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
      case BOUNTY_STATUS.SUBMITTED: return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case BOUNTY_STATUS.VERIFIED: return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case BOUNTY_STATUS.PAID: return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
      case BOUNTY_STATUS.DISPUTED: return 'bg-orange-400/20 text-orange-300 border-orange-400/30';
      case BOUNTY_STATUS.CANCELLED: return 'bg-red-400/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen  overflow-hidden">
        {/* DarkVeil Background */}
        
          
        
        
        {/* Content Overlay */}
        <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-lg bg-black/20 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
              <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                View Bounties
              </h1>
              <p className="text-gray-300 mb-6">Please connect your wallet to view bounties</p>
              <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-200">
                  <strong className="text-white">Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}<br/>
                  <strong className="text-white">Chain ID:</strong> {NETWORK_CONFIG.CHAIN_ID}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen relative overflow-hidden">
      {/* DarkVeil Background */}
      <div className="absolute inset-0 w-full h-full">
       
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
            Browse Bounties
          </h1>

        {/* Success Message */}
        {isConfirmed && (
          <div className="mb-6 backdrop-blur-lg bg-green-500/15 border border-green-400/30 rounded-2xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-300">Bounty Claimed Successfully!</h3>
                <div className="mt-2 text-sm text-green-200">
                  <p>You have successfully claimed this bounty.</p>
                  <p className="mt-1">
                    <strong>Transaction:</strong>{' '}
                    <a 
                      href={`${NETWORK_CONFIG.BLOCK_EXPLORER}/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-100 text-green-300"
                    >
                      View on Explorer
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Bounties - Large Card */}
          <div className="backdrop-blur-lg bg-black/20 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">Total Bounties</h3>
                <p className="text-3xl font-bold text-white">{totalBounties?.toString() || '0'}</p>
                <p className="text-xs text-gray-400 mt-1">Active marketplace</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-xl p-3">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Network Info - Medium Card */}
          <div className="backdrop-blur-lg bg-black/20 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">Network</h3>
                <p className="text-lg font-semibold text-white">{NETWORK_CONFIG.NETWORK_NAME}</p>
                <p className="text-xs text-gray-400">Chain ID: {NETWORK_CONFIG.CHAIN_ID}</p>
              </div>
              <div className="bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-xl p-3">
                <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
            </div>
          </div>

          {/* User Address - Wide Card */}
          <div className="backdrop-blur-lg bg-black/20 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-300 mb-1">Your Address</h3>
                <p className="text-sm text-gray-200 font-mono break-all">{address}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-xl p-3 ml-4">
                <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Bounty Viewer */}
        <div className="backdrop-blur-lg bg-black/20 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Bounty Details
          </h2>
          
          {/* Bounty Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="bountyId" className="block text-sm font-medium text-gray-300">
                Browse Bounties ({totalBounties ? `1 - ${totalBounties.toString()}` : '0'})
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setBountyId(Math.max(1, parseInt(bountyId) - 1).toString())}
                  disabled={parseInt(bountyId) <= 1}
                  className="px-4 py-2 backdrop-blur-md bg-black/20 text-white rounded-xl hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setBountyId((parseInt(bountyId) + 1).toString())}
                  disabled={totalBounties ? parseInt(bountyId) >= Number(totalBounties) : true}
                  className="px-4 py-2 backdrop-blur-md bg-black/20 text-white rounded-xl hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200"
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                id="bountyId"
                value={bountyId}
                onChange={(e) => setBountyId(e.target.value)}
                min="1"
                max={totalBounties ? totalBounties.toString() : undefined}
                className="flex-1 px-4 py-3 backdrop-blur-md bg-black/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Enter bounty ID"
              />
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-purple-400 transition-all duration-200 shadow-lg"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-300">Loading bounty...</span>
              </div>
            </div>
          )}

          {/* Bounty Details */}
          {!isLoading && bounty && (
            <div className="space-y-8">
              {/* Header */}
              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-semibold text-white">
                        Bounty #{bounty.id.toString()}
                      </h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md ${getStatusColor(bounty.status)}`}>
                        {getStatusText(bounty.status)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm text-gray-300 mb-2">
                          <span className="font-medium text-white">GitHub Issue:</span>
                        </p>
                        <a 
                          href={bounty.githubIssueUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline break-all text-sm"
                        >
                          {bounty.githubIssueUrl}
                        </a>
                      </div>
                      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm text-gray-300 mb-2">
                          <span className="font-medium text-white">Repository:</span>
                        </p>
                        <a 
                          href={bounty.repositoryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline break-all text-sm"
                        >
                          {bounty.repositoryUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid Layout for Bounty Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Description - Full Width */}
                <div className="lg:col-span-4 backdrop-blur-md bg-black/20 border border-white/20 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description
                  </h4>
                  <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{bounty.description}</p>
                  </div>
                </div>

                {/* Reward Information */}
                <div className="lg:col-span-2 backdrop-blur-md bg-gradient-to-br from-green-500/15 to-emerald-500/15 border border-green-400/30 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Reward Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Reward Amount:</span>
                      <span className="font-bold text-green-300 text-xl">
                        {Number(bounty.rewardAmount) / 1e18} AVAX
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Difficulty Level:</span>
                      <div className="flex items-center">
                        <span className="font-medium text-white mr-2">
                          {bounty.difficultyLevel.toString()}/5
                        </span>
                        <span className="text-yellow-400">
                          {'⭐'.repeat(Number(bounty.difficultyLevel))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Information */}
                <div className="lg:col-span-2 backdrop-blur-md bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-blue-400/30 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Created:</span>
                      <span className="text-sm text-white">
                        {new Date(Number(bounty.createdAt) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Deadline:</span>
                      <span className="text-sm text-white">
                        {new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    {bounty.claimedAt && Number(bounty.claimedAt) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Claimed:</span>
                        <span className="text-sm text-white">
                          {new Date(Number(bounty.claimedAt) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="lg:col-span-2 backdrop-blur-md bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Participants
                  </h4>
                  <div className="space-y-4">
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                      <span className="text-gray-300 block mb-2">Maintainer:</span>
                      <span className="text-sm font-mono text-white bg-black/20 px-3 py-2 rounded-lg break-all block">
                        {bounty.maintainer}
                      </span>
                    </div>
                    {bounty.claimedBy && bounty.claimedBy !== '0x0000000000000000000000000000000000000000' && (
                      <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <span className="text-gray-300 block mb-2">Claimed by:</span>
                        <span className="text-sm font-mono text-white bg-black/20 px-3 py-2 rounded-lg break-all block">
                          {bounty.claimedBy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills & Submission */}
                <div className="lg:col-span-2 backdrop-blur-md bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-400/20 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Requirements
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-300 block mb-3">Required Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {bounty.requiredSkills && bounty.requiredSkills.length > 0 ? (
                          bounty.requiredSkills.map((skill: string, index: number) => (
                            <span key={index} className="bg-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-400/30 backdrop-blur-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No specific skills required</span>
                        )}
                      </div>
                    </div>
                    {bounty.submissionPrUrl && (
                      <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <span className="text-gray-300 block mb-2">Submission PR:</span>
                        <a 
                          href={bounty.submissionPrUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline break-all text-sm"
                        >
                          {bounty.submissionPrUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Information - Full Width */}
                <div className="lg:col-span-4 backdrop-blur-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 rounded-2xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Status Overview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                      <span className="block text-sm text-gray-300 mb-2">Current Status</span>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md ${getStatusColor(bounty.status)}`}>
                        {getStatusText(bounty.status)}
                      </span>
                    </div>
                    <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                      <span className="block text-sm text-gray-300 mb-2">Completion</span>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md ${
                        bounty.isCompleted ? 'bg-green-400/20 text-green-300 border-green-400/30' : 'bg-gray-400/20 text-gray-300 border-gray-400/30'
                      }`}>
                        {bounty.isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/5">
                      <span className="block text-sm text-gray-300 mb-2">Time Remaining</span>
                      <span className="text-sm font-medium block">
                        {Number(bounty.deadline) * 1000 > Date.now() ? (
                          <span className="text-green-300">
                            {Math.ceil((Number(bounty.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days left
                          </span>
                        ) : (
                          <span className="text-red-300">Expired</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {bounty.status === BOUNTY_STATUS.OPEN && (
                <div className="pt-6 border-t border-white/10">
                  {/* Check if user can claim */}
                  {bounty.maintainer.toLowerCase() === address?.toLowerCase() ? (
                    <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 mb-6">
                      <p className="text-sm text-yellow-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        You cannot claim your own bounty as the maintainer.
                      </p>
                    </div>
                  ) : Number(bounty.deadline) * 1000 <= Date.now() ? (
                    <div className="backdrop-blur-md bg-red-500/10 border border-red-400/20 rounded-xl p-4 mb-6">
                      <p className="text-sm text-red-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        This bounty has expired and can no longer be claimed.
                      </p>
                    </div>
                  ) : bounty.claimedBy !== '0x0000000000000000000000000000000000000000' ? (
                    <div className="backdrop-blur-md bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This bounty has already been claimed by another developer.
                      </p>
                    </div>
                  ) : (
                    <div className="backdrop-blur-md bg-green-500/10 border border-green-400/20 rounded-xl p-4 mb-6">
                      <p className="text-sm text-green-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This bounty is available for claiming!
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleClaimBounty}
                    disabled={
                      isPending || 
                      isConfirming || 
                      bounty.maintainer.toLowerCase() === address?.toLowerCase() ||
                      Number(bounty.deadline) * 1000 <= Date.now() ||
                      bounty.claimedBy !== '0x0000000000000000000000000000000000000000'
                    }
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-500 disabled:hover:to-blue-500 transition-all duration-200 font-medium"
                  >
                    {isPending || isConfirming ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isPending ? 'Claiming...' : 'Confirming...'}
                      </div>
                    ) : (
                      'Claim Bounty'
                    )}
                  </button>
                  
                  {/* Additional info */}
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <p>• Make sure you have enough AVAX for gas fees</p>
                    <p>• Claiming requires wallet signature</p>
                    <p>• You'll have until the deadline to submit work</p>
                  </div>
                </div>
              )}

              {/* Show appropriate message for other statuses */}
              {bounty.status === BOUNTY_STATUS.CLAIMED && (
                <div className="pt-6 border-t border-white/10">
                  <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      This bounty has been claimed and is being worked on.
                      {bounty.claimedBy.toLowerCase() === address?.toLowerCase() && (
                        <span className="block mt-1 font-medium">You are working on this bounty!</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {bounty.status === BOUNTY_STATUS.SUBMITTED && (
                <div className="pt-6 border-t border-white/10">
                  <div className="backdrop-blur-md bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
                    <p className="text-sm text-blue-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Work has been submitted and is awaiting verification.
                    </p>
                  </div>
                </div>
              )}

              {bounty.status === BOUNTY_STATUS.PAID && (
                <div className="pt-6 border-t border-white/10">
                  <div className="backdrop-blur-md bg-green-500/10 border border-green-400/20 rounded-xl p-4">
                    <p className="text-sm text-green-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This bounty has been completed and paid out!
                    </p>
                  </div>
                </div>
              )}

              {bounty.status === BOUNTY_STATUS.CANCELLED && (
                <div className="pt-6 border-t border-white/10">
                  <div className="backdrop-blur-md bg-red-500/10 border border-red-400/20 rounded-xl p-4">
                    <p className="text-sm text-red-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      This bounty has been cancelled.
                    </p>
                  </div>
                </div>
              )}

              {bounty.status === BOUNTY_STATUS.DISPUTED && (
                <div className="pt-6 border-t border-white/10">
                  <div className="backdrop-blur-md bg-orange-500/10 border border-orange-400/20 rounded-xl p-4">
                    <p className="text-sm text-orange-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      This bounty is under dispute and requires admin resolution.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Bounty Found */}
          {!isLoading && !bounty && bountyId && (
            <div className="text-center py-12">
              <div className="text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-white text-lg mb-2">Bounty #{bountyId} not found.</p>
                <p className="text-sm">Try a different bounty ID or check if the bounty exists.</p>
              </div>
            </div>
          )}
        </div>

        {/* Contract Information */}
        <div className="mt-8 backdrop-blur-lg bg-black/20 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Contract Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-gray-300 mb-2">Bounty Marketplace</p>
              <p className="text-gray-400 break-all font-mono text-xs">{CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE}</p>
            </div>
            <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-gray-300 mb-2">Bounty Verifier</p>
              <p className="text-gray-400 break-all font-mono text-xs">{CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER}</p>
            </div>
            <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-gray-300 mb-2">Developer Reputation</p>
              <p className="text-gray-400 break-all font-mono text-xs">{CONTRACT_ADDRESSES.DEVELOPER_REPUTATION}</p>
            </div>
            <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-gray-300 mb-2">Developer Badge</p>
              <p className="text-gray-400 break-all font-mono text-xs">{CONTRACT_ADDRESSES.DEVELOPER_BADGE}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
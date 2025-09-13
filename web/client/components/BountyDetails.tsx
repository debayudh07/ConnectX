'use client';

import React from 'react';
import { formatEther } from 'viem';
import { useGetBounty } from '../contractsABI/contractHooks';
import { BOUNTY_STATUS } from '../contractsABI/contractTypes';

interface BountyDetailsProps {
  bountyId: bigint;
  onClaim?: (bountyId: bigint) => void;
  showActions?: boolean;
}

export const BountyDetails: React.FC<BountyDetailsProps> = ({ 
  bountyId, 
  onClaim, 
  showActions = true 
}) => {
  const { bounty, isLoading, error, refetch } = useGetBounty(bountyId);

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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">
          <p>Error loading bounty #{bountyId.toString()}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-gray-500 text-center">
          <p>Bounty #{bountyId.toString()} not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{bounty.title}</h3>
          <p className="text-sm text-gray-500">Bounty #{bounty.id.toString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status)}`}>
          {getStatusText(bounty.status)}
        </span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700">{bounty.description}</p>
      </div>

      {/* Key Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Reward</p>
          <p className="text-lg font-bold text-green-600">{formatEther(bounty.reward)} AVAX</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Deadline</p>
          <p className="text-gray-700">
            {new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Issuer</p>
          <p className="text-gray-700 text-xs break-all">{bounty.issuer}</p>
        </div>
        {bounty.claimedBy !== '0x0000000000000000000000000000000000000000' && (
          <div>
            <p className="text-sm font-medium text-gray-900">Claimed By</p>
            <p className="text-gray-700 text-xs break-all">{bounty.claimedBy}</p>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 mb-2">Skills Required</p>
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

      {/* Actions */}
      {showActions && bounty.status === BOUNTY_STATUS.OPEN && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onClaim?.(bountyId)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Claim Bounty
          </button>
        </div>
      )}
    </div>
  );
};

export default BountyDetails;
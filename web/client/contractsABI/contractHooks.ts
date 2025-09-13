// Contract hook utilities for ConnectX
// Provides easy-to-use hooks for interacting with deployed contracts

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from './contractConfig';
// Import ABIs directly from JSON files
import BountyMarketplaceABI from './bountyMarketplace.json';
import DeveloperReputationABI from './developerReputation.json';
import DeveloperBadgeABI from './developerBadge.json';
import SimpleBountyVerifierABI from './simpleBountyVerifier.json';

import type {
  BountyStructure,
  DeveloperStats,
  BadgeInfo,
  SubmissionInfo,
  CreateBountyParams,
  ClaimBountyParams,
  SubmitWorkParams,
  VerifySubmissionParams,
  MintBadgeParams,
  UpdateReputationParams
} from './contractTypes';

// Bounty Marketplace Hooks
export const useBountyMarketplace = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const createBounty = async (params: CreateBountyParams & { reward: bigint }) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'createBounty',
      args: [
        params.title,
        params.description, 
        params.deadline,
        params.skillsRequired,
        params.verifierContract
      ],
      value: params.reward
    });
  };

  const claimBounty = async (params: ClaimBountyParams) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'claimBounty',
      args: [params.bountyId]
    });
  };

  const cancelBounty = async (bountyId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'cancelBounty',
      args: [bountyId]
    });
  };

  return {
    createBounty,
    claimBounty,
    cancelBounty,
    hash,
    isPending,
    error
  };
};

export const useBountyData = (bountyId: bigint) => {
  const { data: bounty, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getBounty',
    args: [bountyId]
  }) as { data: BountyStructure | undefined, isLoading: boolean, error: Error | null };

  const { data: bountyCount } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'bountyCounter'
  });

  return {
    bounty,
    bountyCount,
    isLoading,
    error
  };
};

// Developer Reputation Hooks  
export const useDeveloperReputation = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const updateReputation = async (params: UpdateReputationParams) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
      abi: DeveloperReputationABI,
      functionName: 'updateReputation',
      args: [params.developer, params.scoreChange, params.skillsUsed]
    });
  };

  return {
    updateReputation,
    hash,
    isPending,
    error
  };
};

export const useReputationData = (developer: `0x${string}`) => {
  const { data: stats, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
    abi: DeveloperReputationABI,
    functionName: 'getDeveloperStats',
    args: [developer]
  }) as { data: DeveloperStats | undefined, isLoading: boolean, error: Error | null };

  const { data: skillScore } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
    abi: DeveloperReputationABI,
    functionName: 'getSkillScore',
    args: [developer, 'javascript'] // Example skill
  });

  return {
    stats,
    skillScore,
    isLoading,
    error
  };
};

// Developer Badge Hooks
export const useDeveloperBadge = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const mintBadge = async (params: MintBadgeParams) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'mintBadge',
      args: [params.recipient, params.badgeType, params.metadataURI]
    });
  };

  return {
    mintBadge,
    hash,
    isPending,
    error
  };
};

export const useBadgeData = (tokenId: bigint) => {
  const { data: badge, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getBadgeInfo',
    args: [tokenId]
  }) as { data: BadgeInfo | undefined, isLoading: boolean, error: Error | null };

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'totalSupply'
  });

  return {
    badge,
    totalSupply,
    isLoading,
    error
  };
};

// Bounty Verifier Hooks
export const useBountyVerifier = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const verifySubmission = async (params: VerifySubmissionParams) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
      abi: SimpleBountyVerifierABI,
      functionName: 'verifySubmission',
      args: [params.bountyId, params.isValid, params.feedback]
    });
  };

  const submitWork = async (params: SubmitWorkParams) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
      abi: SimpleBountyVerifierABI,
      functionName: 'submitWork',
      args: [params.bountyId, params.submissionHash, params.githubPR]
    });
  };

  return {
    verifySubmission,
    submitWork,
    hash,
    isPending,
    error
  };
};

export const useSubmissionData = (bountyId: bigint) => {
  const { data: submission, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER,
    abi: SimpleBountyVerifierABI,
    functionName: 'getSubmission',
    args: [bountyId]
  }) as { data: SubmissionInfo | undefined, isLoading: boolean, error: Error | null };

  return {
    submission,
    isLoading,
    error
  };
};

// Transaction status hook
export const useTransactionStatus = (hash: `0x${string}` | undefined) => {
  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  return {
    receipt,
    isConfirming,
    isConfirmed
  };
};

// Multi-contract interaction hooks
export const useConnectXData = (address: `0x${string}`) => {
  const reputationData = useReputationData(address);
  const bountyData = useBountyData(BigInt(1)); // Example bounty
  
  return {
    reputation: reputationData,
    bounty: bountyData
  };
};

export default {
  useBountyMarketplace,
  useBountyData,
  useDeveloperReputation,
  useReputationData,
  useDeveloperBadge,
  useBadgeData,
  useBountyVerifier,
  useSubmissionData,
  useTransactionStatus,
  useConnectXData
};
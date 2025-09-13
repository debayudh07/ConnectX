// TypeScript interfaces for ConnectX smart contracts
// Generated from deployed contract ABIs

export interface BountyStructure {
  id: bigint;
  issuer: `0x${string}`;
  title: string;
  description: string;
  reward: bigint;
  deadline: bigint;
  skillsRequired: string[];
  status: number; // 0: Open, 1: Claimed, 2: Completed, 3: Cancelled
  claimedBy: `0x${string}`;
  submissionHash: string;
  verifierContract: `0x${string}`;
}

export interface DeveloperStats {
  totalScore: bigint;
  bountyCompletions: bigint;
  currentStreak: bigint;
  maxStreak: bigint;
  tier: number;
  lastActivityDate: bigint;
}

export interface BadgeInfo {
  tokenId: bigint;
  recipient: `0x${string}`;
  badgeType: string;
  metadata: string;
  mintedAt: bigint;
}

export interface SubmissionInfo {
  bountyId: bigint;
  developer: `0x${string}`;
  submissionHash: string;
  githubPR: string;
  timestamp: bigint;
  isVerified: boolean;
}

// Contract method parameters
export interface CreateBountyParams {
  title: string;
  description: string;
  deadline: bigint;
  skillsRequired: string[];
  verifierContract: `0x${string}`;
}

export interface ClaimBountyParams {
  bountyId: bigint;
}

export interface SubmitWorkParams {
  bountyId: bigint;
  submissionHash: string;
  githubPR: string;
}

export interface VerifySubmissionParams {
  bountyId: bigint;
  isValid: boolean;
  feedback: string;
}

export interface MintBadgeParams {
  recipient: `0x${string}`;
  badgeType: string;
  metadataURI: string;
}

export interface UpdateReputationParams {
  developer: `0x${string}`;
  scoreChange: bigint;
  skillsUsed: string[];
}

// Event types for contract events
export interface BountyCreatedEvent {
  bountyId: bigint;
  issuer: `0x${string}`;
  title: string;
  reward: bigint;
  deadline: bigint;
}

export interface BountyClaimedEvent {
  bountyId: bigint;
  claimedBy: `0x${string}`;
  timestamp: bigint;
}

export interface BountyCompletedEvent {
  bountyId: bigint;
  completedBy: `0x${string}`;
  reward: bigint;
  timestamp: bigint;
}

export interface ReputationUpdatedEvent {
  developer: `0x${string}`;
  newScore: bigint;
  scoreChange: bigint;
  newTier: number;
}

export interface BadgeMintedEvent {
  tokenId: bigint;
  recipient: `0x${string}`;
  badgeType: string;
  timestamp: bigint;
}

export interface SubmissionVerifiedEvent {
  bountyId: bigint;
  developer: `0x${string}`;
  isValid: boolean;
  timestamp: bigint;
}

// Constants
export const BOUNTY_STATUS = {
  OPEN: 0,
  CLAIMED: 1, 
  COMPLETED: 2,
  CANCELLED: 3
} as const;

export const REPUTATION_TIERS = {
  NEWCOMER: 0,
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
  MASTER: 5
} as const;

export const TIER_NAMES = [
  'Newcomer',
  'Beginner', 
  'Intermediate',
  'Advanced',
  'Expert',
  'Master'
] as const;

export const BADGE_TYPES = {
  FIRST_BOUNTY: 'FIRST_BOUNTY',
  STREAK_MASTER: 'STREAK_MASTER',
  SKILL_SPECIALIST: 'SKILL_SPECIALIST',
  BOUNTY_HUNTER: 'BOUNTY_HUNTER',
  COMMUNITY_CONTRIBUTOR: 'COMMUNITY_CONTRIBUTOR'
} as const;

// Helper types
export type BountyStatus = typeof BOUNTY_STATUS[keyof typeof BOUNTY_STATUS];
export type ReputationTier = typeof REPUTATION_TIERS[keyof typeof REPUTATION_TIERS];
export type BadgeType = typeof BADGE_TYPES[keyof typeof BADGE_TYPES];
export type TierName = typeof TIER_NAMES[number];

// Contract names for type safety
export type ContractName = 
  | 'BOUNTY_MARKETPLACE'
  | 'DEVELOPER_REPUTATION' 
  | 'DEVELOPER_BADGE'
  | 'SIMPLE_BOUNTY_VERIFIER';

export default {
  BOUNTY_STATUS,
  REPUTATION_TIERS,
  TIER_NAMES,
  BADGE_TYPES
};
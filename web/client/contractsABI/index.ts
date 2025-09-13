// ConnectX Contracts Integration
// Main export file for frontend contract integration

// Export contract configuration and types
export * from './contractConfig';
export * from './contractTypes';

// Contract addresses are available in contractAddresses.json
// Contract ABIs are available as individual JSON files in this directory:
// - bountyMarketplace.json
// - developerReputation.json  
// - developerBadge.json
// - simpleBountyVerifier.json

// Usage examples:
// import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contractsABI';
// import { useBountyMarketplace, useBountyData } from './contractsABI/contractHooks';
// import BountyMarketplaceABI from './contractsABI/bountyMarketplace.json';

export const CONTRACT_FILES = {
  BOUNTY_MARKETPLACE: 'bountyMarketplace.json',
  DEVELOPER_REPUTATION: 'developerReputation.json',
  DEVELOPER_BADGE: 'developerBadge.json',
  SIMPLE_BOUNTY_VERIFIER: 'simpleBountyVerifier.json'
} as const;

// Quick access to deployment info
export const DEPLOYED_CONTRACTS = {
  bountyMarketplace: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca',
  developerReputation: '0xa214C70f0352315ebD22656Fbc755D44473e80f6',
  developerBadge: '0x04CE909c5688D63C3cB4b7381D367d4bfe5992Be',
  simpleBountyVerifier: '0x7c4250160BCC04e07D883424d3D07D925bC40D12'
} as const;

export default {
  CONTRACT_FILES,
  DEPLOYED_CONTRACTS
};
// ConnectX Contract Addresses for Avalanche Fuji Testnet
// Deployed with gas-optimized deployment script

export const CONTRACT_ADDRESSES = {
  SIMPLE_BOUNTY_VERIFIER: '0x7c4250160BCC04e07D883424d3D07D925bC40D12',
  DEVELOPER_REPUTATION: '0xa214C70f0352315ebD22656Fbc755D44473e80f6', 
  DEVELOPER_BADGE: '0x04CE909c5688D63C3cB4b7381D367d4bfe5992Be',
  BOUNTY_MARKETPLACE: '0x5b3f1e6047Cd8e0ab83b795e682F6Fe8090c0cca'
} as const;

export const NETWORK_CONFIG = {
  CHAIN_ID: 43113, // Avalanche Fuji Testnet
  NETWORK_NAME: 'Avalanche Fuji Testnet',
  RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  BLOCK_EXPLORER: 'https://testnet.snowtrace.io',
  CURRENCY: {
    NAME: 'AVAX',
    SYMBOL: 'AVAX',
    DECIMALS: 18
  }
} as const;

export const DEPLOYMENT_INFO = {
  DEPLOYED_AT: new Date('2025-09-14').toISOString(),
  DEPLOYMENT_BLOCK: 'TBD', // Add the block number where contracts were deployed
  GAS_OPTIMIZATION: {
    TOTAL_GAS_USED: '13,074,553', // Actual gas used from deployment
    ESTIMATED_COST_AVAX: '0.000000000013074553',
    OPTIMIZATION_PERCENTAGE: '25%' // Gas price reduction applied
  }
} as const;

// Helper functions for contract interactions
export const getContractAddress = (contractName: keyof typeof CONTRACT_ADDRESSES): string => {
  return CONTRACT_ADDRESSES[contractName];
};

export const getAllContractAddresses = () => CONTRACT_ADDRESSES;

export const getNetworkConfig = () => NETWORK_CONFIG;

export default CONTRACT_ADDRESSES;
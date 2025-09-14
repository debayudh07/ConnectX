// Contract hook utilities for ConnectX
// Provides easy-to-use hooks for interacting with deployed contracts

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from './contractConfig';
import type {
  BountyStructure,
  DeveloperStats,
  BadgeInfo,
  SubmissionInfo,
  BountySubmission,
  CreateBountyParams,
  ClaimBountyParams,
  SubmitWorkParams,
  VerifySubmissionParams,
  MintBadgeParams,
  UpdateReputationParams
} from './contractTypes';

// Embedded ABIs - extracted from deployment artifacts
const BountyMarketplaceABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_feeRecipient",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AccessControlBadConfirmation",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "neededRole",
          "type": "bytes32"
        }
      ],
      "name": "AccessControlUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "maintainer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "BountyCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "claimedAt",
          "type": "uint256"
        }
      ],
      "name": "BountyClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "maintainer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "githubIssueUrl",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "BountyCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "disputedBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "BountyDisputed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "badgeTokenId",
          "type": "uint256"
        }
      ],
      "name": "BountyPaid",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "prUrl",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "submittedAt",
          "type": "uint256"
        }
      ],
      "name": "BountySubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "verifiedAt",
          "type": "uint256"
        }
      ],
      "name": "BountyVerified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "contractName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "oldAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "newAddress",
          "type": "address"
        }
      ],
      "name": "ContractAddressUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldFee",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newFee",
          "type": "uint256"
        }
      ],
      "name": "PlatformFeeUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "previousAdminRole",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "newAdminRole",
          "type": "bytes32"
        }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleRevoked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAINTAINER_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "VERIFIER_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "bounties",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "maintainer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "githubIssueUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "repositoryUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        },
        {
          "internalType": "enum BountyMarketplace.BountyStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "claimedBy",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "submissionPrUrl",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "claimedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "submittedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "verifiedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isCompleted",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "difficultyLevel",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "bountySubmissions",
      "outputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "prUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "submittedAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isVerified",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "bountyVerifier",
      "outputs": [
        {
          "internalType": "contract IBountyVerifier",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_reason",
          "type": "string"
        }
      ],
      "name": "cancelBounty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        }
      ],
      "name": "claimBounty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_githubIssueUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_repositoryUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_deadline",
          "type": "uint256"
        },
        {
          "internalType": "string[]",
          "name": "_requiredSkills",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "_difficultyLevel",
          "type": "uint256"
        }
      ],
      "name": "createBounty",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "developerBadge",
      "outputs": [
        {
          "internalType": "contract IDeveloperBadge",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "developerClaims",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "developerCompletions",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "developerReputation",
      "outputs": [
        {
          "internalType": "contract IDeveloperReputation",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_reason",
          "type": "string"
        }
      ],
      "name": "disputeBounty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emergencyWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "feeRecipient",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllBounties",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "maintainer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "githubIssueUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "repositoryUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            },
            {
              "internalType": "enum BountyMarketplace.BountyStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "claimedBy",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "submissionPrUrl",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "submittedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "verifiedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isCompleted",
              "type": "bool"
            },
            {
              "internalType": "string[]",
              "name": "requiredSkills",
              "type": "string[]"
            },
            {
              "internalType": "uint256",
              "name": "difficultyLevel",
              "type": "uint256"
            }
          ],
          "internalType": "struct BountyMarketplace.Bounty[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "enum BountyMarketplace.BountyStatus",
          "name": "_status",
          "type": "uint8"
        }
      ],
      "name": "getBountiesByStatus",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "maintainer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "githubIssueUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "repositoryUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            },
            {
              "internalType": "enum BountyMarketplace.BountyStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "claimedBy",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "submissionPrUrl",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "submittedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "verifiedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isCompleted",
              "type": "bool"
            },
            {
              "internalType": "string[]",
              "name": "requiredSkills",
              "type": "string[]"
            },
            {
              "internalType": "uint256",
              "name": "difficultyLevel",
              "type": "uint256"
            }
          ],
          "internalType": "struct BountyMarketplace.Bounty[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        }
      ],
      "name": "getBounty",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "maintainer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "githubIssueUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "repositoryUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            },
            {
              "internalType": "enum BountyMarketplace.BountyStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "claimedBy",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "submissionPrUrl",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "submittedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "verifiedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isCompleted",
              "type": "bool"
            },
            {
              "internalType": "string[]",
              "name": "requiredSkills",
              "type": "string[]"
            },
            {
              "internalType": "uint256",
              "name": "difficultyLevel",
              "type": "uint256"
            }
          ],
          "internalType": "struct BountyMarketplace.Bounty",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        }
      ],
      "name": "getBountySubmissions",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "developer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "prUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "submittedAt",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            }
          ],
          "internalType": "struct BountyMarketplace.Submission[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_developer",
          "type": "address"
        }
      ],
      "name": "getDeveloperClaims",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_developer",
          "type": "address"
        }
      ],
      "name": "getDeveloperCompletions",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_maintainer",
          "type": "address"
        }
      ],
      "name": "getMaintainerBounties",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        }
      ],
      "name": "getRoleAdmin",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalBounties",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "hasSubmitted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "maintainerBounties",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maximumClaimDuration",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "minimumBountyAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "platformFeePercentage",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "callerConfirmation",
          "type": "address"
        }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_payDeveloper",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "_resolution",
          "type": "string"
        }
      ],
      "name": "resolveBountyDispute",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_developerBadge",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_developerReputation",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_bountyVerifier",
          "type": "address"
        }
      ],
      "name": "setContractAddresses",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newFeeRecipient",
          "type": "address"
        }
      ],
      "name": "setFeeRecipient",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newDuration",
          "type": "uint256"
        }
      ],
      "name": "setMaximumClaimDuration",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newMinimum",
          "type": "uint256"
        }
      ],
      "name": "setMinimumBountyAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newFeePercentage",
          "type": "uint256"
        }
      ],
      "name": "setPlatformFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_prUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        }
      ],
      "name": "submitWork",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_bountyId",
          "type": "uint256"
        }
      ],
      "name": "verifyAndPayBounty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ] as const;

const DeveloperReputationABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AccessControlBadConfirmation",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "neededRole",
          "type": "bytes32"
        }
      ],
      "name": "AccessControlUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ERC721EnumerableForbiddenBatchMint",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721IncorrectOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721InsufficientApproval",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721NonexistentToken",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "ERC721OutOfBoundsIndex",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "length",
          "type": "uint256"
        }
      ],
      "name": "StringsInsufficientHexLength",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "badgeType",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "achievementName",
          "type": "string"
        }
      ],
      "name": "BadgeMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "BadgeTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_fromTokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_toTokenId",
          "type": "uint256"
        }
      ],
      "name": "BatchMetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "MetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "previousAdminRole",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "newAdminRole",
          "type": "bytes32"
        }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleRevoked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MINTER_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "badgeMetadata",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "githubIssueUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "repositoryUrl",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "difficultyLevel",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "completedAt",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "skills",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "badgeType",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "achievementName",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "bountyBadges",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "completionBadges",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "developerBadges",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "developerBadgesByType",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        }
      ],
      "name": "getAllDeveloperBadgeDetails",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "bountyId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "githubIssueUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "repositoryUrl",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "difficultyLevel",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "completedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "developer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "skills",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "badgeType",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "achievementName",
              "type": "string"
            }
          ],
          "internalType": "struct DeveloperBadge.BadgeMetadata[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getBadgeDetails",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "bountyId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "githubIssueUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "repositoryUrl",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "difficultyLevel",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "completedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "developer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "skills",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "badgeType",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "achievementName",
              "type": "string"
            }
          ],
          "internalType": "struct DeveloperBadge.BadgeMetadata",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        }
      ],
      "name": "getBountyBadges",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        }
      ],
      "name": "getDeveloperBadgeCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        }
      ],
      "name": "getDeveloperBadges",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "badgeType",
          "type": "uint256"
        }
      ],
      "name": "getDeveloperBadgesByType",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        }
      ],
      "name": "getRoleAdmin",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "mintBadge",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "githubIssueUrl",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "repositoryUrl",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "difficultyLevel",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "skills",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "badgeType",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "achievementName",
          "type": "string"
        }
      ],
      "name": "mintCustomBadge",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "developer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "streakCount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "achievementName",
          "type": "string"
        }
      ],
      "name": "mintStreakBadge",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "callerConfirmation",
          "type": "address"
        }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeMinterRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "setMinterRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "specialBadges",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "streakBadges",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "tokenByIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "tokenOfOwnerByIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "newAchievementName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "newSkills",
          "type": "string"
        }
      ],
      "name": "updateBadgeMetadata",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;

const SimpleBountyVerifierABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"},
      {"internalType": "bytes32", "name": "neededRole", "type": "bytes32"}
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "bytes32", "name": "previousAdminRole", "type": "bytes32"},
      {"indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32"}
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "developer", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "isValid", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "SubmissionVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "developer", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "submissionHash", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "githubPR", "type": "string"}
    ],
    "name": "WorkSubmitted",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERIFIER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_developer", "type": "address"},
      {"internalType": "string", "name": "_githubAccount", "type": "string"}
    ],
    "name": "addGithubAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "githubAccounts",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
    "name": "getRoleAdmin",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "getSubmission",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "bountyId", "type": "uint256"},
          {"internalType": "address", "name": "developer", "type": "address"},
          {"internalType": "string", "name": "submissionHash", "type": "string"},
          {"internalType": "string", "name": "githubPR", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "bool", "name": "isVerified", "type": "bool"}
        ],
        "internalType": "struct SimpleBountyVerifier.Submission",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketplaceContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "callerConfirmation", "type": "address"}
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_marketplace", "type": "address"}],
    "name": "setMarketplaceContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "submissions",
    "outputs": [
      {"internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"internalType": "address", "name": "developer", "type": "address"},
      {"internalType": "string", "name": "submissionHash", "type": "string"},
      {"internalType": "string", "name": "githubPR", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "bool", "name": "isVerified", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_bountyId", "type": "uint256"},
      {"internalType": "string", "name": "_submissionHash", "type": "string"},
      {"internalType": "string", "name": "_githubPR", "type": "string"}
    ],
    "name": "submitWork",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
    "name": "supportsInterface",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_bountyId", "type": "uint256"},
      {"internalType": "bool", "name": "_isValid", "type": "bool"},
      {"internalType": "string", "name": "_feedback", "type": "string"}
    ],
    "name": "verifySubmission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const DeveloperBadgeABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "ERC721OutOfBoundsIndex",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "StringsInsufficientHexLength",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "badgeType",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      }
    ],
    "name": "BadgeMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "BadgeTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "badgeMetadata",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "githubIssueUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "repositoryUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "difficultyLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "completedAt",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "skills",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "badgeType",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bountyBadges",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "completionBadges",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "developerBadges",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "developerBadgesByType",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      }
    ],
    "name": "getAllDeveloperBadgeDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "bountyId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rewardAmount",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "githubIssueUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "repositoryUrl",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "difficultyLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completedAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "developer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "skills",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "badgeType",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "achievementName",
            "type": "string"
          }
        ],
        "internalType": "struct DeveloperBadge.BadgeMetadata[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getBadgeDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "bountyId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rewardAmount",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "githubIssueUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "repositoryUrl",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "difficultyLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completedAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "developer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "skills",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "badgeType",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "achievementName",
            "type": "string"
          }
        ],
        "internalType": "struct DeveloperBadge.BadgeMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "getBountyBadges",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      }
    ],
    "name": "getDeveloperBadgeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      }
    ],
    "name": "getDeveloperBadges",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "badgeType",
        "type": "uint256"
      }
    ],
    "name": "getDeveloperBadgesByType",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "mintBadge",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "githubIssueUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "repositoryUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "difficultyLevel",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "skills",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "badgeType",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      }
    ],
    "name": "mintCustomBadge",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "streakCount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      }
    ],
    "name": "mintStreakBadge",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeMinterRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "setMinterRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "specialBadges",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "streakBadges",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "newAchievementName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "newSkills",
        "type": "string"
      }
    ],
    "name": "updateBadgeMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Bounty Marketplace Hooks
export const useBountyMarketplace = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const createBounty = async (params: CreateBountyParams & { reward: bigint }) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'createBounty',
      args: [
        params.githubIssueUrl,
        params.repositoryUrl,
        params.description,
        params.deadline,
        params.requiredSkills,
        params.difficultyLevel
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

  const cancelBounty = async (bountyId: bigint, reason: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'cancelBounty',
      args: [bountyId, reason]
    });
  };

  const submitWork = async (bountyId: bigint, prUrl: string, description: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'submitWork',
      args: [bountyId, prUrl, description]
    });
  };

  const verifyAndPayBounty = async (bountyId: bigint) => {
    try {
      console.log('🚀 Executing verifyAndPayBounty with enhanced validation...', { bountyId });
      
      return writeContract({
        address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
        abi: BountyMarketplaceABI,
        functionName: 'verifyAndPayBounty',
        args: [bountyId]
      });
    } catch (error: any) {
      console.error('💥 verifyAndPayBounty error:', error);
      
      // Enhanced error handling based on our comprehensive tests
      const errorMessage = error?.message || error?.shortMessage || String(error);
      
      if (errorMessage.includes('bounty does not exist')) {
        throw new Error('Bounty not found. Please verify the bounty ID is correct.');
      } else if (errorMessage.includes('bounty not in submitted state')) {
        throw new Error('Bounty is not in submitted state. Only submitted bounties can be verified.');
      } else if (errorMessage.includes('no submission found')) {
        throw new Error('No submission found for this bounty. Developer must submit work first.');
      } else if (errorMessage.includes('submission verification failed')) {
        throw new Error('Submission verification failed. The work does not meet the requirements.');
      } else if (errorMessage.includes('caller is not a verifier or admin')) {
        throw new Error('Access denied: You need VERIFIER_ROLE or ADMIN_ROLE to verify bounties.');
      } else if (errorMessage.includes('EnforcedPause') || errorMessage.includes('paused')) {
        throw new Error('Contract is currently paused. Please try again later.');
      } else if (errorMessage.includes('ReentrancyGuard') || errorMessage.includes('reentrancy')) {
        throw new Error('Reentrancy detected. Transaction blocked for security reasons.');
      } else if (errorMessage.includes('developer payment failed')) {
        throw new Error('Payment transfer to developer failed. Please check recipient address.');
      } else if (errorMessage.includes('platform fee payment failed')) {
        throw new Error('Platform fee transfer failed. Please contact support.');
      } else if (errorMessage.includes('user rejected')) {
        throw new Error('Transaction was rejected by user.');
      } else if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds to complete the transaction.');
      } else if (errorMessage.includes('gas')) {
        throw new Error('Gas estimation failed. Please try again with higher gas limit.');
      } else {
        // Generic error with original message
        throw new Error(`Verification failed: ${errorMessage}`);
      }
    }
  };

  // Add role management functions
  const grantVerifierRole = async (account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'grantRole',
      args: [
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' as `0x${string}`, // VERIFIER_ROLE
        account
      ]
    });
  };

  const grantMaintainerRole = async (account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'grantRole',
      args: [
        '0x46925e0f0cc76e485772167edccb8dc449d43b23b55fc4e756b063f49099e6a0' as `0x${string}`, // MAINTAINER_ROLE
        account
      ]
    });
  };

  const disputeBounty = async (bountyId: bigint, reason: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'disputeBounty',
      args: [bountyId, reason]
    });
  };

  const resolveBountyDispute = async (bountyId: bigint, payDeveloper: boolean, resolution: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'resolveBountyDispute',
      args: [bountyId, payDeveloper, resolution]
    });
  };

  return {
    createBounty,
    claimBounty,
    cancelBounty,
    submitWork,
    verifyAndPayBounty,
    grantVerifierRole,
    grantMaintainerRole,
    disputeBounty,
    resolveBountyDispute,
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

  return {
    bounty,
    isLoading,
    error
  };
};

// Hook specifically for getting a single bounty by ID
export const useGetBounty = (bountyId: bigint) => {
  const { data: bounty, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getBounty',
    args: [bountyId],
    query: {
      enabled: bountyId > 0, // Only fetch if bountyId is valid
    }
  }) as { 
    data: BountyStructure | undefined, 
    isLoading: boolean, 
    error: Error | null,
    refetch: () => void
  };

  return {
    bounty,
    isLoading,
    error,
    refetch
  };
};

// Get total bounties count
export const useTotalBounties = () => {
  const { data: totalBounties, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getTotalBounties'
  });

  return {
    totalBounties,
    isLoading,
    error
  };
};

// Get all bounties
export const useAllBounties = () => {
  const { data: bounties, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getAllBounties'
  });

  return {
    bounties: bounties as BountyStructure[] | undefined,
    isLoading,
    error
  };
};

// Get bounties by status
export const useBountiesByStatus = (status: number) => {
  const { data: bounties, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getBountiesByStatus',
    args: [status]
  });

  return {
    bounties: bounties as BountyStructure[] | undefined,
    isLoading,
    error
  };
};

// Get bounty submissions
export const useBountySubmissions = (bountyId: bigint) => {
  const { data: submissions, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getBountySubmissions',
    args: [bountyId]
  }) as { data: BountySubmission[] | undefined, isLoading: boolean, error: Error | null };

  return {
    submissions,
    isLoading,
    error
  };
};

// Get maintainer bounties
export const useMaintainerBounties = (maintainerAddress: `0x${string}`) => {
  const { data: bountyIds, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getMaintainerBounties',
    args: [maintainerAddress]
  }) as { data: bigint[] | undefined, isLoading: boolean, error: Error | null };

  return {
    bountyIds,
    isLoading,
    error
  };
};

// Get developer claims
export const useDeveloperClaims = (developerAddress: `0x${string}`) => {
  const { data: claimedBountyIds, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getDeveloperClaims',
    args: [developerAddress]
  }) as { data: bigint[] | undefined, isLoading: boolean, error: Error | null };

  return {
    claimedBountyIds,
    isLoading,
    error
  };
};

// Get developer completions
export const useDeveloperCompletions = (developerAddress: `0x${string}`) => {
  const { data: completedBountyIds, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'getDeveloperCompletions',
    args: [developerAddress]
  }) as { data: bigint[] | undefined, isLoading: boolean, error: Error | null };

  return {
    completedBountyIds,
    isLoading,
    error
  };
};

// Platform Configuration Hooks
export const usePlatformFeePercentage = () => {
  const { data: feePercentage, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'platformFeePercentage'
  });

  return {
    feePercentage,
    isLoading,
    error
  };
};

export const useMinimumBountyAmount = () => {
  const { data: minimumAmount, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'minimumBountyAmount'
  });

  return {
    minimumAmount,
    isLoading,
    error
  };
};

export const useMaximumClaimDuration = () => {
  const { data: maxDuration, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'maximumClaimDuration'
  });

  return {
    maxDuration,
    isLoading,
    error
  };
};

export const useFeeRecipient = () => {
  const { data: feeRecipient, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'feeRecipient'
  });

  return {
    feeRecipient,
    isLoading,
    error
  };
};

export const useIsPaused = () => {
  const { data: isPaused, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'paused'
  });

  return {
    isPaused,
    isLoading,
    error
  };
};

// Role Management Hooks
export const useHasRole = (role: `0x${string}`, account: `0x${string}`) => {
  const { data: hasRole, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'hasRole',
    args: [role, account]
  });

  return {
    hasRole,
    isLoading,
    error
  };
};

// Hook to check if user can verify bounties
export const useCanVerifyBounties = (account: `0x${string}`) => {
  const VERIFIER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' as `0x${string}`;
  const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775' as `0x${string}`;
  
  const { data: hasVerifierRole, isLoading: verifierLoading, error: verifierError } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'hasRole',
    args: [VERIFIER_ROLE, account],
    query: {
      enabled: !!account
    }
  });

  const { data: hasAdminRole, isLoading: adminLoading, error: adminError } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, account],
    query: {
      enabled: !!account
    }
  });

  const canVerify = Boolean(hasVerifierRole || hasAdminRole);
  const isLoading = verifierLoading || adminLoading;
  const error = verifierError || adminError;

  return {
    canVerify,
    hasVerifierRole: Boolean(hasVerifierRole),
    hasAdminRole: Boolean(hasAdminRole),
    isLoading,
    error
  };
};

export const useHasSubmitted = (bountyId: bigint, developer: `0x${string}`) => {
  const { data: hasSubmitted, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'hasSubmitted',
    args: [bountyId, developer]
  });

  return {
    hasSubmitted,
    isLoading,
    error
  };
};

// Developer Reputation Hooks  
export const useDeveloperReputation = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const mintBadge = async (params: { developer: `0x${string}`, bountyId: bigint, metadataURI: string }) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_REPUTATION,
      abi: DeveloperReputationABI,
      functionName: 'mintBadge',
      args: [params.developer, params.bountyId, params.metadataURI]
    });
  };

  return {
    mintBadge,
    hash,
    isPending,
    error
  };
};

export const useReputationData = (developer: `0x${string}`) => {
  // Use balanceOf instead of getDeveloperBadgeCount for compatibility
  const { data: badgeCount, isLoading: badgeCountLoading, error: badgeCountError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'balanceOf',
    args: [developer]
  });

  // Get total supply since getAllDeveloperBadgeDetails doesn't exist in minimal contract
  const { data: totalSupply, isLoading: totalSupplyLoading, error: totalSupplyError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'totalSupply'
  });

  return {
    badgeCount,
    totalSupply, // Return totalSupply instead of allBadges
    isLoading: badgeCountLoading || totalSupplyLoading,
    error: badgeCountError || totalSupplyError
  };
};

// Developer Badge Hooks
export const useDeveloperBadge = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const mintBadge = async (params: { developer: `0x${string}`, bountyId: bigint, metadataURI: string }) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'mintBadge',
      args: [params.developer, params.bountyId, params.metadataURI]
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
  // Use tokenURI instead of getBadgeDetails since getBadgeDetails doesn't exist in minimal contract
  const { data: tokenURI, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'tokenURI',
    args: [tokenId]
  }) as { data: string | undefined, isLoading: boolean, error: Error | null };

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'totalSupply'
  });

  return {
    tokenURI, // Return tokenURI instead of badge
    totalSupply,
    isLoading,
    error
  };
};

// Enhanced Developer Badge Hooks
export const useDeveloperBadgeRead = () => {
  // Hook for reading badge data by token ID
  const getBadgeDetails = (tokenId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getBadgeDetails',
      args: [tokenId]
    });
    return { data, isLoading, error };
  };

  // Hook for getting all developer badges
  const getAllDeveloperBadgeDetails = (developer: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getAllDeveloperBadgeDetails',
      args: [developer]
    });
    return { data, isLoading, error };
  };

  // Hook for getting developer badge count
  const getDeveloperBadgeCount = (developer: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getDeveloperBadgeCount',
      args: [developer]
    });
    return { data, isLoading, error };
  };

  // Hook for getting developer badges
  const getDeveloperBadges = (developer: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getDeveloperBadges',
      args: [developer]
    });
    return { data, isLoading, error };
  };

  // Hook for getting developer badges by type
  const getDeveloperBadgesByType = (developer: `0x${string}`, badgeType: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getDeveloperBadgesByType',
      args: [developer, badgeType]
    });
    return { data, isLoading, error };
  };

  // Hook for getting bounty badges
  const getBountyBadges = (bountyId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getBountyBadges',
      args: [bountyId]
    });
    return { data, isLoading, error };
  };

  // Hook for getting total supply
  const getTotalSupply = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getTotalSupply'
    });
    return { data, isLoading, error };
  };

  // Hook for getting badge metadata
  const getBadgeMetadata = (tokenId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'badgeMetadata',
      args: [tokenId]
    });
    return { data, isLoading, error };
  };

  // Standard ERC721 read functions
  const balanceOf = (owner: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'balanceOf',
      args: [owner]
    });
    return { data, isLoading, error };
  };

  const ownerOf = (tokenId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'ownerOf',
      args: [tokenId]
    });
    return { data, isLoading, error };
  };

  const getApproved = (tokenId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getApproved',
      args: [tokenId]
    });
    return { data, isLoading, error };
  };

  const isApprovedForAll = (owner: `0x${string}`, operator: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'isApprovedForAll',
      args: [owner, operator]
    });
    return { data, isLoading, error };
  };

  const tokenURI = (tokenId: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'tokenURI',
      args: [tokenId]
    });
    return { data, isLoading, error };
  };

  const name = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'name'
    });
    return { data, isLoading, error };
  };

  const symbol = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'symbol'
    });
    return { data, isLoading, error };
  };

  const totalSupply = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'totalSupply'
    });
    return { data, isLoading, error };
  };

  const tokenByIndex = (index: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'tokenByIndex',
      args: [index]
    });
    return { data, isLoading, error };
  };

  const tokenOfOwnerByIndex = (owner: `0x${string}`, index: bigint) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [owner, index]
    });
    return { data, isLoading, error };
  };

  // Role-based functions
  const hasRole = (role: `0x${string}`, account: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'hasRole',
      args: [role, account]
    });
    return { data, isLoading, error };
  };

  const getRoleAdmin = (role: `0x${string}`) => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'getRoleAdmin',
      args: [role]
    });
    return { data, isLoading, error };
  };

  // Role constants
  const DEFAULT_ADMIN_ROLE = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'DEFAULT_ADMIN_ROLE'
    });
    return { data, isLoading, error };
  };

  const ADMIN_ROLE = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'ADMIN_ROLE'
    });
    return { data, isLoading, error };
  };

  const MINTER_ROLE = () => {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'MINTER_ROLE'
    });
    return { data, isLoading, error };
  };

  return {
    getBadgeDetails,
    getAllDeveloperBadgeDetails,
    getDeveloperBadgeCount,
    getDeveloperBadges,
    getDeveloperBadgesByType,
    getBountyBadges,
    getTotalSupply,
    getBadgeMetadata,
    balanceOf,
    ownerOf,
    getApproved,
    isApprovedForAll,
    tokenURI,
    name,
    symbol,
    totalSupply,
    tokenByIndex,
    tokenOfOwnerByIndex,
    hasRole,
    getRoleAdmin,
    DEFAULT_ADMIN_ROLE,
    ADMIN_ROLE,
    MINTER_ROLE
  };
};

export const useDeveloperBadgeWrite = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Minting functions
  const mintBadge = async (developer: `0x${string}`, bountyId: bigint, metadataURI: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'mintBadge',
      args: [developer, bountyId, metadataURI]
    });
  };

  const mintCustomBadge = async (
    developer: `0x${string}`,
    bountyId: bigint,
    rewardAmount: bigint,
    githubIssueUrl: string,
    repositoryUrl: string,
    difficultyLevel: bigint,
    skills: string,
    badgeType: bigint,
    achievementName: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'mintCustomBadge',
      args: [developer, bountyId, rewardAmount, githubIssueUrl, repositoryUrl, difficultyLevel, skills, badgeType, achievementName]
    });
  };

  const mintStreakBadge = async (developer: `0x${string}`, streakCount: bigint, achievementName: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'mintStreakBadge',
      args: [developer, streakCount, achievementName]
    });
  };

  // Transfer functions
  const transferFrom = async (from: `0x${string}`, to: `0x${string}`, tokenId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'transferFrom',
      args: [from, to, tokenId]
    });
  };

  const safeTransferFrom = async (from: `0x${string}`, to: `0x${string}`, tokenId: bigint, data?: `0x${string}`) => {
    if (data) {
      return writeContract({
        address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
        abi: DeveloperBadgeABI,
        functionName: 'safeTransferFrom',
        args: [from, to, tokenId, data]
      });
    } else {
      return writeContract({
        address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
        abi: DeveloperBadgeABI,
        functionName: 'safeTransferFrom',
        args: [from, to, tokenId]
      });
    }
  };

  // Approval functions
  const approve = async (to: `0x${string}`, tokenId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'approve',
      args: [to, tokenId]
    });
  };

  const setApprovalForAll = async (operator: `0x${string}`, approved: boolean) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'setApprovalForAll',
      args: [operator, approved]
    });
  };

  // Role management functions
  const grantRole = async (role: `0x${string}`, account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'grantRole',
      args: [role, account]
    });
  };

  const revokeRole = async (role: `0x${string}`, account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'revokeRole',
      args: [role, account]
    });
  };

  const renounceRole = async (role: `0x${string}`, callerConfirmation: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'renounceRole',
      args: [role, callerConfirmation]
    });
  };

  const setMinterRole = async (account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'setMinterRole',
      args: [account]
    });
  };

  const revokeMinterRole = async (account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'revokeMinterRole',
      args: [account]
    });
  };

  // Metadata update function
  const updateBadgeMetadata = async (tokenId: bigint, newAchievementName: string, newSkills: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
      abi: DeveloperBadgeABI,
      functionName: 'updateBadgeMetadata',
      args: [tokenId, newAchievementName, newSkills]
    });
  };

  return {
    mintBadge,
    mintCustomBadge,
    mintStreakBadge,
    transferFrom,
    safeTransferFrom,
    approve,
    setApprovalForAll,
    grantRole,
    revokeRole,
    renounceRole,
    setMinterRole,
    revokeMinterRole,
    updateBadgeMetadata,
    hash,
    isPending,
    error
  };
};

// Convenient combined hook for developer badge operations
export const useDeveloperBadgeOperations = () => {
  const readOperations = useDeveloperBadgeRead();
  const writeOperations = useDeveloperBadgeWrite();

  return {
    ...readOperations,
    ...writeOperations
  };
};

// Hook for specific developer badge queries
export const useDeveloperBadgeQueries = (developer: `0x${string}`) => {
  const { data: badgeCount, isLoading: countLoading, error: countError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getDeveloperBadgeCount',
    args: [developer]
  });

  const { data: allBadges, isLoading: badgesLoading, error: badgesError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getAllDeveloperBadgeDetails',
    args: [developer]
  });

  const { data: developerBadges, isLoading: developerBadgesLoading, error: developerBadgesError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getDeveloperBadges',
    args: [developer]
  });

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'balanceOf',
    args: [developer]
  });

  return {
    badgeCount,
    allBadges,
    developerBadges,
    balance,
    isLoading: countLoading || badgesLoading || developerBadgesLoading || balanceLoading,
    error: countError || badgesError || developerBadgesError || balanceError
  };
};

// Hook for badge type specific queries
export const useBadgeTypeQueries = (developer: `0x${string}`, badgeType: bigint) => {
  const { data: badgesByType, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getDeveloperBadgesByType',
    args: [developer, badgeType]
  });

  return {
    badgesByType,
    isLoading,
    error
  };
};

// Hook for bounty specific badge queries
export const useBountyBadgeQueries = (bountyId: bigint) => {
  const { data: bountyBadges, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DEVELOPER_BADGE,
    abi: DeveloperBadgeABI,
    functionName: 'getBountyBadges',
    args: [bountyId]
  });

  return {
    bountyBadges,
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
      args: [params.bountyId, params.prUrl, params.description]
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

// Admin Management Hooks
export const useBountyMarketplaceAdmin = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const setPlatformFee = async (newFeePercentage: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'setPlatformFee',
      args: [newFeePercentage]
    });
  };

  const setFeeRecipient = async (newFeeRecipient: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'setFeeRecipient',
      args: [newFeeRecipient]
    });
  };

  const setMinimumBountyAmount = async (newMinimum: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'setMinimumBountyAmount',
      args: [newMinimum]
    });
  };

  const setMaximumClaimDuration = async (newDuration: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'setMaximumClaimDuration',
      args: [newDuration]
    });
  };

  const setContractAddresses = async (
    developerBadge: `0x${string}`,
    developerReputation: `0x${string}`,
    bountyVerifier: `0x${string}`
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'setContractAddresses',
      args: [developerBadge, developerReputation, bountyVerifier]
    });
  };

  const pause = async () => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'pause',
      args: []
    });
  };

  const unpause = async () => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'unpause',
      args: []
    });
  };

  const emergencyWithdraw = async () => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'emergencyWithdraw',
      args: []
    });
  };

  const grantRole = async (role: `0x${string}`, account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'grantRole',
      args: [role, account]
    });
  };

  const revokeRole = async (role: `0x${string}`, account: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'revokeRole',
      args: [role, account]
    });
  };

  const renounceRole = async (role: `0x${string}`, callerConfirmation: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
      abi: BountyMarketplaceABI,
      functionName: 'renounceRole',
      args: [role, callerConfirmation]
    });
  };

  return {
    setPlatformFee,
    setFeeRecipient,
    setMinimumBountyAmount,
    setMaximumClaimDuration,
    setContractAddresses,
    pause,
    unpause,
    emergencyWithdraw,
    grantRole,
    revokeRole,
    renounceRole,
    hash,
    isPending,
    error
  };
};

// Role Constants Hooks
export const useRoleConstants = () => {
  const { data: defaultAdminRole } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'DEFAULT_ADMIN_ROLE'
  });

  const { data: adminRole } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'ADMIN_ROLE'
  });

  const { data: maintainerRole } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'MAINTAINER_ROLE'
  });
 
  const { data: verifierRole } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'VERIFIER_ROLE'
  });

  return {
    defaultAdminRole,
    adminRole,
    maintainerRole,
    verifierRole
  };
};

// Contract References Hooks
export const useContractReferences = () => {
  const { data: developerBadge } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'developerBadge'
  });

  const { data: developerReputation } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'developerReputation'
  });

  const { data: bountyVerifier } = useReadContract({
    address: CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE,
    abi: BountyMarketplaceABI,
    functionName: 'bountyVerifier'
  });

  return {
    developerBadge,
    developerReputation,
    bountyVerifier
  };
};

export default {
  useBountyMarketplace,
  useBountyData,
  useGetBounty,
  useTotalBounties,
  useAllBounties,
  useBountiesByStatus,
  useBountySubmissions,
  useMaintainerBounties,
  useDeveloperClaims,
  useDeveloperCompletions,
  usePlatformFeePercentage,
  useMinimumBountyAmount,
  useMaximumClaimDuration,
  useFeeRecipient,
  useIsPaused,
  useHasRole,
  useHasSubmitted,
  useDeveloperReputation,
  useReputationData,
  useDeveloperBadge,
  useBadgeData,
  // New Enhanced Developer Badge Hooks
  useDeveloperBadgeRead,
  useDeveloperBadgeWrite,
  useDeveloperBadgeOperations,
  useDeveloperBadgeQueries,
  useBadgeTypeQueries,
  useBountyBadgeQueries,
  // Existing hooks
  useBountyVerifier,
  useSubmissionData,
  useTransactionStatus,
  useConnectXData,
  useBountyMarketplaceAdmin,
  useRoleConstants,
  useContractReferences,
  // New Role Management Hooks
  useCanVerifyBounties
};

// Role Constants for easy access
export const ROLE_CONSTANTS = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  MAINTAINER_ROLE: '0x46925e0f0cc76e485772167edccb8dc449d43b23b55fc4e756b063f49099e6a0',
  VERIFIER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
} as const;
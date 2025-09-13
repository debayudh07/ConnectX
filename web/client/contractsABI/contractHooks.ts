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
      {"indexed": true, "internalType": "address", "name": "developer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "newScore", "type": "uint256"},
      {"indexed": false, "internalType": "int256", "name": "scoreChange", "type": "int256"},
      {"indexed": false, "internalType": "uint256", "name": "newTier", "type": "uint256"}
    ],
    "name": "ReputationUpdated",
    "type": "event"
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
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UPDATER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "developerStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalScore", "type": "uint256"},
      {"internalType": "uint256", "name": "bountyCompletions", "type": "uint256"},
      {"internalType": "uint256", "name": "currentStreak", "type": "uint256"},
      {"internalType": "uint256", "name": "maxStreak", "type": "uint256"},
      {"internalType": "uint256", "name": "tier", "type": "uint256"},
      {"internalType": "uint256", "name": "lastActivityDate", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_developer", "type": "address"}],
    "name": "getDeveloperStats",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "totalScore", "type": "uint256"},
          {"internalType": "uint256", "name": "bountyCompletions", "type": "uint256"},
          {"internalType": "uint256", "name": "currentStreak", "type": "uint256"},
          {"internalType": "uint256", "name": "maxStreak", "type": "uint256"},
          {"internalType": "uint256", "name": "tier", "type": "uint256"},
          {"internalType": "uint256", "name": "lastActivityDate", "type": "uint256"}
        ],
        "internalType": "struct DeveloperReputation.DeveloperStats",
        "name": "",
        "type": "tuple"
      }
    ],
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
    "inputs": [
      {"internalType": "address", "name": "_developer", "type": "address"},
      {"internalType": "string", "name": "_skill", "type": "string"}
    ],
    "name": "getSkillScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
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
    "inputs": [
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "name": "skillScores",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
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
      {"internalType": "address", "name": "_developer", "type": "address"},
      {"internalType": "int256", "name": "_scoreChange", "type": "int256"},
      {"internalType": "string[]", "name": "_skillsUsed", "type": "string[]"}
    ],
    "name": "updateReputation",
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
      {"internalType": "address", "name": "account", "type": "address"},
      {"internalType": "bytes32", "name": "neededRole", "type": "bytes32"}
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "sender", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "operator", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "approver", "type": "address"}],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "receiver", "type": "address"}],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "sender", "type": "address"}],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "approved", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "operator", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "approved", "type": "bool"}
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "badgeType", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "BadgeMinted",
    "type": "event"
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
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Transfer",
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
    "name": "MINTER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "badges",
    "outputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "string", "name": "badgeType", "type": "string"},
      {"internalType": "string", "name": "metadata", "type": "string"},
      {"internalType": "uint256", "name": "mintedAt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getApproved",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_tokenId", "type": "uint256"}],
    "name": "getBadgeInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "string", "name": "badgeType", "type": "string"},
          {"internalType": "string", "name": "metadata", "type": "string"},
          {"internalType": "uint256", "name": "mintedAt", "type": "uint256"}
        ],
        "internalType": "struct DeveloperBadge.Badge",
        "name": "",
        "type": "tuple"
      }
    ],
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
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "operator", "type": "address"}
    ],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_recipient", "type": "address"},
      {"internalType": "string", "name": "_badgeType", "type": "string"},
      {"internalType": "string", "name": "_metadataURI", "type": "string"}
    ],
    "name": "mintBadge",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "operator", "type": "address"},
      {"internalType": "bool", "name": "approved", "type": "bool"}
    ],
    "name": "setApprovalForAll",
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
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint256", "name": "index", "type": "uint256"}
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
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
  useGetBounty,
  useTotalBounties,
  useAllBounties,
  useBountiesByStatus,
  useBountySubmissions,
  useMaintainerBounties,
  useDeveloperClaims,
  useDeveloperCompletions,
  useDeveloperReputation,
  useReputationData,
  useDeveloperBadge,
  useBadgeData,
  useBountyVerifier,
  useSubmissionData,
  useTransactionStatus,
  useConnectXData
};
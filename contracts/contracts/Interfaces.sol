// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IBountyVerifier
 * @dev Interface for external bounty verification systems
 * This interface allows integration with oracles or off-chain verification services
 * to automatically verify GitHub PR submissions
 */
interface IBountyVerifier {
    /**
     * @dev Verifies a bounty submission
     * @param bountyId The ID of the bounty being verified
     * @param prUrl The GitHub pull request URL
     * @param submitter The address of the developer who submitted the work
     * @return bool True if the submission is verified, false otherwise
     */
    function verifySubmission(
        uint256 bountyId,
        string memory prUrl,
        address submitter
    ) external returns (bool);
    
    /**
     * @dev Checks if a PR is merged in the target repository
     * @param prUrl The GitHub pull request URL
     * @param repositoryUrl The target repository URL
     * @return bool True if the PR is merged, false otherwise
     */
    function isPRMerged(
        string memory prUrl,
        string memory repositoryUrl
    ) external view returns (bool);
    
    /**
     * @dev Gets the status of a pull request
     * @param prUrl The GitHub pull request URL
     * @return status The status of the PR (0: open, 1: merged, 2: closed)
     * @return author The GitHub username of the PR author
     * @return title The title of the pull request
     */
    function getPRStatus(string memory prUrl) external view returns (
        uint8 status,
        string memory author,
        string memory title
    );
    
    /**
     * @dev Verifies that the submitter owns the GitHub account that created the PR
     * @param prUrl The GitHub pull request URL
     * @param submitter The Ethereum address of the submitter
     * @return bool True if the submitter owns the GitHub account, false otherwise
     */
    function verifyGitHubOwnership(
        string memory prUrl,
        address submitter
    ) external view returns (bool);
}

/**
 * @title IDeveloperBadge
 * @dev Interface for the developer badge NFT contract
 */
interface IDeveloperBadge {
    /**
     * @dev Mints a badge for a completed bounty
     * @param developer The address of the developer
     * @param bountyId The ID of the completed bounty
     * @param metadata JSON metadata for the badge
     * @return tokenId The ID of the minted badge token
     */
    function mintBadge(
        address developer,
        uint256 bountyId,
        string memory metadata
    ) external returns (uint256);
    
    /**
     * @dev Mints a custom achievement badge
     * @param developer The address of the developer
     * @param bountyId The ID of the bounty (0 for non-bounty achievements)
     * @param rewardAmount The reward amount for this achievement
     * @param githubIssueUrl The GitHub issue URL
     * @param repositoryUrl The repository URL
     * @param difficultyLevel The difficulty level (1-5)
     * @param skills Comma-separated list of skills
     * @param badgeType Type of badge (1: Completion, 2: Streak, 3: Special)
     * @param achievementName Name of the achievement
     * @return tokenId The ID of the minted badge token
     */
    function mintCustomBadge(
        address developer,
        uint256 bountyId,
        uint256 rewardAmount,
        string memory githubIssueUrl,
        string memory repositoryUrl,
        uint256 difficultyLevel,
        string memory skills,
        uint256 badgeType,
        string memory achievementName
    ) external returns (uint256);
    
    /**
     * @dev Mints a streak achievement badge
     * @param developer The address of the developer
     * @param streakCount The streak count achieved
     * @param achievementName Name of the streak achievement
     * @return tokenId The ID of the minted badge token
     */
    function mintStreakBadge(
        address developer,
        uint256 streakCount,
        string memory achievementName
    ) external returns (uint256);
    
    /**
     * @dev Gets all badge token IDs owned by a developer
     * @param developer The address of the developer
     * @return tokenIds Array of token IDs owned by the developer
     */
    function getDeveloperBadges(address developer) external view returns (uint256[] memory);
    
    /**
     * @dev Gets the number of badges owned by a developer
     * @param developer The address of the developer
     * @return count The number of badges owned
     */
    function getDeveloperBadgeCount(address developer) external view returns (uint256);
}

/**
 * @title IDeveloperReputation
 * @dev Interface for the developer reputation system
 */
interface IDeveloperReputation {
    /**
     * @dev Updates a developer's reputation after bounty completion
     * @param developer The address of the developer
     * @param bountyValue The value of the completed bounty in wei
     * @param isCompleted Whether the bounty was successfully completed
     */
    function updateReputation(
        address developer,
        uint256 bountyValue,
        bool isCompleted
    ) external;
    
    /**
     * @dev Updates difficulty and skills for a developer
     * @param developer The address of the developer
     * @param difficulty The difficulty level of the completed bounty
     * @param skills Array of skills demonstrated in the bounty
     */
    function updateDifficultyAndSkills(
        address developer,
        uint256 difficulty,
        string[] memory skills
    ) external;
    
    /**
     * @dev Gets the reputation score of a developer
     * @param developer The address of the developer
     * @return score The reputation score
     */
    function getReputation(address developer) external view returns (uint256);
    
    /**
     * @dev Gets the number of completed bounties for a developer
     * @param developer The address of the developer
     * @return count The number of completed bounties
     */
    function getCompletedBounties(address developer) external view returns (uint256);
    
    /**
     * @dev Gets the current streak of a developer
     * @param developer The address of the developer
     * @return streak The current streak count
     */
    function getCurrentStreak(address developer) external view returns (uint256);
    
    /**
     * @dev Gets the longest streak achieved by a developer
     * @param developer The address of the developer
     * @return streak The longest streak count
     */
    function getLongestStreak(address developer) external view returns (uint256);
    
    /**
     * @dev Gets the current tier of a developer
     * @param developer The address of the developer
     * @return tier The current tier name
     */
    function getCurrentTier(address developer) external view returns (string memory);
    
    /**
     * @dev Gets all skills demonstrated by a developer
     * @param developer The address of the developer
     * @return skills Array of skill names
     */
    function getDeveloperSkills(address developer) external view returns (string[] memory);
}

/**
 * @title IGitHubOracle
 * @dev Interface for GitHub data oracles
 * This interface defines methods for interacting with GitHub API through oracles
 */
interface IGitHubOracle {
    struct Repository {
        string owner;
        string name;
        string defaultBranch;
        bool isPrivate;
        uint256 lastUpdated;
    }
    
    struct PullRequest {
        uint256 number;
        string title;
        string author;
        string headBranch;
        string baseBranch;
        uint8 state; // 0: open, 1: merged, 2: closed
        uint256 createdAt;
        uint256 mergedAt;
        bool isDraft;
    }
    
    struct Issue {
        uint256 number;
        string title;
        string author;
        uint8 state; // 0: open, 1: closed
        string[] labels;
        uint256 createdAt;
        uint256 closedAt;
    }
    
    /**
     * @dev Requests repository information from GitHub
     * @param repositoryUrl The GitHub repository URL
     * @return requestId The ID of the oracle request
     */
    function requestRepositoryInfo(string memory repositoryUrl) external returns (bytes32 requestId);
    
    /**
     * @dev Requests pull request information from GitHub
     * @param prUrl The GitHub pull request URL
     * @return requestId The ID of the oracle request
     */
    function requestPullRequestInfo(string memory prUrl) external returns (bytes32 requestId);
    
    /**
     * @dev Requests issue information from GitHub
     * @param issueUrl The GitHub issue URL
     * @return requestId The ID of the oracle request
     */
    function requestIssueInfo(string memory issueUrl) external returns (bytes32 requestId);
    
    /**
     * @dev Verifies GitHub account ownership through signed message
     * @param githubUsername The GitHub username
     * @param ethereumAddress The Ethereum address to verify
     * @param signature The signature proving ownership
     * @return bool True if ownership is verified, false otherwise
     */
    function verifyAccountOwnership(
        string memory githubUsername,
        address ethereumAddress,
        bytes memory signature
    ) external view returns (bool);
    
    /**
     * @dev Gets cached repository information
     * @param repositoryUrl The GitHub repository URL
     * @return repository The cached repository information
     */
    function getRepositoryInfo(string memory repositoryUrl) external view returns (Repository memory);
    
    /**
     * @dev Gets cached pull request information
     * @param prUrl The GitHub pull request URL
     * @return pullRequest The cached pull request information
     */
    function getPullRequestInfo(string memory prUrl) external view returns (PullRequest memory);
    
    /**
     * @dev Gets cached issue information
     * @param issueUrl The GitHub issue URL
     * @return issue The cached issue information
     */
    function getIssueInfo(string memory issueUrl) external view returns (Issue memory);
}

/**
 * @title IChainlinkPriceFeed
 * @dev Interface for Chainlink price feeds to get AVAX/USD price
 */
interface IChainlinkPriceFeed {
    /**
     * @dev Gets the latest price data
     * @return roundId The round ID
     * @return price The latest price
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    
    /**
     * @dev Gets the number of decimals for the price feed
     * @return decimals The number of decimals
     */
    function decimals() external view returns (uint8);
    
    /**
     * @dev Gets the description of the price feed
     * @return description The description string
     */
    function description() external view returns (string memory);
}

/**
 * @title IMarketplaceEvents
 * @dev Interface defining all marketplace events for external integrations
 */
interface IMarketplaceEvents {
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed maintainer,
        string githubIssueUrl,
        uint256 rewardAmount,
        uint256 deadline
    );
    
    event BountyClaimed(
        uint256 indexed bountyId,
        address indexed developer,
        uint256 claimedAt
    );
    
    event BountySubmitted(
        uint256 indexed bountyId,
        address indexed developer,
        string prUrl,
        uint256 submittedAt
    );
    
    event BountyVerified(
        uint256 indexed bountyId,
        address indexed developer,
        uint256 verifiedAt
    );
    
    event BountyPaid(
        uint256 indexed bountyId,
        address indexed developer,
        uint256 amount,
        uint256 badgeTokenId
    );
    
    event ReputationUpdated(
        address indexed developer,
        uint256 oldScore,
        uint256 newScore,
        uint256 bountyValue,
        bool streakContinued
    );
    
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed developer,
        uint256 indexed bountyId,
        uint256 badgeType,
        string achievementName
    );
}
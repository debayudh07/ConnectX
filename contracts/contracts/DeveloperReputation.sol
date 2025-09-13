// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract DeveloperReputation is AccessControl, Pausable {
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct DeveloperProfile {
        uint256 totalBountiesCompleted;
        uint256 totalValueEarned;
        uint256 reputationScore;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastCompletionTimestamp;
        uint256 averageDifficulty;
        uint256 totalDifficultyPoints;
        mapping(string => uint256) skillCompletions; // skill name => count
        string[] skillsList;
        bool exists;
    }
    
    struct StreakReward {
        uint256 streakLength;
        uint256 reputationBonus;
        bool isActive;
    }
    
    struct ReputationTier {
        string name;
        uint256 minScore;
        uint256 maxScore;
        uint256 multiplier; // in basis points (10000 = 100%)
    }
    
    // Storage
    mapping(address => DeveloperProfile) public developers;
    mapping(address => string[]) public developerSkills;
    mapping(address => mapping(string => bool)) public hasSkill;
    
    // Gamification settings
    mapping(uint256 => StreakReward) public streakRewards;
    ReputationTier[] public reputationTiers;
    
    // Constants for reputation calculation
    uint256 public constant BASE_REPUTATION_PER_BOUNTY = 100;
    uint256 public constant REPUTATION_PER_AVAX = 10; // 10 reputation points per AVAX earned
    uint256 public constant DIFFICULTY_MULTIPLIER = 200; // 200 basis points per difficulty level
    uint256 public constant STREAK_DEADLINE = 7 days; // Time window to maintain streak
    uint256 public constant MAX_REPUTATION_SCORE = 1000000; // 1 million max
    
    // Platform statistics
    uint256 public totalDevelopers;
    uint256 public totalBountiesCompleted;
    uint256 public totalValueDistributed;
    
    // Events
    event ReputationUpdated(
        address indexed developer,
        uint256 oldScore,
        uint256 newScore,
        uint256 bountyValue,
        bool streakContinued
    );
    
    event StreakUpdated(
        address indexed developer,
        uint256 oldStreak,
        uint256 newStreak,
        bool isNewRecord
    );
    
    event SkillAdded(
        address indexed developer,
        string skill
    );
    
    event TierChanged(
        address indexed developer,
        string oldTier,
        string newTier
    );
    
    event StreakRewardClaimed(
        address indexed developer,
        uint256 streakLength,
        uint256 reputationBonus
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Initialize reputation tiers
        _initializeReputationTiers();
        
        // Initialize streak rewards
        _initializeStreakRewards();
    }
    
    function _initializeReputationTiers() internal {
        reputationTiers.push(ReputationTier("Newcomer", 0, 999, 10000));
        reputationTiers.push(ReputationTier("Contributor", 1000, 4999, 11000));
        reputationTiers.push(ReputationTier("Developer", 5000, 14999, 12000));
        reputationTiers.push(ReputationTier("Expert", 15000, 39999, 13000));
        reputationTiers.push(ReputationTier("Master", 40000, 99999, 15000));
        reputationTiers.push(ReputationTier("Legend", 100000, MAX_REPUTATION_SCORE, 20000));
    }
    
    function _initializeStreakRewards() internal {
        streakRewards[3] = StreakReward(3, 50, true);   // 3 day streak
        streakRewards[7] = StreakReward(7, 150, true);  // 1 week streak
        streakRewards[14] = StreakReward(14, 350, true); // 2 week streak
        streakRewards[30] = StreakReward(30, 750, true); // 1 month streak
        streakRewards[60] = StreakReward(60, 1500, true); // 2 month streak
        streakRewards[90] = StreakReward(90, 3000, true); // 3 month streak
    }
    
    // Helper functions for internal logic
    function _getCurrentTierInfo(uint256 score) internal view returns (ReputationTier memory) {
        for (uint256 i = 0; i < reputationTiers.length; i++) {
            if (score >= reputationTiers[i].minScore && score <= reputationTiers[i].maxScore) {
                return reputationTiers[i];
            }
        }
        return reputationTiers[0]; // Return Newcomer as default
    }
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    // Public view functions that are used internally
    function getCurrentStreak(address developer) public view returns (uint256) {
        DeveloperProfile storage profile = developers[developer];
        
        // Check if streak is still valid
        if (profile.lastCompletionTimestamp > 0) {
            uint256 timeSinceLastCompletion = block.timestamp - profile.lastCompletionTimestamp;
            if (timeSinceLastCompletion > STREAK_DEADLINE) {
                return 0; // Streak expired
            }
        }
        
        return profile.currentStreak;
    }
    
    function getCurrentTier(address developer) public view returns (string memory) {
        uint256 score = developers[developer].reputationScore;
        ReputationTier memory tier = _getCurrentTierInfo(score);
        return tier.name;
    }
    
    function updateReputation(
        address developer,
        uint256 bountyValue,
        bool isCompleted
    ) external onlyRole(MARKETPLACE_ROLE) whenNotPaused {
        require(developer != address(0), "DeveloperReputation: invalid developer address");
        
        DeveloperProfile storage profile = developers[developer];
        
        // Initialize developer if doesn't exist
        if (!profile.exists) {
            profile.exists = true;
            totalDevelopers++;
        }
        
        if (isCompleted) {
            uint256 oldScore = profile.reputationScore;
            string memory oldTier = getCurrentTier(developer);
            
            // Update basic stats
            profile.totalBountiesCompleted++;
            profile.totalValueEarned += bountyValue;
            totalBountiesCompleted++;
            totalValueDistributed += bountyValue;
            
            // Calculate reputation gain
            uint256 reputationGain = _calculateReputationGain(bountyValue, profile.averageDifficulty);
            
            // Update streak
            bool streakContinued = _updateStreak(developer, profile);
            
            // Apply streak multiplier if applicable
            if (profile.currentStreak >= 3) {
                uint256 streakMultiplier = _getStreakMultiplier(profile.currentStreak);
                reputationGain = (reputationGain * streakMultiplier) / 10000;
            }
            
            // Apply tier multiplier
            ReputationTier memory currentTier = _getCurrentTierInfo(profile.reputationScore);
            reputationGain = (reputationGain * currentTier.multiplier) / 10000;
            
            // Update reputation score
            profile.reputationScore = _min(profile.reputationScore + reputationGain, MAX_REPUTATION_SCORE);
            profile.lastCompletionTimestamp = block.timestamp;
            
            // Check for tier change
            string memory newTier = getCurrentTier(developer);
            if (keccak256(bytes(oldTier)) != keccak256(bytes(newTier))) {
                emit TierChanged(developer, oldTier, newTier);
            }
            
            emit ReputationUpdated(developer, oldScore, profile.reputationScore, bountyValue, streakContinued);
        }
    }
    
    function updateDifficultyAndSkills(
        address developer,
        uint256 difficulty,
        string[] memory skills
    ) external onlyRole(MARKETPLACE_ROLE) whenNotPaused {
        require(developer != address(0), "DeveloperReputation: invalid developer address");
        require(difficulty >= 1 && difficulty <= 5, "DeveloperReputation: invalid difficulty");
        
        DeveloperProfile storage profile = developers[developer];
        require(profile.exists, "DeveloperReputation: developer not found");
        
        // Update average difficulty
        profile.totalDifficultyPoints += difficulty;
        profile.averageDifficulty = profile.totalDifficultyPoints / profile.totalBountiesCompleted;
        
        // Update skills
        for (uint256 i = 0; i < skills.length; i++) {
            if (!hasSkill[developer][skills[i]]) {
                hasSkill[developer][skills[i]] = true;
                developerSkills[developer].push(skills[i]);
                profile.skillCompletions[skills[i]] = 1;
                emit SkillAdded(developer, skills[i]);
            } else {
                profile.skillCompletions[skills[i]]++;
            }
        }
    }
    
    function _updateStreak(address developer, DeveloperProfile storage profile) internal returns (bool) {
        uint256 timeSinceLastCompletion = block.timestamp - profile.lastCompletionTimestamp;
        uint256 oldStreak = profile.currentStreak;
        bool streakContinued = false;
        
        if (profile.lastCompletionTimestamp == 0 || timeSinceLastCompletion <= STREAK_DEADLINE) {
            // Continue or start streak
            profile.currentStreak++;
            streakContinued = true;
            
            // Update longest streak if necessary
            if (profile.currentStreak > profile.longestStreak) {
                profile.longestStreak = profile.currentStreak;
            }
            
            // Check for streak rewards
            if (streakRewards[profile.currentStreak].isActive) {
                _grantStreakReward(developer, profile.currentStreak);
            }
        } else {
            // Streak broken
            profile.currentStreak = 1;
        }
        
        bool isNewRecord = profile.currentStreak > oldStreak && profile.currentStreak == profile.longestStreak;
        emit StreakUpdated(developer, oldStreak, profile.currentStreak, isNewRecord);
        
        return streakContinued;
    }
    
    function _grantStreakReward(address developer, uint256 streakLength) internal {
        StreakReward memory reward = streakRewards[streakLength];
        if (reward.isActive && reward.reputationBonus > 0) {
            DeveloperProfile storage profile = developers[developer];
            profile.reputationScore = _min(
                profile.reputationScore + reward.reputationBonus,
                MAX_REPUTATION_SCORE
            );
            
            emit StreakRewardClaimed(developer, streakLength, reward.reputationBonus);
        }
    }
    
    function _calculateReputationGain(uint256 bountyValue, uint256 avgDifficulty) internal pure returns (uint256) {
        // Base reputation + value-based reputation + difficulty bonus
        uint256 valueReputation = (bountyValue / 1 ether) * REPUTATION_PER_AVAX;
        uint256 difficultyBonus = 0;
        
        if (avgDifficulty > 0) {
            difficultyBonus = (BASE_REPUTATION_PER_BOUNTY * avgDifficulty * DIFFICULTY_MULTIPLIER) / 10000;
        }
        
        return BASE_REPUTATION_PER_BOUNTY + valueReputation + difficultyBonus;
    }
    
    function _getStreakMultiplier(uint256 streak) internal pure returns (uint256) {
        if (streak >= 30) return 15000; // 150%
        if (streak >= 14) return 13000; // 130%
        if (streak >= 7) return 11500;  // 115%
        if (streak >= 3) return 11000;  // 110%
        return 10000; // 100% (no bonus)
    }
    
    // View functions
    function getReputation(address developer) external view returns (uint256) {
        return developers[developer].reputationScore;
    }
    
    function getCompletedBounties(address developer) external view returns (uint256) {
        return developers[developer].totalBountiesCompleted;
    }
    
    function getLongestStreak(address developer) external view returns (uint256) {
        return developers[developer].longestStreak;
    }
    
    function getTotalValueEarned(address developer) external view returns (uint256) {
        return developers[developer].totalValueEarned;
    }
    
    function getAverageDifficulty(address developer) external view returns (uint256) {
        return developers[developer].averageDifficulty;
    }
    
    function getDeveloperSkills(address developer) external view returns (string[] memory) {
        return developerSkills[developer];
    }
    
    function getSkillCompletions(address developer, string memory skill) external view returns (uint256) {
        return developers[developer].skillCompletions[skill];
    }
    
    function getDeveloperProfile(address developer) external view returns (
        uint256 completedBounties,
        uint256 totalValueEarned,
        uint256 reputationScore,
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 averageDifficulty,
        string memory currentTier,
        string[] memory skills
    ) {
        DeveloperProfile storage profile = developers[developer];
        return (
            profile.totalBountiesCompleted,
            profile.totalValueEarned,
            profile.reputationScore,
            getCurrentStreak(developer),
            profile.longestStreak,
            profile.averageDifficulty,
            getCurrentTier(developer),
            developerSkills[developer]
        );
 }
    
    function getTopDevelopers(uint256 limit) external pure returns (
        address[] memory addresses,
        uint256[] memory scores,
        string[] memory tiers
    ) {
        // Note: This is a simplified implementation
        // In production, consider implementing a more efficient ranking system
        require(limit > 0 && limit <= 100, "DeveloperReputation: invalid limit");
        
        addresses = new address[](limit);
        scores = new uint256[](limit);
        tiers = new string[](limit);
        
        // This is a placeholder implementation
        // A real implementation would need to maintain a sorted list or use off-chain indexing
        return (addresses, scores, tiers);
    }
    
    function getLeaderboard(uint256 /* offset */, uint256 limit) external pure returns (
        address[] memory addresses,
        uint256[] memory scores,
        uint256[] memory completedBounties,
        string[] memory tiers
    ) {
        require(limit > 0 && limit <= 50, "DeveloperReputation: invalid limit");
        
        addresses = new address[](limit);
        scores = new uint256[](limit);
        completedBounties = new uint256[](limit);
        tiers = new string[](limit);
        
        // Placeholder - would need proper implementation with indexing
        return (addresses, scores, completedBounties, tiers);
    }
    
    function getPlatformStats() external view returns (
        uint256 totalDevs,
        uint256 totalBounties,
        uint256 totalValue,
        uint256 averageReputation
    ) {
        uint256 avgReputation = 0;
        if (totalDevelopers > 0) {
            // This would need to be calculated differently in a real implementation
            avgReputation = 1000; // Placeholder
        }
        
        return (
            totalDevelopers,
            totalBountiesCompleted,
            totalValueDistributed,
            avgReputation
        );
    }
    
    // Admin functions
    function setMarketplaceRole(address marketplace) external onlyRole(ADMIN_ROLE) {
        grantRole(MARKETPLACE_ROLE, marketplace);
    }
    
    function revokeMarketplaceRole(address marketplace) external onlyRole(ADMIN_ROLE) {
        revokeRole(MARKETPLACE_ROLE, marketplace);
    }
    
    function updateStreakReward(
        uint256 streakLength,
        uint256 reputationBonus,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        streakRewards[streakLength] = StreakReward(streakLength, reputationBonus, isActive);
    }
    
    function addReputationTier(
        string memory name,
        uint256 minScore,
        uint256 maxScore,
        uint256 multiplier
    ) external onlyRole(ADMIN_ROLE) {
        require(minScore < maxScore, "DeveloperReputation: invalid score range");
        require(multiplier > 0, "DeveloperReputation: invalid multiplier");
        
        reputationTiers.push(ReputationTier(name, minScore, maxScore, multiplier));
    }
    
    function updateReputationTier(
        uint256 index,
        string memory name,
        uint256 minScore,
        uint256 maxScore,
        uint256 multiplier
    ) external onlyRole(ADMIN_ROLE) {
        require(index < reputationTiers.length, "DeveloperReputation: invalid tier index");
        require(minScore < maxScore, "DeveloperReputation: invalid score range");
        require(multiplier > 0, "DeveloperReputation: invalid multiplier");
        
        reputationTiers[index] = ReputationTier(name, minScore, maxScore, multiplier);
    }
    
    function emergencyResetDeveloper(address developer) external onlyRole(ADMIN_ROLE) {
        require(developer != address(0), "DeveloperReputation: invalid developer address");
        
        DeveloperProfile storage profile = developers[developer];
        profile.reputationScore = 0;
        profile.currentStreak = 0;
        profile.longestStreak = 0;
        profile.lastCompletionTimestamp = 0;
        
        // Clear skills
        string[] memory skills = developerSkills[developer];
        for (uint256 i = 0; i < skills.length; i++) {
            hasSkill[developer][skills[i]] = false;
        }
        delete developerSkills[developer];
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
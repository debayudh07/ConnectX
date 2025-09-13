// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeveloperBadge is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl {
    using Strings for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _nextTokenId;
    
    struct BadgeMetadata {
        uint256 bountyId;
        uint256 rewardAmount;
        string githubIssueUrl;
        string repositoryUrl;
        uint256 difficultyLevel;
        uint256 completedAt;
        address developer;
        string skills;
        uint256 badgeType; // 1: Completion, 2: Streak, 3: Special Achievement
        string achievementName;
    }
    
    // Storage
    mapping(uint256 => BadgeMetadata) public badgeMetadata;
    mapping(address => uint256[]) public developerBadges;
    mapping(address => mapping(uint256 => uint256)) public developerBadgesByType; // developer => badgeType => count
    mapping(uint256 => uint256[]) public bountyBadges; // bountyId => tokenIds
    
    // Badge type counters per developer
    mapping(address => uint256) public completionBadges;
    mapping(address => uint256) public streakBadges;
    mapping(address => uint256) public specialBadges;
    
    // Events
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed developer,
        uint256 indexed bountyId,
        uint256 badgeType,
        string achievementName
    );
    
    event BadgeTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    constructor() ERC721("Developer Achievement Badge", "DAB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _nextTokenId = 1;
    }
    
    function mintBadge(
        address developer,
        uint256 bountyId,
        string memory metadata
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "DeveloperBadge: invalid developer address");
        
        uint256 newTokenId = _nextTokenId++;
        
        // Parse metadata (simplified JSON parsing for demonstration)
        // In production, consider using a more robust JSON parser or structured input
        BadgeMetadata memory badge = BadgeMetadata({
            bountyId: bountyId,
            rewardAmount: 0, // Will be parsed from metadata
            githubIssueUrl: "",
            repositoryUrl: "",
            difficultyLevel: 1,
            completedAt: block.timestamp,
            developer: developer,
            skills: "",
            badgeType: 1, // Default to completion badge
            achievementName: "Bounty Completion"
        });
        
        badgeMetadata[newTokenId] = badge;
        developerBadges[developer].push(newTokenId);
        bountyBadges[bountyId].push(newTokenId);
        
        // Update badge type counters
        completionBadges[developer]++;
        developerBadgesByType[developer][1]++;
        
        _safeMint(developer, newTokenId);
        _setTokenURI(newTokenId, _generateTokenURI(newTokenId));
        
        emit BadgeMinted(newTokenId, developer, bountyId, 1, "Bounty Completion");
        
        return newTokenId;
    }
    
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
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "DeveloperBadge: invalid developer address");
        require(badgeType >= 1 && badgeType <= 3, "DeveloperBadge: invalid badge type");
        
        uint256 newTokenId = _nextTokenId++;
        
        BadgeMetadata memory badge = BadgeMetadata({
            bountyId: bountyId,
            rewardAmount: rewardAmount,
            githubIssueUrl: githubIssueUrl,
            repositoryUrl: repositoryUrl,
            difficultyLevel: difficultyLevel,
            completedAt: block.timestamp,
            developer: developer,
            skills: skills,
            badgeType: badgeType,
            achievementName: achievementName
        });
        
        badgeMetadata[newTokenId] = badge;
        developerBadges[developer].push(newTokenId);
        if (bountyId > 0) {
            bountyBadges[bountyId].push(newTokenId);
        }
        
        // Update badge type counters
        if (badgeType == 1) {
            completionBadges[developer]++;
        } else if (badgeType == 2) {
            streakBadges[developer]++;
        } else if (badgeType == 3) {
            specialBadges[developer]++;
        }
        
        developerBadgesByType[developer][badgeType]++;
        
        _safeMint(developer, newTokenId);
        _setTokenURI(newTokenId, _generateTokenURI(newTokenId));
        
        emit BadgeMinted(newTokenId, developer, bountyId, badgeType, achievementName);
        
        return newTokenId;
    }
    
    function mintStreakBadge(
        address developer,
        uint256 streakCount,
        string memory achievementName
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "DeveloperBadge: invalid developer address");
        require(streakCount > 0, "DeveloperBadge: invalid streak count");
        
        uint256 newTokenId = _nextTokenId++;
        
        BadgeMetadata memory badge = BadgeMetadata({
            bountyId: 0, // No specific bounty for streak badge
            rewardAmount: 0,
            githubIssueUrl: "",
            repositoryUrl: "",
            difficultyLevel: streakCount, // Use difficulty field to store streak count
            completedAt: block.timestamp,
            developer: developer,
            skills: "",
            badgeType: 2, // Streak badge
            achievementName: achievementName
        });
        
        badgeMetadata[newTokenId] = badge;
        developerBadges[developer].push(newTokenId);
        
        // Update badge counters
        streakBadges[developer]++;
        developerBadgesByType[developer][2]++;
        
        _safeMint(developer, newTokenId);
        _setTokenURI(newTokenId, _generateTokenURI(newTokenId));
        
        emit BadgeMinted(newTokenId, developer, 0, 2, achievementName);
        
        return newTokenId;
    }
    
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        BadgeMetadata memory badge = badgeMetadata[tokenId];
        
        string memory badgeTypeName = _getBadgeTypeName(badge.badgeType);
        string memory difficultyName = _getDifficultyName(badge.difficultyLevel);
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Developer Badge #',
                        tokenId.toString(),
                        '",',
                        '"description": "Achievement badge for ',
                        badge.achievementName,
                        '",',
                        '"image": "',
                        _generateBadgeImage(badge.badgeType, badge.difficultyLevel),
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Badge Type", "value": "',
                        badgeTypeName,
                        '"},',
                        '{"trait_type": "Achievement", "value": "',
                        badge.achievementName,
                        '"},',
                        '{"trait_type": "Difficulty", "value": "',
                        difficultyName,
                        '"},',
                        '{"trait_type": "Bounty ID", "value": ',
                        badge.bountyId.toString(),
                        '},',
                        '{"trait_type": "Reward Amount", "value": ',
                        badge.rewardAmount.toString(),
                        '},',
                        '{"trait_type": "Completed At", "value": ',
                        badge.completedAt.toString(),
                        '},',
                        '{"trait_type": "Developer", "value": "',
                        Strings.toHexString(uint160(badge.developer), 20),
                        '"}',
                        bytes(badge.skills).length > 0 ? string(abi.encodePacked(',{"trait_type": "Skills", "value": "', badge.skills, '"}')) : "",
                        bytes(badge.githubIssueUrl).length > 0 ? string(abi.encodePacked(',{"trait_type": "GitHub Issue", "value": "', badge.githubIssueUrl, '"}')) : "",
                        ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    function _generateBadgeImage(uint256 badgeType, uint256 difficulty) internal pure returns (string memory) {
        // Generate a simple SVG image based on badge type and difficulty
        string memory color = _getBadgeColor(badgeType, difficulty);
        string memory symbol = _getBadgeSymbol(badgeType);
        
        string memory svg = string(
            abi.encodePacked(
                '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
                '<circle cx="100" cy="100" r="90" fill="',
                color,
                '" stroke="#000" stroke-width="3"/>',
                '<text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="40" fill="white">',
                symbol,
                '</text>',
                '<text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="12" fill="white">',
                'Level ',
                difficulty.toString(),
                '</text>',
                '</svg>'
            )
        );
        
        return string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));
    }
    
    function _getBadgeColor(uint256 badgeType, uint256 difficulty) internal pure returns (string memory) {
        if (badgeType == 1) { // Completion badges
            if (difficulty <= 1) return "#CD7F32"; // Bronze
            if (difficulty <= 2) return "#C0C0C0"; // Silver
            if (difficulty <= 3) return "#FFD700"; // Gold
            if (difficulty <= 4) return "#E5E4E2"; // Platinum
            return "#B9F2FF"; // Diamond
        } else if (badgeType == 2) { // Streak badges
            return "#FF6B6B"; // Red for streaks
        } else { // Special badges
            return "#9B59B6"; // Purple for special achievements
        }
    }
    
    function _getBadgeSymbol(uint256 badgeType) internal pure returns (string memory) {
        if (badgeType == 1) return unicode"★"; // Star for completion
        if (badgeType == 2) return unicode"⚡"; // Lightning for streaks
        return unicode"♦"; // Diamond for special
    }
    
    function _getBadgeTypeName(uint256 badgeType) internal pure returns (string memory) {
        if (badgeType == 1) return "Completion";
        if (badgeType == 2) return "Streak";
        if (badgeType == 3) return "Special";
        return "Unknown";
    }
    
    function _getDifficultyName(uint256 difficulty) internal pure returns (string memory) {
        if (difficulty <= 1) return "Beginner";
        if (difficulty <= 2) return "Intermediate";
        if (difficulty <= 3) return "Advanced";
        if (difficulty <= 4) return "Expert";
        return "Master";
    }
    
    // View functions
    function getDeveloperBadges(address developer) external view returns (uint256[] memory) {
        return developerBadges[developer];
    }
    
    function getBountyBadges(uint256 bountyId) external view returns (uint256[] memory) {
        return bountyBadges[bountyId];
    }
    
    function getDeveloperBadgeCount(address developer) external view returns (uint256) {
        return developerBadges[developer].length;
    }
    
    function getDeveloperBadgesByType(address developer, uint256 badgeType) external view returns (uint256) {
        return developerBadgesByType[developer][badgeType];
    }
    
    function getBadgeDetails(uint256 tokenId) external view returns (BadgeMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "DeveloperBadge: token does not exist");
        return badgeMetadata[tokenId];
    }
    
    function getAllDeveloperBadgeDetails(address developer) external view returns (BadgeMetadata[] memory) {
        uint256[] memory tokenIds = developerBadges[developer];
        BadgeMetadata[] memory badges = new BadgeMetadata[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            badges[i] = badgeMetadata[tokenIds[i]];
        }
        
        return badges;
    }
    
    function getTotalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // Override functions for multiple inheritance
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        
        // Update badge ownership records when transferring
        if (from != address(0) && to != address(0) && from != to) {
            // Remove from sender's badges
            uint256[] storage fromBadges = developerBadges[from];
            for (uint256 i = 0; i < fromBadges.length; i++) {
                if (fromBadges[i] == tokenId) {
                    fromBadges[i] = fromBadges[fromBadges.length - 1];
                    fromBadges.pop();
                    break;
                }
            }
            
            // Add to receiver's badges
            developerBadges[to].push(tokenId);
            
            // Update badge type counters
            BadgeMetadata memory badge = badgeMetadata[tokenId];
            developerBadgesByType[from][badge.badgeType]--;
            developerBadgesByType[to][badge.badgeType]++;
            
            if (badge.badgeType == 1) {
                completionBadges[from]--;
                completionBadges[to]++;
            } else if (badge.badgeType == 2) {
                streakBadges[from]--;
                streakBadges[to]++;
            } else if (badge.badgeType == 3) {
                specialBadges[from]--;
                specialBadges[to]++;
            }
            
            emit BadgeTransferred(tokenId, from, to);
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 amount) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }
    
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Admin functions
    function setMinterRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }
    
    function revokeMinterRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }
    
    function updateBadgeMetadata(
        uint256 tokenId,
        string memory newAchievementName,
        string memory newSkills
    ) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "DeveloperBadge: token does not exist");
        
        BadgeMetadata storage badge = badgeMetadata[tokenId];
        badge.achievementName = newAchievementName;
        badge.skills = newSkills;
        
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
    }
}
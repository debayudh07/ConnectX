// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeveloperBadgeOptimized is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl {
    using Strings for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _nextTokenId;
    
    struct BadgeMetadata {
        uint256 bountyId;
        uint256 rewardAmount;
        uint256 difficultyLevel;
        uint256 completedAt;
        address developer;
        uint256 badgeType; // 1: Completion, 2: Streak, 3: Special Achievement
        string achievementName;
    }
    
    // Storage
    mapping(uint256 => BadgeMetadata) public badgeMetadata;
    mapping(address => uint256[]) public developerBadges;
    mapping(address => mapping(uint256 => uint256)) public developerBadgesByType;
    mapping(uint256 => uint256[]) public bountyBadges;
    
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
    
    event BadgeUpdated(uint256 indexed tokenId, string newAchievementName);
    
    constructor() ERC721("ConnectX Developer Badge", "CXB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _nextTokenId = 1; // Start from 1
    }
    
    // SIMPLIFIED MINTING FUNCTION - REDUCED GAS USAGE
    function mintBadge(
        address developer,
        uint256 bountyId,
        string memory /* metadata - ignored for gas optimization */
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "DeveloperBadge: invalid developer address");
        
        uint256 newTokenId = _nextTokenId++;
        
        // SIMPLIFIED metadata creation - much less gas usage
        BadgeMetadata memory badge = BadgeMetadata({
            bountyId: bountyId,
            rewardAmount: 0, // Set to 0 for gas optimization
            difficultyLevel: 1, // Default difficulty
            completedAt: block.timestamp,
            developer: developer,
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
        
        // SIMPLIFIED URI - just set a basic placeholder to avoid gas issues
        _setTokenURI(newTokenId, _generateSimpleTokenURI(newTokenId));
        
        emit BadgeMinted(newTokenId, developer, bountyId, 1, "Bounty Completion");
        
        return newTokenId;
    }
    
    // MUCH SIMPLER TOKEN URI GENERATION
    function _generateSimpleTokenURI(uint256 tokenId) internal view returns (string memory) {
        BadgeMetadata memory badge = badgeMetadata[tokenId];
        
        // Create minimal JSON - significantly reduced gas usage
        string memory json = string(
            abi.encodePacked(
                '{"name":"ConnectX Badge #',
                tokenId.toString(),
                '","description":"Developer achievement badge","image":"https://connectx.dev/badge/',
                tokenId.toString(),
                '.png","attributes":[{"trait_type":"Bounty ID","value":',
                badge.bountyId.toString(),
                '},{"trait_type":"Type","value":"Completion"}]}'
            )
        );
        
        return string(abi.encodePacked("data:application/json;utf8,", json));
    }
    
    function mintCustomBadge(
        address developer,
        uint256 bountyId,
        uint256 rewardAmount,
        uint256 difficultyLevel,
        uint256 badgeType,
        string memory achievementName
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "DeveloperBadge: invalid developer address");
        require(badgeType >= 1 && badgeType <= 3, "DeveloperBadge: invalid badge type");
        
        uint256 newTokenId = _nextTokenId++;
        
        BadgeMetadata memory badge = BadgeMetadata({
            bountyId: bountyId,
            rewardAmount: rewardAmount,
            difficultyLevel: difficultyLevel,
            completedAt: block.timestamp,
            developer: developer,
            badgeType: badgeType,
            achievementName: achievementName
        });
        
        badgeMetadata[newTokenId] = badge;
        developerBadges[developer].push(newTokenId);
        bountyBadges[bountyId].push(newTokenId);
        
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
        _setTokenURI(newTokenId, _generateSimpleTokenURI(newTokenId));
        
        emit BadgeMinted(newTokenId, developer, bountyId, badgeType, achievementName);
        
        return newTokenId;
    }
    
    // View functions
    function getDeveloperBadges(address developer) external view returns (uint256[] memory) {
        return developerBadges[developer];
    }
    
    function getBadgesByType(address developer, uint256 badgeType) external view returns (uint256) {
        return developerBadgesByType[developer][badgeType];
    }
    
    function getBountyBadges(uint256 bountyId) external view returns (uint256[] memory) {
        return bountyBadges[bountyId];
    }
    
    function getDeveloperBadgeCount(address developer) external view returns (uint256) {
        return developerBadges[developer].length;
    }
    
    // Admin functions
    function setMinterRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }
    
    function revokeMinterRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }
    
    function updateTokenURI(uint256 tokenId, string memory newURI) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "DeveloperBadge: token does not exist");
        _setTokenURI(tokenId, newURI);
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
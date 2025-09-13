// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/DeveloperBadge.sol";

contract DeveloperBadgeTest is Test {
    DeveloperBadge public developerBadge;
    
    address public deployer;
    address public minter;
    address public developer1;
    address public developer2;
    address public admin;
    
    // Events to test
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
    
    function setUp() public {
        deployer = address(this);
        minter = address(0x1);
        developer1 = address(0x2);
        developer2 = address(0x3);
        admin = address(0x4);
        
        // Deploy DeveloperBadge contract
        developerBadge = new DeveloperBadge();
        
        // Grant minter role to test account
        developerBadge.setMinterRole(minter);
    }
    
    function testDeployment() public view {
        assertEq(developerBadge.name(), "Developer Achievement Badge");
        assertEq(developerBadge.symbol(), "DAB");
        assertEq(developerBadge.getTotalSupply(), 0);
    }
    
    function testMintBadge() public {
        uint256 bountyId = 1;
        string memory metadata = "test metadata";
        
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintBadge(developer1, bountyId, metadata);
        
        assertEq(tokenId, 1);
        assertEq(developerBadge.ownerOf(tokenId), developer1);
        assertEq(developerBadge.getTotalSupply(), 1);
        
        // Check badge metadata
        DeveloperBadge.BadgeMetadata memory badge = developerBadge.getBadgeDetails(tokenId);
        assertEq(badge.bountyId, bountyId);
        assertEq(badge.developer, developer1);
        assertEq(badge.badgeType, 1); // Completion badge
        assertEq(badge.achievementName, "Bounty Completion");
    }
    
    function testMintCustomBadge() public {
        uint256 bountyId = 2;
        uint256 rewardAmount = 1 ether;
        string memory githubIssueUrl = "https://github.com/test/issue/1";
        string memory repositoryUrl = "https://github.com/test/repo";
        uint256 difficultyLevel = 3;
        string memory skills = "JavaScript,Solidity";
        uint256 badgeType = 1;
        string memory achievementName = "Smart Contract Developer";
        
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintCustomBadge(
            developer1,
            bountyId,
            rewardAmount,
            githubIssueUrl,
            repositoryUrl,
            difficultyLevel,
            skills,
            badgeType,
            achievementName
        );
        
        assertEq(tokenId, 1);
        assertEq(developerBadge.ownerOf(tokenId), developer1);
        
        // Check custom badge metadata
        DeveloperBadge.BadgeMetadata memory badge = developerBadge.getBadgeDetails(tokenId);
        assertEq(badge.bountyId, bountyId);
        assertEq(badge.rewardAmount, rewardAmount);
        assertEq(badge.githubIssueUrl, githubIssueUrl);
        assertEq(badge.repositoryUrl, repositoryUrl);
        assertEq(badge.difficultyLevel, difficultyLevel);
        assertEq(badge.skills, skills);
        assertEq(badge.badgeType, badgeType);
        assertEq(badge.achievementName, achievementName);
        assertEq(badge.developer, developer1);
    }
    
    function testMintStreakBadge() public {
        uint256 streakCount = 7;
        string memory achievementName = "Week Warrior";
        
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintStreakBadge(
            developer1,
            streakCount,
            achievementName
        );
        
        assertEq(tokenId, 1);
        assertEq(developerBadge.ownerOf(tokenId), developer1);
        
        // Check streak badge metadata
        DeveloperBadge.BadgeMetadata memory badge = developerBadge.getBadgeDetails(tokenId);
        assertEq(badge.bountyId, 0); // No specific bounty for streak badge
        assertEq(badge.difficultyLevel, streakCount); // Streak count stored in difficulty field
        assertEq(badge.badgeType, 2); // Streak badge
        assertEq(badge.achievementName, achievementName);
        assertEq(badge.developer, developer1);
    }
    
    function testBadgeMintedEvent() public {
        uint256 bountyId = 1;
        string memory metadata = "test metadata";
        
        vm.expectEmit(true, true, true, true);
        emit BadgeMinted(1, developer1, bountyId, 1, "Bounty Completion");
        
        vm.prank(minter);
        developerBadge.mintBadge(developer1, bountyId, metadata);
    }
    
    function testOnlyMinterCanMint() public {
        uint256 bountyId = 1;
        string memory metadata = "test metadata";
        
        vm.expectRevert();
        vm.prank(developer1);
        developerBadge.mintBadge(developer1, bountyId, metadata);
    }
    
    function testInvalidBadgeType() public {
        vm.expectRevert("DeveloperBadge: invalid badge type");
        vm.prank(minter);
        developerBadge.mintCustomBadge(
            developer1,
            1,
            1 ether,
            "url",
            "repo",
            1,
            "skills",
            4, // Invalid badge type
            "test"
        );
    }
    
    function testInvalidDeveloperAddress() public {
        vm.expectRevert("DeveloperBadge: invalid developer address");
        vm.prank(minter);
        developerBadge.mintBadge(address(0), 1, "metadata");
    }
    
    function testBadgeCounters() public {
        // Mint different types of badges
        vm.startPrank(minter);
        
        // Completion badge
        developerBadge.mintBadge(developer1, 1, "metadata");
        
        // Streak badge
        developerBadge.mintStreakBadge(developer1, 5, "Streak Master");
        
        // Special badge
        developerBadge.mintCustomBadge(
            developer1, 0, 0, "", "", 1, "", 3, "Special Achievement"
        );
        
        vm.stopPrank();
        
        // Check counters
        assertEq(developerBadge.completionBadges(developer1), 1);
        assertEq(developerBadge.streakBadges(developer1), 1);
        assertEq(developerBadge.specialBadges(developer1), 1);
        assertEq(developerBadge.getDeveloperBadgeCount(developer1), 3);
        assertEq(developerBadge.getDeveloperBadgesByType(developer1, 1), 1); // Completion
        assertEq(developerBadge.getDeveloperBadgesByType(developer1, 2), 1); // Streak
        assertEq(developerBadge.getDeveloperBadgesByType(developer1, 3), 1); // Special
    }
    
    function testGetDeveloperBadges() public {
        vm.startPrank(minter);
        
        uint256 tokenId1 = developerBadge.mintBadge(developer1, 1, "metadata1");
        uint256 tokenId2 = developerBadge.mintBadge(developer1, 2, "metadata2");
        
        vm.stopPrank();
        
        uint256[] memory badges = developerBadge.getDeveloperBadges(developer1);
        assertEq(badges.length, 2);
        assertEq(badges[0], tokenId1);
        assertEq(badges[1], tokenId2);
    }
    
    function testGetBountyBadges() public {
        uint256 bountyId = 5;
        
        vm.startPrank(minter);
        
        uint256 tokenId1 = developerBadge.mintBadge(developer1, bountyId, "metadata1");
        uint256 tokenId2 = developerBadge.mintCustomBadge(
            developer2, bountyId, 1 ether, "url", "repo", 2, "skills", 1, "Custom"
        );
        
        vm.stopPrank();
        
        uint256[] memory bountyBadges = developerBadge.getBountyBadges(bountyId);
        assertEq(bountyBadges.length, 2);
        assertEq(bountyBadges[0], tokenId1);
        assertEq(bountyBadges[1], tokenId2);
    }
    
    function testGetAllDeveloperBadgeDetails() public {
        vm.startPrank(minter);
        
        developerBadge.mintBadge(developer1, 1, "metadata1");
        developerBadge.mintStreakBadge(developer1, 3, "Streak");
        
        vm.stopPrank();
        
        DeveloperBadge.BadgeMetadata[] memory badges = 
            developerBadge.getAllDeveloperBadgeDetails(developer1);
        
        assertEq(badges.length, 2);
        assertEq(badges[0].badgeType, 1); // Completion
        assertEq(badges[1].badgeType, 2); // Streak
    }
    
    function testTokenURI() public {
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintBadge(developer1, 1, "metadata");
        
        string memory uri = developerBadge.tokenURI(tokenId);
        
        // Should return a data URI with base64 encoded JSON
        assertTrue(bytes(uri).length > 0);
        
        // Check if it starts with the expected prefix
        bytes memory prefix = "data:application/json;base64,";
        bytes memory uriBytes = bytes(uri);
        
        bool hasPrefix = true;
        if (uriBytes.length >= prefix.length) {
            for (uint i = 0; i < prefix.length; i++) {
                if (uriBytes[i] != prefix[i]) {
                    hasPrefix = false;
                    break;
                }
            }
        } else {
            hasPrefix = false;
        }
        
        assertTrue(hasPrefix);
    }
    
    function testBadgeTransfer() public {
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintBadge(developer1, 1, "metadata");
        
        // Transfer badge from developer1 to developer2
        vm.expectEmit(true, true, true, true);
        emit BadgeTransferred(tokenId, developer1, developer2);
        
        vm.prank(developer1);
        developerBadge.transferFrom(developer1, developer2, tokenId);
        
        // Check ownership changed
        assertEq(developerBadge.ownerOf(tokenId), developer2);
        
        // Check badge counters updated
        assertEq(developerBadge.completionBadges(developer1), 0);
        assertEq(developerBadge.completionBadges(developer2), 1);
        
        // Check developer badge lists updated
        uint256[] memory dev1Badges = developerBadge.getDeveloperBadges(developer1);
        uint256[] memory dev2Badges = developerBadge.getDeveloperBadges(developer2);
        
        assertEq(dev1Badges.length, 0);
        assertEq(dev2Badges.length, 1);
        assertEq(dev2Badges[0], tokenId);
    }
    
    function testSupportsInterface() public view {
        // Check ERC721 interface
        assertTrue(developerBadge.supportsInterface(0x80ac58cd));
        
        // Check ERC721Metadata interface
        assertTrue(developerBadge.supportsInterface(0x5b5e139f));
        
        // Check ERC721Enumerable interface
        assertTrue(developerBadge.supportsInterface(0x780e9d63));
        
        // Check AccessControl interface
        assertTrue(developerBadge.supportsInterface(0x7965db0b));
    }
    
    function testAdminCanSetMinterRole() public {
        address newMinter = address(0x5);
        
        developerBadge.setMinterRole(newMinter);
        
        // New minter should be able to mint
        vm.prank(newMinter);
        uint256 tokenId = developerBadge.mintBadge(developer1, 1, "metadata");
        assertEq(tokenId, 1);
    }
    
    function testAdminCanRevokeMinterRole() public {
        developerBadge.revokeMinterRole(minter);
        
        // Minter should no longer be able to mint
        vm.expectRevert();
        vm.prank(minter);
        developerBadge.mintBadge(developer1, 1, "metadata");
    }
    
    function testAdminCanUpdateBadgeMetadata() public {
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintBadge(developer1, 1, "metadata");
        
        string memory newAchievementName = "Updated Achievement";
        string memory newSkills = "Updated Skills";
        
        developerBadge.updateBadgeMetadata(tokenId, newAchievementName, newSkills);
        
        DeveloperBadge.BadgeMetadata memory badge = developerBadge.getBadgeDetails(tokenId);
        assertEq(badge.achievementName, newAchievementName);
        assertEq(badge.skills, newSkills);
    }
    
    function testOnlyAdminCanSetMinterRole() public {
        vm.expectRevert();
        vm.prank(developer1);
        developerBadge.setMinterRole(developer1);
    }
    
    function testOnlyAdminCanRevokeMinterRole() public {
        vm.expectRevert();
        vm.prank(developer1);
        developerBadge.revokeMinterRole(minter);
    }
    
    function testOnlyAdminCanUpdateMetadata() public {
        vm.prank(minter);
        uint256 tokenId = developerBadge.mintBadge(developer1, 1, "metadata");
        
        vm.expectRevert();
        vm.prank(developer1);
        developerBadge.updateBadgeMetadata(tokenId, "new", "new");
    }
    
    function testCannotUpdateNonExistentBadge() public {
        vm.expectRevert("DeveloperBadge: token does not exist");
        developerBadge.updateBadgeMetadata(999, "new", "new");
    }
    
    function testCannotGetDetailsOfNonExistentBadge() public {
        vm.expectRevert("DeveloperBadge: token does not exist");
        developerBadge.getBadgeDetails(999);
    }
}
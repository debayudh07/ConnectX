// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/BountyMarketplace.sol";
import "../contracts/DeveloperBadge.sol";
import "../contracts/DeveloperReputation.sol";
import {SimpleBountyVerifier} from "../contracts/SimpleBountyVerifier.sol";

contract BountyMarketplaceTest is Test {
    BountyMarketplace public bountyMarketplace;
    DeveloperBadge public developerBadge;
    DeveloperReputation public developerReputation;
    SimpleBountyVerifier public bountyVerifier;
    
    address public deployer;
    address public feeRecipient;
    address public maintainer;
    address public developer1;
    address public developer2;
    address public verifier;
    
    // Events to test
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
    
    function setUp() public {
        deployer = address(this);
        feeRecipient = address(0x1);
        maintainer = address(0x2);
        developer1 = address(0x3);
        developer2 = address(0x4);
        verifier = address(0x5);
        
        // Deploy contracts
        bountyMarketplace = new BountyMarketplace(feeRecipient);
        developerBadge = new DeveloperBadge();
        developerReputation = new DeveloperReputation();
        bountyVerifier = new SimpleBountyVerifier();
        
        // Set up contract integrations
        bountyMarketplace.setContractAddresses(
            address(developerBadge),
            address(developerReputation),
            address(bountyVerifier)
        );
        
        // Grant roles
        bountyMarketplace.grantRole(bountyMarketplace.MAINTAINER_ROLE(), maintainer);
        bountyMarketplace.grantRole(bountyMarketplace.VERIFIER_ROLE(), verifier);
        
        developerBadge.setMinterRole(address(bountyMarketplace));
        developerReputation.setMarketplaceRole(address(bountyMarketplace));
        
        // Fund accounts for testing
        vm.deal(maintainer, 100 ether);
        vm.deal(developer1, 10 ether);
        vm.deal(developer2, 10 ether);
    }
    
    function testDeployment() public view {
        assertEq(bountyMarketplace.feeRecipient(), feeRecipient);
        assertEq(bountyMarketplace.platformFeePercentage(), 250); // 2.5%
        assertEq(bountyMarketplace.minimumBountyAmount(), 0.01 ether);
        assertEq(bountyMarketplace.getTotalBounties(), 0);
    }
    
    function testCreateBounty() public {
        string memory githubIssueUrl = "https://github.com/test/repo/issues/1";
        string memory repositoryUrl = "https://github.com/test/repo";
        string memory description = "Fix bug in smart contract";
        uint256 deadline = block.timestamp + 7 days;
        string[] memory requiredSkills = new string[](2);
        requiredSkills[0] = "Solidity";
        requiredSkills[1] = "JavaScript";
        uint256 difficultyLevel = 3;
        uint256 rewardAmount = 1 ether;
        
        vm.expectEmit(true, true, false, true);
        emit BountyCreated(1, maintainer, githubIssueUrl, rewardAmount, deadline);
        
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: rewardAmount}(
            githubIssueUrl,
            repositoryUrl,
            description,
            deadline,
            requiredSkills,
            difficultyLevel
        );
        
        // Check bounty was created correctly
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(1);
        assertEq(bounty.id, 1);
        assertEq(bounty.maintainer, maintainer);
        assertEq(bounty.githubIssueUrl, githubIssueUrl);
        assertEq(bounty.repositoryUrl, repositoryUrl);
        assertEq(bounty.description, description);
        assertEq(bounty.rewardAmount, rewardAmount);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Open));
        assertEq(bounty.deadline, deadline);
        assertEq(bounty.difficultyLevel, difficultyLevel);
        
        // Check total bounties increased
        assertEq(bountyMarketplace.getTotalBounties(), 1);
        
        // Check maintainer bounties
        uint256[] memory maintainerBounties = bountyMarketplace.getMaintainerBounties(maintainer);
        assertEq(maintainerBounties.length, 1);
        assertEq(maintainerBounties[0], 1);
    }
    
    function testCreateBountyValidations() public {
        string memory githubIssueUrl = "https://github.com/test/repo/issues/1";
        string memory repositoryUrl = "https://github.com/test/repo";
        string memory description = "Fix bug";
        uint256 deadline = block.timestamp + 7 days;
        string[] memory requiredSkills = new string[](1);
        requiredSkills[0] = "Solidity";
        
        // Test minimum amount validation
        vm.expectRevert("BountyMarketplace: reward amount too low");
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 0.005 ether}(
            githubIssueUrl,
            repositoryUrl,
            description,
            deadline,
            requiredSkills,
            3
        );
        
        // Test empty GitHub URL
        vm.expectRevert("BountyMarketplace: GitHub issue URL required");
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            "",
            repositoryUrl,
            description,
            deadline,
            requiredSkills,
            3
        );
        
        // Test deadline in the past
        vm.expectRevert("BountyMarketplace: deadline must be in the future");
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            githubIssueUrl,
            repositoryUrl,
            description,
            block.timestamp - 1,
            requiredSkills,
            3
        );
        
        // Test invalid difficulty level
        vm.expectRevert("BountyMarketplace: difficulty level must be 1-5");
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            githubIssueUrl,
            repositoryUrl,
            description,
            deadline,
            requiredSkills,
            6
        );
    }
    
    function testClaimBounty() public {
        // Create a bounty first
        uint256 bountyId = _createTestBounty();
        
        vm.expectEmit(true, true, false, true);
        emit BountyClaimed(bountyId, developer1, block.timestamp);
        
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        // Check bounty was claimed correctly
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(bountyId);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Claimed));
        assertEq(bounty.claimedBy, developer1);
        assertEq(bounty.claimedAt, block.timestamp);
        
        // Check developer claims
        uint256[] memory developerClaims = bountyMarketplace.getDeveloperClaims(developer1);
        assertEq(developerClaims.length, 1);
        assertEq(developerClaims[0], bountyId);
    }
    
    function testClaimBountyValidations() public {
        uint256 bountyId = _createTestBounty();
        
        // Claim the bounty first
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        // Test already claimed
        vm.expectRevert("BountyMarketplace: bounty already claimed");
        vm.prank(developer2);
        bountyMarketplace.claimBounty(bountyId);
        
        // Test maintainer cannot claim own bounty
        uint256 bountyId2 = _createTestBounty();
        vm.expectRevert("BountyMarketplace: maintainer cannot claim own bounty");
        vm.prank(maintainer);
        bountyMarketplace.claimBounty(bountyId2);
    }
    
    function testSubmitWork() public {
        uint256 bountyId = _createTestBounty();
        
        // Claim bounty first
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        string memory prUrl = "https://github.com/test/repo/pull/1";
        string memory submissionDescription = "Fixed the bug as described";
        
        vm.expectEmit(true, true, false, true);
        emit BountySubmitted(bountyId, developer1, prUrl, block.timestamp);
        
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, prUrl, submissionDescription);
        
        // Check bounty status updated
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(bountyId);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Submitted));
        assertEq(bounty.submissionPrUrl, prUrl);
        assertEq(bounty.submittedAt, block.timestamp);
        
        // Check submission was recorded
        BountyMarketplace.Submission[] memory submissions = 
            bountyMarketplace.getBountySubmissions(bountyId);
        assertEq(submissions.length, 1);
        assertEq(submissions[0].developer, developer1);
        assertEq(submissions[0].prUrl, prUrl);
        assertEq(submissions[0].description, submissionDescription);
    }
    
    function testSubmitWorkValidations() public {
        uint256 bountyId = _createTestBounty();
        
        // Test submit without claiming
        vm.expectRevert("BountyMarketplace: bounty not in claimed state");
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, "url", "description");
        
        // Claim bounty
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        // Test only claimer can submit
        vm.expectRevert("BountyMarketplace: only claimer can submit work");
        vm.prank(developer2);
        bountyMarketplace.submitWork(bountyId, "url", "description");
        
        // Test empty PR URL
        vm.expectRevert("BountyMarketplace: PR URL required");
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, "", "description");
    }
    
    function testVerifyAndPayBounty() public {
        uint256 bountyId = _createTestBounty();
        uint256 rewardAmount = 1 ether;
        
        // Claim and submit
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, "https://github.com/test/repo/pull/1", "Fixed");
        
        uint256 initialBalance = developer1.balance;
        uint256 platformFee = (rewardAmount * 250) / 10000; // 2.5%
        uint256 expectedPayment = rewardAmount - platformFee;
        
        vm.expectEmit(true, true, false, true);
        emit BountyVerified(bountyId, developer1, block.timestamp);
        
        vm.prank(verifier);
        bountyMarketplace.verifyAndPayBounty(bountyId);
        
        // Check bounty status
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(bountyId);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Paid));
        assertEq(bounty.isCompleted, true);
        assertEq(bounty.verifiedAt, block.timestamp);
        
        // Check payment was made
        assertEq(developer1.balance, initialBalance + expectedPayment);
        
        // Check developer completions
        uint256[] memory completions = bountyMarketplace.getDeveloperCompletions(developer1);
        assertEq(completions.length, 1);
        assertEq(completions[0], bountyId);
        
        // Check reputation was updated
        uint256 reputation = developerReputation.getReputation(developer1);
        assertTrue(reputation > 0);
        
        // Check badge was minted
        uint256 badgeCount = developerBadge.getDeveloperBadgeCount(developer1);
        assertEq(badgeCount, 1);
    }
    
    function testVerifyAndPayValidations() public {
        uint256 bountyId = _createTestBounty();
        
        // Test verify without submission
        vm.expectRevert("BountyMarketplace: bounty not in submitted state");
        vm.prank(verifier);
        bountyMarketplace.verifyAndPayBounty(bountyId);
        
        // Only verifier can verify
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, "url", "description");
        
        vm.expectRevert();
        vm.prank(developer1);
        bountyMarketplace.verifyAndPayBounty(bountyId);
    }
    
    function testDisputeBounty() public {
        uint256 bountyId = _createTestBounty();
        
        // Claim and submit
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId);
        
        vm.prank(developer1);
        bountyMarketplace.submitWork(bountyId, "url", "description");
        
        string memory reason = "Submission doesn't meet requirements";
        
        vm.expectEmit(true, true, false, true);
        emit BountyMarketplace.BountyDisputed(bountyId, maintainer, reason);
        
        vm.prank(maintainer);
        bountyMarketplace.disputeBounty(bountyId, reason);
        
        // Check bounty status
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(bountyId);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Disputed));
    }
    
    function testCancelBounty() public {
        uint256 bountyId = _createTestBounty();
        uint256 rewardAmount = 1 ether;
        
        string memory reason = "Requirements changed";
        uint256 initialBalance = maintainer.balance;
        
        vm.expectEmit(true, true, false, true);
        emit BountyMarketplace.BountyCancelled(bountyId, maintainer, reason);
        
        vm.prank(maintainer);
        bountyMarketplace.cancelBounty(bountyId, reason);
        
        // Check bounty status
        BountyMarketplace.Bounty memory bounty = bountyMarketplace.getBounty(bountyId);
        assertEq(uint256(bounty.status), uint256(BountyMarketplace.BountyStatus.Cancelled));
        assertEq(bounty.rewardAmount, 0);
        
        // Check refund was made
        assertEq(maintainer.balance, initialBalance + rewardAmount);
    }
    
    function testGetBountiesByStatus() public {
        // Create multiple bounties
        uint256 bountyId1 = _createTestBounty();
        uint256 bountyId2 = _createTestBounty();
        uint256 bountyId3 = _createTestBounty();
        
        // Claim one bounty
        vm.prank(developer1);
        bountyMarketplace.claimBounty(bountyId2);
        
        // Get open bounties
        BountyMarketplace.Bounty[] memory openBounties = 
            bountyMarketplace.getBountiesByStatus(BountyMarketplace.BountyStatus.Open);
        assertEq(openBounties.length, 2);
        
        // Get claimed bounties
        BountyMarketplace.Bounty[] memory claimedBounties = 
            bountyMarketplace.getBountiesByStatus(BountyMarketplace.BountyStatus.Claimed);
        assertEq(claimedBounties.length, 1);
        assertEq(claimedBounties[0].id, bountyId2);
    }
    
    function testPlatformFeeUpdate() public {
        uint256 newFee = 300; // 3%
        
        vm.expectEmit(false, false, false, true);
        emit BountyMarketplace.PlatformFeeUpdated(250, newFee);
        
        bountyMarketplace.setPlatformFee(newFee);
        
        assertEq(bountyMarketplace.platformFeePercentage(), newFee);
    }
    
    function testPlatformFeeValidation() public {
        // Test fee too high
        vm.expectRevert("BountyMarketplace: fee cannot exceed 10%");
        bountyMarketplace.setPlatformFee(1001);
    }
    
    function testOnlyAdminCanSetFee() public {
        vm.expectRevert();
        vm.prank(developer1);
        bountyMarketplace.setPlatformFee(300);
    }
    
    function testPauseAndUnpause() public {
        bountyMarketplace.pause();
        
        // Should not be able to create bounty when paused
        vm.expectRevert();
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            "url", "repo", "desc", block.timestamp + 1 days, new string[](0), 1
        );
        
        // Unpause and try again
        bountyMarketplace.unpause();
        
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            "url", "repo", "desc", block.timestamp + 1 days, new string[](0), 1
        );
        
        assertEq(bountyMarketplace.getTotalBounties(), 1);
    }
    
    function testEmergencyWithdraw() public {
        // Fund the contract
        vm.deal(address(bountyMarketplace), 5 ether);
        
        uint256 initialBalance = feeRecipient.balance;
        
        bountyMarketplace.emergencyWithdraw();
        
        assertEq(feeRecipient.balance, initialBalance + 5 ether);
        assertEq(address(bountyMarketplace).balance, 0);
    }
    
    function testReceiveFunction() public {
        uint256 amount = 2 ether;
        
        (bool success,) = address(bountyMarketplace).call{value: amount}("");
        assertTrue(success);
        assertEq(address(bountyMarketplace).balance, amount);
    }
    
    // Helper function to create a test bounty
    function _createTestBounty() internal returns (uint256) {
        string memory githubIssueUrl = "https://github.com/test/repo/issues/1";
        string memory repositoryUrl = "https://github.com/test/repo";
        string memory description = "Test bounty";
        uint256 deadline = block.timestamp + 7 days;
        string[] memory requiredSkills = new string[](1);
        requiredSkills[0] = "Solidity";
        
        vm.prank(maintainer);
        bountyMarketplace.createBounty{value: 1 ether}(
            githubIssueUrl,
            repositoryUrl,
            description,
            deadline,
            requiredSkills,
            3
        );
        
        return bountyMarketplace.getTotalBounties();
    }
}
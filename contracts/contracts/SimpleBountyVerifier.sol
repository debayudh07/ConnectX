// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Interfaces.sol";

/**
 * @title SimpleBountyVerifier
 * @dev A basic implementation of IBountyVerifier for manual verification
 * This contract provides a simple verification mechanism that can be upgraded
 * to integrate with GitHub oracles or other automated verification systems
 */
contract SimpleBountyVerifier is IBountyVerifier, AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct VerificationRecord {
        bool isVerified;
        address verifiedBy;
        uint256 verifiedAt;
        string notes;
    }
    
    // Mapping from bountyId to verification record
    mapping(uint256 => VerificationRecord) public verifications;
    
    // Mapping from PR URL to verification status
    mapping(string => bool) public verifiedPRs;
    
    // Mapping from developer address to GitHub username
    mapping(address => string) public githubUsernames;
    
    // Mapping from GitHub username to Ethereum address
    mapping(string => address) public verifiedAccounts;
    
    // Events
    event SubmissionVerified(
        uint256 indexed bountyId,
        string prUrl,
        address indexed submitter,
        address indexed verifier
    );
    
    event SubmissionRejected(
        uint256 indexed bountyId,
        string prUrl,
        address indexed submitter,
        address indexed verifier,
        string reason
    );
    
    event GitHubAccountLinked(
        address indexed ethereumAddress,
        string githubUsername
    );
    
    event PRStatusUpdated(
        string prUrl,
        bool isVerified,
        address updatedBy
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Verifies a bounty submission (manual verification by authorized verifiers)
     * @param bountyId The ID of the bounty being verified
     * @param prUrl The GitHub pull request URL
     * @param submitter The address of the developer who submitted the work
     * @return bool True if the submission is verified, false otherwise
     */
    function verifySubmission(
        uint256 bountyId,
        string memory prUrl,
        address submitter
    ) external override onlyRole(VERIFIER_ROLE) whenNotPaused returns (bool) {
        require(bountyId > 0, "SimpleBountyVerifier: invalid bounty ID");
        require(bytes(prUrl).length > 0, "SimpleBountyVerifier: PR URL required");
        require(submitter != address(0), "SimpleBountyVerifier: invalid submitter address");
        
        // Mark as verified
        verifications[bountyId] = VerificationRecord({
            isVerified: true,
            verifiedBy: msg.sender,
            verifiedAt: block.timestamp,
            notes: "Manually verified"
        });
        
        verifiedPRs[prUrl] = true;
        
        emit SubmissionVerified(bountyId, prUrl, submitter, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Rejects a bounty submission with a reason
     * @param bountyId The ID of the bounty being rejected
     * @param prUrl The GitHub pull request URL
     * @param submitter The address of the developer who submitted the work
     * @param reason The reason for rejection
     */
    function rejectSubmission(
        uint256 bountyId,
        string memory prUrl,
        address submitter,
        string memory reason
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(bountyId > 0, "SimpleBountyVerifier: invalid bounty ID");
        require(bytes(prUrl).length > 0, "SimpleBountyVerifier: PR URL required");
        require(submitter != address(0), "SimpleBountyVerifier: invalid submitter address");
        require(bytes(reason).length > 0, "SimpleBountyVerifier: reason required");
        
        verifications[bountyId] = VerificationRecord({
            isVerified: false,
            verifiedBy: msg.sender,
            verifiedAt: block.timestamp,
            notes: reason
        });
        
        verifiedPRs[prUrl] = false;
        
        emit SubmissionRejected(bountyId, prUrl, submitter, msg.sender, reason);
    }
    
    /**
     * @dev Checks if a PR is marked as merged (simplified implementation)
     * @param prUrl The GitHub pull request URL
     * @param repositoryUrl The target repository URL (not used in this simple implementation)
     * @return bool True if the PR is marked as verified, false otherwise
     */
    function isPRMerged(
        string memory prUrl,
        string memory repositoryUrl
    ) external view override returns (bool) {
        // In this simple implementation, we just check if the PR is verified
        // A real implementation would query GitHub API or oracle
        repositoryUrl; // Silence unused parameter warning
        return verifiedPRs[prUrl];
    }
    
    /**
     * @dev Gets the status of a pull request (simplified implementation)
     * @param prUrl The GitHub pull request URL
     * @return status The status of the PR (0: open, 1: merged, 2: closed)
     * @return author The GitHub username of the PR author (empty in this implementation)
     * @return title The title of the pull request (empty in this implementation)
     */
    function getPRStatus(string memory prUrl) external view override returns (
        uint8 status,
        string memory author,
        string memory title
    ) {
        // Simplified implementation - real version would query GitHub
        if (verifiedPRs[prUrl]) {
            return (1, "", ""); // Status 1 = merged
        } else {
            return (0, "", ""); // Status 0 = open
        }
    }
    
    /**
     * @dev Verifies that the submitter owns the GitHub account (simplified implementation)
     * @param prUrl The GitHub pull request URL
     * @param submitter The Ethereum address of the submitter
     * @return bool True if the submitter has a linked GitHub account, false otherwise
     */
    function verifyGitHubOwnership(
        string memory prUrl,
        address submitter
    ) external view override returns (bool) {
        // In this simple implementation, we check if the submitter has a linked GitHub account
        // A real implementation would parse the PR URL and verify the author
        prUrl; // Silence unused parameter warning
        return bytes(githubUsernames[submitter]).length > 0;
    }
    
    /**
     * @dev Links a GitHub username to an Ethereum address
     * @param githubUsername The GitHub username
     * @param ethereumAddress The Ethereum address to link
     */
    function linkGitHubAccount(
        string memory githubUsername,
        address ethereumAddress
    ) external onlyRole(VERIFIER_ROLE) {
        require(bytes(githubUsername).length > 0, "SimpleBountyVerifier: GitHub username required");
        require(ethereumAddress != address(0), "SimpleBountyVerifier: invalid Ethereum address");
        
        // Unlink previous account if exists
        string memory oldUsername = githubUsernames[ethereumAddress];
        if (bytes(oldUsername).length > 0) {
            delete verifiedAccounts[oldUsername];
        }
        
        // Unlink previous address for this username if exists
        address oldAddress = verifiedAccounts[githubUsername];
        if (oldAddress != address(0)) {
            delete githubUsernames[oldAddress];
        }
        
        // Create new link
        githubUsernames[ethereumAddress] = githubUsername;
        verifiedAccounts[githubUsername] = ethereumAddress;
        
        emit GitHubAccountLinked(ethereumAddress, githubUsername);
    }
    
    /**
     * @dev Allows users to self-link their GitHub account (simplified implementation)
     * In a real implementation, this would require cryptographic proof
     * @param githubUsername The GitHub username to link
     */
    function selfLinkGitHubAccount(string memory githubUsername) external {
        require(bytes(githubUsername).length > 0, "SimpleBountyVerifier: GitHub username required");
        
        // In a real implementation, this would require verification through:
        // 1. GitHub Gist with signed message
        // 2. OAuth integration
        // 3. GitHub commit signature verification
        
        githubUsernames[msg.sender] = githubUsername;
        verifiedAccounts[githubUsername] = msg.sender;
        
        emit GitHubAccountLinked(msg.sender, githubUsername);
    }
    
    /**
     * @dev Updates the verification status of a PR
     * @param prUrl The GitHub pull request URL
     * @param isVerified Whether the PR is verified
     */
    function updatePRStatus(
        string memory prUrl,
        bool isVerified
    ) external onlyRole(VERIFIER_ROLE) {
        require(bytes(prUrl).length > 0, "SimpleBountyVerifier: PR URL required");
        
        verifiedPRs[prUrl] = isVerified;
        
        emit PRStatusUpdated(prUrl, isVerified, msg.sender);
    }
    
    // View functions
    
    /**
     * @dev Gets the verification record for a bounty
     * @param bountyId The ID of the bounty
     * @return verification The verification record
     */
    function getVerificationRecord(uint256 bountyId) external view returns (VerificationRecord memory) {
        return verifications[bountyId];
    }
    
    /**
     * @dev Checks if a bounty is verified
     * @param bountyId The ID of the bounty
     * @return bool True if verified, false otherwise
     */
    function isBountyVerified(uint256 bountyId) external view returns (bool) {
        return verifications[bountyId].isVerified;
    }
    
    /**
     * @dev Gets the GitHub username for an Ethereum address
     * @param ethereumAddress The Ethereum address
     * @return username The linked GitHub username
     */
    function getGitHubUsername(address ethereumAddress) external view returns (string memory) {
        return githubUsernames[ethereumAddress];
    }
    
    /**
     * @dev Gets the Ethereum address for a GitHub username
     * @param githubUsername The GitHub username
     * @return ethereumAddress The linked Ethereum address
     */
    function getEthereumAddress(string memory githubUsername) external view returns (address) {
        return verifiedAccounts[githubUsername];
    }
    
    /**
     * @dev Checks if a GitHub account is linked to an Ethereum address
     * @param githubUsername The GitHub username
     * @return bool True if linked, false otherwise
     */
    function isGitHubAccountLinked(string memory githubUsername) external view returns (bool) {
        return verifiedAccounts[githubUsername] != address(0);
    }
    
    // Admin functions
    
    /**
     * @dev Adds a verifier role to an address
     * @param account The address to grant verifier role
     */
    function addVerifier(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, account);
    }
    
    /**
     * @dev Removes verifier role from an address
     * @param account The address to revoke verifier role
     */
    function removeVerifier(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, account);
    }
    
    /**
     * @dev Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency function to unlink a GitHub account
     * @param githubUsername The GitHub username to unlink
     */
    function emergencyUnlinkAccount(string memory githubUsername) external onlyRole(ADMIN_ROLE) {
        address ethereumAddress = verifiedAccounts[githubUsername];
        if (ethereumAddress != address(0)) {
            delete githubUsernames[ethereumAddress];
            delete verifiedAccounts[githubUsername];
        }
    }
    
    /**
     * @dev Batch verify multiple PRs
     * @param prUrls Array of PR URLs to verify
     * @param statuses Array of verification statuses
     */
    function batchUpdatePRStatus(
        string[] memory prUrls,
        bool[] memory statuses
    ) external onlyRole(VERIFIER_ROLE) {
        require(prUrls.length == statuses.length, "SimpleBountyVerifier: arrays length mismatch");
        
        for (uint256 i = 0; i < prUrls.length; i++) {
            require(bytes(prUrls[i]).length > 0, "SimpleBountyVerifier: empty PR URL");
            verifiedPRs[prUrls[i]] = statuses[i];
            emit PRStatusUpdated(prUrls[i], statuses[i], msg.sender);
        }
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IDeveloperBadge {
    function mintBadge(
        address developer,
        uint256 bountyId,
        string memory metadata
    ) external returns (uint256);
}

interface IDeveloperReputation {
    function updateReputation(
        address developer,
        uint256 bountyValue,
        bool isCompleted
    ) external;
    
    function getReputation(address developer) external view returns (uint256);
    function getCompletedBounties(address developer) external view returns (uint256);
    function getCurrentStreak(address developer) external view returns (uint256);
}

interface IBountyVerifier {
    function verifySubmission(
        uint256 bountyId,
        string memory prUrl,
        address submitter
    ) external returns (bool);
}

contract BountyMarketplace is AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _nextBountyId = 1;
    
    enum BountyStatus { Open, Claimed, Submitted, Verified, Paid, Disputed, Cancelled }
    
    struct Bounty {
        uint256 id;
        address maintainer;
        string githubIssueUrl;
        string repositoryUrl;
        string description;
        uint256 rewardAmount;
        BountyStatus status;
        address claimedBy;
        string submissionPrUrl;
        uint256 createdAt;
        uint256 claimedAt;
        uint256 submittedAt;
        uint256 verifiedAt;
        uint256 deadline;
        bool isCompleted;
        string[] requiredSkills;
        uint256 difficultyLevel; // 1-5 scale
    }
    
    struct Submission {
        address developer;
        string prUrl;
        string description;
        uint256 submittedAt;
        bool isVerified;
    }
    
    // Contract addresses for integration
    IDeveloperBadge public developerBadge;
    IDeveloperReputation public developerReputation;
    IBountyVerifier public bountyVerifier;
    
    // Storage
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) public bountySubmissions;
    mapping(address => uint256[]) public maintainerBounties;
    mapping(address => uint256[]) public developerClaims;
    mapping(address => uint256[]) public developerCompletions;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
    
    // Platform settings
    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;
    uint256 public minimumBountyAmount = 0.01 ether;
    uint256 public maximumClaimDuration = 30 days;
    
    // Events
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
    
    event BountyDisputed(
        uint256 indexed bountyId,
        address indexed disputedBy,
        string reason
    );
    
    event BountyCancelled(
        uint256 indexed bountyId,
        address indexed maintainer,
        string reason
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    event ContractAddressUpdated(string contractName, address oldAddress, address newAddress);
    
    modifier onlyMaintainerOrAdmin() {
        require(
            hasRole(MAINTAINER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "BountyMarketplace: caller is not a maintainer or admin"
        );
        _;
    }
    
    modifier onlyVerifierOrAdmin() {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "BountyMarketplace: caller is not a verifier or admin"
        );
        _;
    }
    
    modifier bountyExists(uint256 bountyId) {
        require(bountyId > 0 && bountyId < _nextBountyId, "BountyMarketplace: bounty does not exist");
        _;
    }
    
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "BountyMarketplace: invalid fee recipient");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MAINTAINER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
    }
    
    function setContractAddresses(
        address _developerBadge,
        address _developerReputation,
        address _bountyVerifier
    ) external onlyRole(ADMIN_ROLE) {
        require(_developerBadge != address(0), "BountyMarketplace: invalid badge contract");
        require(_developerReputation != address(0), "BountyMarketplace: invalid reputation contract");
        require(_bountyVerifier != address(0), "BountyMarketplace: invalid verifier contract");
        
        developerBadge = IDeveloperBadge(_developerBadge);
        developerReputation = IDeveloperReputation(_developerReputation);
        bountyVerifier = IBountyVerifier(_bountyVerifier);
        
        emit ContractAddressUpdated("DeveloperBadge", address(0), _developerBadge);
        emit ContractAddressUpdated("DeveloperReputation", address(0), _developerReputation);
        emit ContractAddressUpdated("BountyVerifier", address(0), _bountyVerifier);
    }
    
    function createBounty(
        string memory _githubIssueUrl,
        string memory _repositoryUrl,
        string memory _description,
        uint256 _deadline,
        string[] memory _requiredSkills,
        uint256 _difficultyLevel
    ) external payable onlyMaintainerOrAdmin whenNotPaused {
        require(msg.value >= minimumBountyAmount, "BountyMarketplace: reward amount too low");
        require(bytes(_githubIssueUrl).length > 0, "BountyMarketplace: GitHub issue URL required");
        require(bytes(_repositoryUrl).length > 0, "BountyMarketplace: repository URL required");
        require(bytes(_description).length > 0, "BountyMarketplace: description required");
        require(_deadline > block.timestamp, "BountyMarketplace: deadline must be in the future");
        require(_difficultyLevel >= 1 && _difficultyLevel <= 5, "BountyMarketplace: difficulty level must be 1-5");
        
        uint256 newBountyId = _nextBountyId++;
        
        Bounty storage newBounty = bounties[newBountyId];
        newBounty.id = newBountyId;
        newBounty.maintainer = msg.sender;
        newBounty.githubIssueUrl = _githubIssueUrl;
        newBounty.repositoryUrl = _repositoryUrl;
        newBounty.description = _description;
        newBounty.rewardAmount = msg.value;
        newBounty.status = BountyStatus.Open;
        newBounty.createdAt = block.timestamp;
        newBounty.deadline = _deadline;
        newBounty.requiredSkills = _requiredSkills;
        newBounty.difficultyLevel = _difficultyLevel;
        
        maintainerBounties[msg.sender].push(newBountyId);
        
        emit BountyCreated(
            newBountyId,
            msg.sender,
            _githubIssueUrl,
            msg.value,
            _deadline
        );
    }
    
    function claimBounty(uint256 _bountyId) external bountyExists(_bountyId) whenNotPaused {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.status == BountyStatus.Open, "BountyMarketplace: bounty not available for claiming");
        require(bounty.deadline > block.timestamp, "BountyMarketplace: bounty deadline passed");
        require(bounty.claimedBy == address(0), "BountyMarketplace: bounty already claimed");
        require(bounty.maintainer != msg.sender, "BountyMarketplace: maintainer cannot claim own bounty");
        
        bounty.status = BountyStatus.Claimed;
        bounty.claimedBy = msg.sender;
        bounty.claimedAt = block.timestamp;
        
        developerClaims[msg.sender].push(_bountyId);
        
        emit BountyClaimed(_bountyId, msg.sender, block.timestamp);
    }
    
    function submitWork(
        uint256 _bountyId,
        string memory _prUrl,
        string memory _description
    ) external bountyExists(_bountyId) whenNotPaused {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.status == BountyStatus.Claimed, "BountyMarketplace: bounty not in claimed state");
        require(bounty.claimedBy == msg.sender, "BountyMarketplace: only claimer can submit work");
        require(bytes(_prUrl).length > 0, "BountyMarketplace: PR URL required");
        require(!hasSubmitted[_bountyId][msg.sender], "BountyMarketplace: already submitted for this bounty");
        
        bounty.status = BountyStatus.Submitted;
        bounty.submissionPrUrl = _prUrl;
        bounty.submittedAt = block.timestamp;
        
        Submission memory newSubmission = Submission({
            developer: msg.sender,
            prUrl: _prUrl,
            description: _description,
            submittedAt: block.timestamp,
            isVerified: false
        });
        
        bountySubmissions[_bountyId].push(newSubmission);
        hasSubmitted[_bountyId][msg.sender] = true;
        
        emit BountySubmitted(_bountyId, msg.sender, _prUrl, block.timestamp);
    }
    
    function verifyAndPayBounty(uint256 _bountyId) external bountyExists(_bountyId) onlyVerifierOrAdmin whenNotPaused nonReentrant {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.status == BountyStatus.Submitted, "BountyMarketplace: bounty not in submitted state");
        require(bytes(bounty.submissionPrUrl).length > 0, "BountyMarketplace: no submission found");
        
        // External verification (oracle or off-chain)
        bool isVerified = address(bountyVerifier) != address(0) ? 
            bountyVerifier.verifySubmission(_bountyId, bounty.submissionPrUrl, bounty.claimedBy) : 
            true; // Manual verification if no verifier set
            
        require(isVerified, "BountyMarketplace: submission verification failed");
        
        bounty.status = BountyStatus.Verified;
        bounty.verifiedAt = block.timestamp;
        
        emit BountyVerified(_bountyId, bounty.claimedBy, block.timestamp);
        
        // Process payment
        _processBountyPayment(_bountyId);
    }
    
    function _processBountyPayment(uint256 _bountyId) internal {
        Bounty storage bounty = bounties[_bountyId];
        address developer = bounty.claimedBy;
        uint256 rewardAmount = bounty.rewardAmount;
        
        // Calculate platform fee
        uint256 platformFee = (rewardAmount * platformFeePercentage) / 10000;
        uint256 developerPayment = rewardAmount - platformFee;
        
        // Update bounty status
        bounty.status = BountyStatus.Paid;
        bounty.isCompleted = true;
        
        // Update developer records
        developerCompletions[developer].push(_bountyId);
        
        // Update reputation
        if (address(developerReputation) != address(0)) {
            developerReputation.updateReputation(developer, rewardAmount, true);
        }
        
        // Mint NFT badge
        uint256 badgeTokenId = 0;
        if (address(developerBadge) != address(0)) {
            string memory badgeMetadata = string(abi.encodePacked(
                '{"bountyId":', toString(_bountyId),
                ',"reward":', toString(rewardAmount),
                ',"githubIssue":"', bounty.githubIssueUrl,
                '","difficulty":', toString(bounty.difficultyLevel),
                ',"completedAt":', toString(block.timestamp), '}'
            ));
            badgeTokenId = developerBadge.mintBadge(developer, _bountyId, badgeMetadata);
        }
        
        // Transfer payments
        (bool developerSuccess, ) = payable(developer).call{value: developerPayment}("");
        require(developerSuccess, "BountyMarketplace: developer payment failed");
        
        if (platformFee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFee}("");
            require(feeSuccess, "BountyMarketplace: platform fee payment failed");
        }
        
        emit BountyPaid(_bountyId, developer, developerPayment, badgeTokenId);
    }
    
    function disputeBounty(uint256 _bountyId, string memory _reason) external bountyExists(_bountyId) {
        Bounty storage bounty = bounties[_bountyId];
        
        require(
            bounty.maintainer == msg.sender || bounty.claimedBy == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "BountyMarketplace: not authorized to dispute"
        );
        require(
            bounty.status == BountyStatus.Claimed || 
            bounty.status == BountyStatus.Submitted || 
            bounty.status == BountyStatus.Verified,
            "BountyMarketplace: bounty not in disputable state"
        );
        
        bounty.status = BountyStatus.Disputed;
        
        emit BountyDisputed(_bountyId, msg.sender, _reason);
    }
    
    function resolveBountyDispute(
        uint256 _bountyId,
        bool _payDeveloper,
        string memory _resolution
    ) external bountyExists(_bountyId) onlyRole(ADMIN_ROLE) {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.status == BountyStatus.Disputed, "BountyMarketplace: bounty not disputed");
        
        if (_payDeveloper && bounty.claimedBy != address(0)) {
            bounty.status = BountyStatus.Verified;
            _processBountyPayment(_bountyId);
        } else {
            bounty.status = BountyStatus.Cancelled;
            // Refund to maintainer
            uint256 refundAmount = bounty.rewardAmount;
            bounty.rewardAmount = 0;
            
            (bool success, ) = payable(bounty.maintainer).call{value: refundAmount}("");
            require(success, "BountyMarketplace: refund failed");
            
            emit BountyCancelled(_bountyId, bounty.maintainer, _resolution);
        }
    }
    
    function cancelBounty(uint256 _bountyId, string memory _reason) external bountyExists(_bountyId) nonReentrant {
        Bounty storage bounty = bounties[_bountyId];
        
        require(
            bounty.maintainer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "BountyMarketplace: not authorized to cancel"
        );
        require(
            bounty.status == BountyStatus.Open || 
            (bounty.status == BountyStatus.Claimed && block.timestamp > bounty.claimedAt + maximumClaimDuration),
            "BountyMarketplace: bounty cannot be cancelled"
        );
        
        bounty.status = BountyStatus.Cancelled;
        
        // Refund the bounty amount
        uint256 refundAmount = bounty.rewardAmount;
        bounty.rewardAmount = 0;
        
        (bool success, ) = payable(bounty.maintainer).call{value: refundAmount}("");
        require(success, "BountyMarketplace: refund failed");
        
        emit BountyCancelled(_bountyId, bounty.maintainer, _reason);
    }
    
    // View functions
    function getBounty(uint256 _bountyId) external view bountyExists(_bountyId) returns (Bounty memory) {
        return bounties[_bountyId];
    }
    
    function getBountySubmissions(uint256 _bountyId) external view bountyExists(_bountyId) returns (Submission[] memory) {
        return bountySubmissions[_bountyId];
    }
    
    function getMaintainerBounties(address _maintainer) external view returns (uint256[] memory) {
        return maintainerBounties[_maintainer];
    }
    
    function getDeveloperClaims(address _developer) external view returns (uint256[] memory) {
        return developerClaims[_developer];
    }
    
    function getDeveloperCompletions(address _developer) external view returns (uint256[] memory) {
        return developerCompletions[_developer];
    }
    
    function getTotalBounties() external view returns (uint256) {
        return _nextBountyId - 1;
    }
    
    function getAllBounties() external view returns (Bounty[] memory) {
        uint256 totalBounties = _nextBountyId - 1;
        Bounty[] memory allBounties = new Bounty[](totalBounties);
        
        for (uint256 i = 1; i <= totalBounties; i++) {
            allBounties[i - 1] = bounties[i];
        }
        
        return allBounties;
    }
    
    function getBountiesByStatus(BountyStatus _status) external view returns (Bounty[] memory) {
        uint256 totalBounties = _nextBountyId - 1;
        uint256 count = 0;
        
        // Count bounties with the specified status
        for (uint256 i = 1; i <= totalBounties; i++) {
            if (bounties[i].status == _status) {
                count++;
            }
        }
        
        // Create array with exact size
        Bounty[] memory filteredBounties = new Bounty[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalBounties; i++) {
            if (bounties[i].status == _status) {
                filteredBounties[index] = bounties[i];
                index++;
            }
        }
        
        return filteredBounties;
    }
    
    // Admin functions
    function setPlatformFee(uint256 _newFeePercentage) external onlyRole(ADMIN_ROLE) {
        require(_newFeePercentage <= 1000, "BountyMarketplace: fee cannot exceed 10%");
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = _newFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, _newFeePercentage);
    }
    
    function setMinimumBountyAmount(uint256 _newMinimum) external onlyRole(ADMIN_ROLE) {
        minimumBountyAmount = _newMinimum;
    }
    
    function setMaximumClaimDuration(uint256 _newDuration) external onlyRole(ADMIN_ROLE) {
        maximumClaimDuration = _newDuration;
    }
    
    function setFeeRecipient(address _newFeeRecipient) external onlyRole(ADMIN_ROLE) {
        require(_newFeeRecipient != address(0), "BountyMarketplace: invalid fee recipient");
        feeRecipient = _newFeeRecipient;
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "BountyMarketplace: no funds to withdraw");
        
        (bool success, ) = payable(feeRecipient).call{value: balance}("");
        require(success, "BountyMarketplace: emergency withdrawal failed");
    }
    
    // Utility functions
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Receive function for direct AVAX deposits
    receive() external payable {
        // Allow direct deposits for additional funding
    }
} 
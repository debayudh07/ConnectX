// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ULTRA-SIMPLIFIED NFT CONTRACT FOR MINIMAL GAS USAGE
contract DeveloperBadgeMinimal is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _nextTokenId = 1;
    
    // Minimal storage
    mapping(uint256 => uint256) public tokenToBountyId;
    mapping(address => uint256) public developerBadgeCount;
    
    event BadgeMinted(uint256 indexed tokenId, address indexed developer, uint256 indexed bountyId);
    
    constructor() ERC721("ConnectX Badge", "CXB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    // ABSOLUTE MINIMAL MINTING FUNCTION
    function mintBadge(
        address developer,
        uint256 bountyId,
        string memory /* metadata - completely ignored */
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(developer != address(0), "Invalid developer");
        
        uint256 tokenId = _nextTokenId++;
        
        // Store minimal data
        tokenToBountyId[tokenId] = bountyId;
        developerBadgeCount[developer]++;
        
        // Just mint - no complex operations
        _mint(developer, tokenId);
        
        emit BadgeMinted(tokenId, developer, bountyId);
        
        return tokenId;
    }
    
    // Basic admin functions
    function setMinterRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }
    
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
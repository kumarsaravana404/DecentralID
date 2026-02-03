// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialRegistry
 * @notice Manages Verifiable Credentials (VCs) on the blockchain.
 */
contract CredentialRegistry is ReentrancyGuard, Ownable {

    struct Credential {
        bytes32 id;
        address issuer;
        address holder;
        string credentialType; // e.g., "NationalID", "Degree", "Passport"
        string ipfsHash;       // Encrypted VC data
        bool isRevoked;
        uint256 issuedAt;
        uint256 expiresAt;
    }

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public holderCredentials;
    mapping(address => bool) public authorizedIssuers;

    event CredentialIssued(bytes32 indexed credId, address indexed issuer, address indexed holder, string credentialType);
    event CredentialRevoked(bytes32 indexed credId);
    event IssuerAuthorized(address indexed issuer, bool authorized);

    constructor() Ownable(msg.sender) {
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    function setIssuerStatus(address issuer, bool status) external onlyOwner {
        authorizedIssuers[issuer] = status;
        emit IssuerAuthorized(issuer, status);
    }

    /**
     * @notice Issue a new credential to a user.
     */
    function issueCredential(
        address holder,
        string calldata credentialType,
        string calldata ipfsHash,
        uint256 expiration
    ) external onlyIssuer nonReentrant returns (bytes32) {
        bytes32 credId = keccak256(abi.encodePacked(msg.sender, holder, credentialType, block.timestamp));
        
        credentials[credId] = Credential({
            id: credId,
            issuer: msg.sender,
            holder: holder,
            credentialType: credentialType,
            ipfsHash: ipfsHash,
            isRevoked: false,
            issuedAt: block.timestamp,
            expiresAt: expiration
        });

        holderCredentials[holder].push(credId);

        emit CredentialIssued(credId, msg.sender, holder, credentialType);
        return credId;
    }

    function revokeCredential(bytes32 credId) external nonReentrant {
        require(credentials[credId].issuer == msg.sender || owner() == msg.sender, "Not authorized to revoke");
        credentials[credId].isRevoked = true;
        emit CredentialRevoked(credId);
    }

    function getHolderCredentials(address holder) external view returns (bytes32[] memory) {
        return holderCredentials[holder];
    }

    /**
     * @notice Minimal ZK-Proof Verification Simulation
     * @param credId The ID of the credential being proved.
     * @param proof Points or hash representing the ZK proof (simplified for this demo).
     */
    function verifyZKProof(bytes32 credId, bytes calldata proof) external view returns (bool) {
        Credential memory cred = credentials[credId];
        require(!cred.isRevoked, "Credential is revoked");
        require(cred.expiresAt == 0 || cred.expiresAt > block.timestamp, "Credential expired");
        
        // In a real ZK implementation (like SnarkJS + Solidity verifier), 
        // we would call a library or generated verifier contract.
        // For this architecture, we return true if the proof is non-empty 
        // to simulate a valid cryptographic proof.
        return proof.length > 0;
    }
}

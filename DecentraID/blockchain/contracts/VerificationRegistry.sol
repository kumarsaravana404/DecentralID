// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IdentityRegistry.sol";

/**
 * @title VerificationRegistry
 * @notice Handles verification requests and user consent management.
 */
contract VerificationRegistry is ReentrancyGuard {
    
    IdentityRegistry public identityRegistry;

    enum RequestStatus { Pending, Approved, Rejected, Verified }

    struct VerificationRequest {
        uint256 id;
        address verifier;
        address user;
        string purpose;
        RequestStatus status;
        uint256 timestamp;
        uint256 confirmedAt;
    }

    uint256 private _requestIds;
    mapping(uint256 => VerificationRequest) public requests;
    mapping(address => uint256[]) public userRequests;    // Requests aimed at a user
    mapping(address => uint256[]) public verifierRequests; // Requests created by a verifier

    event VerificationRequested(uint256 indexed requestId, address indexed verifier, address indexed user, string purpose);
    event ConsentGranted(uint256 indexed requestId, address indexed user);
    event IdentityVerified(uint256 indexed requestId, address indexed verifier, uint256 timestamp);

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /**
     * @notice Verifier requests verification from a user.
     * @param user The user address to verify.
     * @param purpose The reason for verification.
     */
    function requestVerification(address user, string calldata purpose) external nonReentrant returns (uint256) {
        // Optional: Check if user exists in IdentityRegistry
        (string memory ipfs,,, ) = identityRegistry.getIdentity(user);
        require(bytes(ipfs).length > 0, "User has no identity");

        _requestIds++;
        uint256 newId = _requestIds;

        requests[newId] = VerificationRequest({
            id: newId,
            verifier: msg.sender,
            user: user,
            purpose: purpose,
            status: RequestStatus.Pending,
            timestamp: block.timestamp,
            confirmedAt: 0
        });

        userRequests[user].push(newId);
        verifierRequests[msg.sender].push(newId);

        emit VerificationRequested(newId, msg.sender, user, purpose);
        return newId;
    }

    /**
     * @notice User grants consent for a specific request.
     * @param requestId The request ID.
     */
    function grantConsent(uint256 requestId) external nonReentrant {
        VerificationRequest storage req = requests[requestId];
        require(msg.sender == req.user, "Not authorized");
        require(req.status == RequestStatus.Pending, "Request not pending");

        req.status = RequestStatus.Approved;
        
        emit ConsentGranted(requestId, msg.sender);
    }

    /**
     * @notice Verifier completes the verification steps off-chain and records it on-chain.
     * In a ZK verification flow, this would take the ZK Proof.
     * Here, it marks the flow as complete.
     */
    function verifyIdentity(uint256 requestId) external nonReentrant {
        VerificationRequest storage req = requests[requestId];
        require(msg.sender == req.verifier, "Not the original verifier");
        require(req.status == RequestStatus.Approved, "Consent not granted");

        req.status = RequestStatus.Verified;
        req.confirmedAt = block.timestamp;

        emit IdentityVerified(requestId, msg.sender, block.timestamp);
    }

    function getUserRequests(address user) external view returns (VerificationRequest[] memory) {
        uint256[] memory ids = userRequests[user];
        VerificationRequest[] memory output = new VerificationRequest[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            output[i] = requests[ids[i]];
        }
        return output;
    }
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ==========================================
// MOCK DATABASE (In-Memory for Prototype)
// ==========================================
const auditLogs = [];
const verificationRequestsCache = []; 

// ==========================================
// ENCRYPTION SERVICE (AES-256-CBC)
// ==========================================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901'; // 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function logAudit(did, action, details, txHash = 'OFF-CHAIN') {
    const log = {
        id: crypto.randomUUID(),
        did,
        action,
        details,
        txHash,
        timestamp: new Date().toISOString()
    };
    auditLogs.push(log);
    console.log(`[AUDIT] ${action} - ${did}`);
}

// ==========================================
// IDENTITY SERVICE
// ==========================================

/*
 * POST /identity/create
 * Encrypts user data and returns IPFS Hash (Mock) to be stored on chain.
 */
app.post('/identity/create', async (req, res) => {
    try {
        const { did, personalData } = req.body; // personalData: { name, dob, email, govId }
        
        if (!did || !personalData) {
            return res.status(400).json({ error: "Missing DID or personal data" });
        }

        // 1. Encrypt Data
        const encryptedData = encrypt(JSON.stringify(personalData));

        // 2. Mock IPFS Upload (In production: ipfs.add(encryptedData))
        // Generating a deterministic mock CID based on content
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);

        // 3. Log Audit
        logAudit(did, "IDENTITY_CREATION", "Encrypted payload generated");

        res.json({
            success: true,
            ipfsHash: mockIpfsCid,
            encryptedPayload: encryptedData
        });

    } catch (error) {
        console.error("Identity Creation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/*
 * PUT /identity/update
 */
app.put('/identity/update', async (req, res) => {
    try {
        const { did, newData } = req.body;
        const encryptedData = encrypt(JSON.stringify(newData));
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);
        
        logAudit(did, "IDENTITY_UPDATE", "Identity metadata updated");

        res.json({
            success: true,
            ipfsHash: mockIpfsCid
        });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

// ==========================================
// CREDENTIAL SERVICE
// ==========================================

/*
 * POST /credential/issue
 * Issuer issues a credential to a user.
 */
app.post('/credential/issue', async (req, res) => {
    try {
        const { issuerDid, holderDid, credentialType, data } = req.body;
        
        // 1. Encrypt Credential Data
        const encryptedData = encrypt(JSON.stringify(data));
        
        // 2. Mock IPFS Upload
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);
        
        logAudit(issuerDid, "CREDENTIAL_ISSUANCE", `Issued ${credentialType} to ${holderDid}`);

        res.json({
            success: true,
            ipfsHash: mockIpfsCid,
            credentialId: crypto.randomBytes(32).toString('hex')
        });
    } catch (error) {
        res.status(500).json({ error: "Issuance failed" });
    }
});

/*
 * POST /credential/verify-zkp
 * Verifier validates a ZK proof (Simulation).
 */
app.post('/credential/verify-zkp', (req, res) => {
    const { proof, credId, verifierDid } = req.body;
    
    // In real ZKP, we would verify the proof against the circuit's verification key.
    // For this prototype, we simulate a successful ZK verification if the proof exists.
    const isValid = proof && proof.length > 50; 
    
    if (isValid) {
        logAudit(verifierDid, "ZK_VERIFICATION_SUCCESS", `Verified credential ${credId}`);
        res.json({ success: true, message: "Zero-Knowledge Proof Verified" });
    } else {
        logAudit(verifierDid, "ZK_VERIFICATION_FAILURE", `Failed verification for ${credId}`);
        res.status(400).json({ success: false, error: "Invalid Proof" });
    }
});

// ==========================================
// VERIFICATION SERVICE
// ==========================================

/*
 * POST /verify/request
 * Verifier backend requests a verification.
 */
app.post('/verify/request', (req, res) => {
    const { verifierDid, userDid, purpose } = req.body;
    
    // In a real app, this might trigger a push notification to the User's wallet/app
    const requestId = crypto.randomInt(100000, 999999);
    
    verificationRequestsCache.push({
        requestId,
        verifierDid,
        userDid,
        purpose,
        status: 'PENDING'
    });

    logAudit(verifierDid, "VERIFICATION_REQUEST", `Requested data from ${userDid}`);

    res.json({
        success: true,
        requestId,
        message: "Verification request initiated. Waiting for user consent."
    });
});

/*
 * POST /verify/confirm
 * User consents and provides proof (Decrypted data or ZK Proof).
 */
app.post('/verify/confirm', (req, res) => {
    const { requestId, userDid, encryptedPayload } = req.body;
    
    // Simulate finding the request
    const request = verificationRequestsCache.find(r => r.requestId == requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Validate User (Signature check would happen here in full implementation)
    
    // Decrypt to verify (Simulating Zero-Knowledge check or Validity check)
    // In strict SSI, backend shouldn't see this unless it IS the verifier. 
    // Assuming this backend is the Verifier's backend service.
    try {
        const data = JSON.parse(decrypt(encryptedPayload));
        
        request.status = 'VERIFIED';
        logAudit(userDid, "CONSENT_GRANTED", `Approved request ${requestId}`);
        
        // Simulation of selective disclosure: 
        // Verifier only gets the requested fields, not the whole DID doc.
        const disclosedData = {};
        if (request.purpose.toLowerCase().includes('age')) disclosedData.isOver18 = true;
        if (request.purpose.toLowerCase().includes('id')) disclosedData.idVerified = true;

        logAudit(request.verifierDid, "VERIFICATION_SUCCESS", `Identity verified for ${userDid}`);

        res.json({
            success: true,
            verifiedData: Object.keys(disclosedData).length > 0 ? disclosedData : data
        });
    } catch (e) {
        res.status(400).json({ error: "Invalid Proof/Payload" });
    }

});

// ==========================================
// AUDIT SERVICE
// ==========================================

app.get('/audit/logs', (req, res) => {
    // Optional filter
    const { did } = req.query;
    if (did) {
        return res.json(auditLogs.filter(l => l.did === did));
    }
    res.json(auditLogs);
});

/*
 * GET /config
 * Serves the smart contract addresses
 */
app.get('/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: "Config not found" });
    }
});

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
    console.log(`DecentraID Services running on port ${PORT}`);
    console.log(`- Identity Service: Active`);
    console.log(`- Verification Service: Active`);
    console.log(`- Audit Service: Active`);
});

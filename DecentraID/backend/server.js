const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import models
const AuditLog = require('./models/AuditLog');
const VerificationRequest = require('./models/VerificationRequest');

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for blockchain interactions
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:5173'];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// ==========================================
// DATABASE CONNECTION
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decentraid';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    if (process.env.NODE_ENV === 'production') {
        console.error('Cannot start without database in production mode');
        process.exit(1);
    }
});

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('❌ ENCRYPTION_KEY must be exactly 32 characters');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

const PORT = process.env.PORT || 5000;
const IV_LENGTH = 16;

// ==========================================
// ENCRYPTION SERVICE (AES-256-CBC)
// ==========================================

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

async function logAudit(did, action, details, txHash = 'OFF-CHAIN') {
    const log = {
        id: crypto.randomUUID(),
        did,
        action,
        details,
        txHash,
        timestamp: new Date()
    };
    
    try {
        await AuditLog.create(log);
        console.log(`[AUDIT] ${action} - ${did}`);
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

// ==========================================
// HEALTH CHECK ENDPOINTS
// ==========================================

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/ready', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.json({ 
            status: 'ready', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'not ready', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// ==========================================
// IDENTITY SERVICE
// ==========================================

/*
 * POST /identity/create
 * Encrypts user data and returns IPFS Hash (Mock) to be stored on chain.
 */
app.post('/identity/create', [
    body('did').isString().notEmpty().withMessage('DID is required'),
    body('personalData').isObject().withMessage('Personal data must be an object'),
    body('personalData.name').optional().isString(),
    body('personalData.email').optional().isEmail().withMessage('Invalid email format'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { did, personalData } = req.body;

        // 1. Encrypt Data
        const encryptedData = encrypt(JSON.stringify(personalData));

        // 2. Mock IPFS Upload (In production: ipfs.add(encryptedData))
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);

        // 3. Log Audit
        await logAudit(did, "IDENTITY_CREATION", "Encrypted payload generated");

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
app.put('/identity/update', [
    body('did').isString().notEmpty(),
    body('newData').isObject(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { did, newData } = req.body;
        const encryptedData = encrypt(JSON.stringify(newData));
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);
        
        await logAudit(did, "IDENTITY_UPDATE", "Identity metadata updated");

        res.json({
            success: true,
            ipfsHash: mockIpfsCid
        });
    } catch (error) {
        console.error("Identity Update Error:", error);
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
app.post('/credential/issue', [
    body('issuerDid').isString().notEmpty(),
    body('holderDid').isString().notEmpty(),
    body('credentialType').isString().notEmpty(),
    body('data').isObject(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { issuerDid, holderDid, credentialType, data } = req.body;
        
        // 1. Encrypt Credential Data
        const encryptedData = encrypt(JSON.stringify(data));
        
        // 2. Mock IPFS Upload
        const mockIpfsCid = "Qm" + crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 44);
        
        await logAudit(issuerDid, "CREDENTIAL_ISSUANCE", `Issued ${credentialType} to ${holderDid}`);

        res.json({
            success: true,
            ipfsHash: mockIpfsCid,
            credentialId: crypto.randomBytes(32).toString('hex')
        });
    } catch (error) {
        console.error("Credential Issuance Error:", error);
        res.status(500).json({ error: "Issuance failed" });
    }
});

/*
 * POST /credential/verify-zkp
 * Verifier validates a ZK proof (Simulation).
 */
app.post('/credential/verify-zkp', [
    body('proof').isString().notEmpty(),
    body('credId').isString().notEmpty(),
    body('verifierDid').isString().notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { proof, credId, verifierDid } = req.body;
        
        // In real ZKP, we would verify the proof against the circuit's verification key.
        const isValid = proof && proof.length > 50; 
        
        if (isValid) {
            await logAudit(verifierDid, "ZK_VERIFICATION_SUCCESS", `Verified credential ${credId}`);
            res.json({ success: true, message: "Zero-Knowledge Proof Verified" });
        } else {
            await logAudit(verifierDid, "ZK_VERIFICATION_FAILURE", `Failed verification for ${credId}`);
            res.status(400).json({ success: false, error: "Invalid Proof" });
        }
    } catch (error) {
        console.error("ZKP Verification Error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
});

// ==========================================
// VERIFICATION SERVICE
// ==========================================

/*
 * POST /verify/request
 * Verifier backend requests a verification.
 */
app.post('/verify/request', [
    body('verifierDid').isString().notEmpty(),
    body('userDid').isString().notEmpty(),
    body('purpose').isString().notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { verifierDid, userDid, purpose } = req.body;
        
        const requestId = crypto.randomInt(100000, 999999);
        
        await VerificationRequest.create({
            requestId,
            verifierDid,
            userDid,
            purpose,
            status: 'PENDING'
        });

        await logAudit(verifierDid, "VERIFICATION_REQUEST", `Requested data from ${userDid}`);

        res.json({
            success: true,
            requestId,
            message: "Verification request initiated. Waiting for user consent."
        });
    } catch (error) {
        console.error("Verification Request Error:", error);
        res.status(500).json({ error: "Request failed" });
    }
});

/*
 * POST /verify/confirm
 * User consents and provides proof (Decrypted data or ZK Proof).
 */
app.post('/verify/confirm', [
    body('requestId').isNumeric(),
    body('userDid').isString().notEmpty(),
    body('encryptedPayload').isString().notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { requestId, userDid, encryptedPayload } = req.body;
        
        const request = await VerificationRequest.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        try {
            const data = JSON.parse(decrypt(encryptedPayload));
            
            request.status = 'VERIFIED';
            await request.save();
            
            await logAudit(userDid, "CONSENT_GRANTED", `Approved request ${requestId}`);
            
            // Simulation of selective disclosure
            const disclosedData = {};
            if (request.purpose.toLowerCase().includes('age')) disclosedData.isOver18 = true;
            if (request.purpose.toLowerCase().includes('id')) disclosedData.idVerified = true;

            await logAudit(request.verifierDid, "VERIFICATION_SUCCESS", `Identity verified for ${userDid}`);

            res.json({
                success: true,
                verifiedData: Object.keys(disclosedData).length > 0 ? disclosedData : data
            });
        } catch (e) {
            console.error("Decryption Error:", e);
            res.status(400).json({ error: "Invalid Proof/Payload" });
        }

    } catch (error) {
        console.error("Verification Confirm Error:", error);
        res.status(500).json({ error: "Confirmation failed" });
    }
});

// ==========================================
// AUDIT SERVICE
// ==========================================

app.get('/audit/logs', async (req, res) => {
    try {
        const { did } = req.query;
        
        let query = {};
        if (did) {
            query.did = did;
        }
        
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(100);
        
        res.json(logs);
    } catch (error) {
        console.error("Audit Logs Error:", error);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
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
        console.error("Config Error:", e);
        res.status(500).json({ error: "Config not found" });
    }
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// ==========================================
// SERVER START
// ==========================================

const server = app.listen(PORT, () => {
    console.log(`\n🚀 DecentraID Services running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Security: Enabled`);
    console.log(`📝 Services:`);
    console.log(`   - Identity Service: Active`);
    console.log(`   - Verification Service: Active`);
    console.log(`   - Audit Service: Active`);
    console.log(`\n✅ Server ready to accept connections\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server and database connections closed');
            process.exit(0);
        });
    });
});

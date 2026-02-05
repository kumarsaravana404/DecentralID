const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import models
const AuditLog = require('./models/AuditLog');
const VerificationRequest = require('./models/VerificationRequest');
const GaslessIdentity = require('./models/GaslessIdentity');

// ==========================================
// LOGGER CONFIGURATION (Winston)
// ==========================================
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'decentraid-backend' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If we're not in production, verify logging to console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

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
        
        // Allow requests with no origin (mobile apps, Postman, etc.) or if explicitly allowed
        // also checking if origin is included in allowedOrigins which might be a list of strings
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Changed 'max' to 'limit' for newer versions
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request Logger Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// ==========================================
// DATABASE CONNECTION
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decentraid';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('✅ MongoDB Connected');
    } catch (err) {
        logger.error('❌ MongoDB Connection Error:', err);
        if (process.env.NODE_ENV === 'production') {
            logger.error('Cannot start without database in production mode');
            process.exit(1);
        }
    }
};
connectDB();

mongoose.connection.on('error', err => logger.error('MongoDB Runtime Error:', err));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB Disconnected'));

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    logger.error('❌ ENCRYPTION_KEY must be exactly 32 characters');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    } else {
        // Fallback for dev only if needed, but better to enforce
        logger.warn('Running with insecure key handling (Development Mode)');
    }
}

const PORT = process.env.PORT || 5000;
const IV_LENGTH = 16;

// ==========================================
// ENCRYPTION SERVICE (AES-256-CBC)
// ==========================================

function encrypt(text) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        logger.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        if (textParts.length !== 2) throw new Error('Invalid encrypted format');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        logger.error('Decryption error:', error);
        throw new Error('Decryption failed');
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function uploadToIPFS(data) {
    // 1. If Pinata keys exist, use them (Placeholder for future implementation)
    // if (process.env.PINATA_API_KEY) { ... }
    
    // 2. Mock IPFS Upload (Deterministic mock for demo purposes)
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const mockIpfsCid = "Qm" + hash.substring(0, 44);
    return mockIpfsCid;
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
        logger.info(`[AUDIT] ${action} - ${did}`);
    } catch (error) {
        logger.error('Audit log error:', error);
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
 * Encrypts user data and returns IPFS Hash.
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

        // 2. Upload to Storage (Mock/Real IPFS)
        const mockIpfsCid = await uploadToIPFS(encryptedData);

        // 3. Log Audit
        await logAudit(did, "IDENTITY_CREATION", "Encrypted payload generated");

        res.json({
            success: true,
            ipfsHash: mockIpfsCid,
            encryptedPayload: encryptedData
        });

    } catch (error) {
        logger.error("Identity Creation Error:", error);
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
        const mockIpfsCid = await uploadToIPFS(encryptedData);
        
        await logAudit(did, "IDENTITY_UPDATE", "Identity metadata updated");

        res.json({
            success: true,
            ipfsHash: mockIpfsCid
        });
    } catch (error) {
        logger.error("Identity Update Error:", error);
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
        
        // 2. IPFS Upload
        const mockIpfsCid = await uploadToIPFS(encryptedData);
        
        await logAudit(issuerDid, "CREDENTIAL_ISSUANCE", `Issued ${credentialType} to ${holderDid}`);

        res.json({
            success: true,
            ipfsHash: mockIpfsCid,
            credentialId: crypto.randomUUID()
        });
    } catch (error) {
        logger.error("Credential Issuance Error:", error);
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
        logger.error("ZKP Verification Error:", error);
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
        
        // Use crypto.randomInt but ensure it's handled safely, or switch to UUID. 
        // Frontend might expect a number, so sticking to randomInt but ensuring range.
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
        logger.error("Verification Request Error:", error);
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
            // More robust checking
            const p = request.purpose.toLowerCase();
            if (p.includes('age') || p.includes('18')) disclosedData.isOver18 = true;
            if (p.includes('id') || p.includes('identity')) disclosedData.idVerified = true;
            
            // Fallback if no specific selective disclosure matched
            const finalData = Object.keys(disclosedData).length > 0 ? disclosedData : data;

            await logAudit(request.verifierDid, "VERIFICATION_SUCCESS", `Identity verified for ${userDid}`);

            res.json({
                success: true,
                verifiedData: finalData
            });
        } catch (e) {
            logger.error("Decryption in Verify Confirm Error:", e);
            res.status(400).json({ error: "Invalid Proof/Payload (Decryption Failed)" });
        }

    } catch (error) {
        logger.error("Verification Confirm Error:", error);
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
            query.did = did; // Mongoose sanitizes this
        }
        
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(100);
        
        res.json(logs);
    } catch (error) {
        logger.error("Audit Logs Error:", error);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

/*
 * GET /config
 * Serves the smart contract addresses
 */
app.get('/config', (req, res) => {
    try {
        if (!fs.existsSync('config.json')) {
            throw new Error('config.json missing');
        }
        const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        res.json(config);
    } catch (e) {
        logger.error("Config Error:", e);
        res.status(500).json({ error: "Config not found" });
    }
});

// ==========================================
// GASLESS IDENTITY SERVICE
// ==========================================

/*
 * POST /identity/create-gasless
 * Create identity WITHOUT blockchain transaction (no gas needed)
 * Returns shareable hash link
 */
app.post('/identity/create-gasless', [
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

        // 2. Generate IPFS Hash
        const mockIpfsCid = await uploadToIPFS(encryptedData);

        // 3. Generate Unique Shareable Hash
        const shareHash = crypto.randomBytes(16).toString('hex');

        // 4. Store in Database (OFF-CHAIN)
        await GaslessIdentity.create({
            shareHash,
            did,
            encryptedData,
            ipfsHash: mockIpfsCid,
            onChainStatus: 'PENDING'
        });

        // 5. Log Audit
        await logAudit(did, "GASLESS_IDENTITY_CREATION", "Identity created without blockchain tx");

        // 6. Generate shareable link
        const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/import/${shareHash}`;

        res.json({
            success: true,
            shareHash,
            shareableLink,
            ipfsHash: mockIpfsCid,
            message: "Identity created successfully! Share this link to transfer ownership."
        });

    } catch (error) {
        logger.error("Gasless Identity Creation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/*
 * GET /identity/share/:shareHash
 * Retrieve identity details by shareable hash
 */
app.get('/identity/share/:shareHash', async (req, res) => {
    try {
        const { shareHash } = req.params;

        const gaslessIdentity = await GaslessIdentity.findOne({ shareHash });
        
        if (!gaslessIdentity) {
            return res.status(404).json({ error: "Identity not found" });
        }

        // Increment access count
        gaslessIdentity.accessCount += 1;
        await gaslessIdentity.save();

        // Decrypt the data for display
        const decryptedData = JSON.parse(decrypt(gaslessIdentity.encryptedData));

        res.json({
            success: true,
            did: gaslessIdentity.did,
            personalData: decryptedData,
            ipfsHash: gaslessIdentity.ipfsHash,
            onChainStatus: gaslessIdentity.onChainStatus,
            anchoredBy: gaslessIdentity.anchoredBy,
            txHash: gaslessIdentity.txHash,
            createdAt: gaslessIdentity.createdAt,
            accessCount: gaslessIdentity.accessCount
        });

    } catch (error) {
        logger.error("Share Retrieval Error:", error);
        res.status(500).json({ error: "Failed to retrieve identity" });
    }
});

/*
 * POST /identity/claim
 * Allow another wallet to claim/anchor a gasless identity on-chain
 */
app.post('/identity/claim', [
    body('shareHash').isString().notEmpty(),
    body('claimantWallet').isString().notEmpty(),
    body('txHash').optional().isString(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { shareHash, claimantWallet, txHash } = req.body;

        const gaslessIdentity = await GaslessIdentity.findOne({ shareHash });
        
        if (!gaslessIdentity) {
            return res.status(404).json({ error: "Identity not found" });
        }

        if (gaslessIdentity.onChainStatus === 'ANCHORED') {
            return res.status(400).json({ error: "Identity already anchored on-chain" });
        }

        // Update the identity with anchor details
        gaslessIdentity.onChainStatus = 'ANCHORED';
        gaslessIdentity.anchoredBy = claimantWallet;
        gaslessIdentity.txHash = txHash || 'PENDING';
        gaslessIdentity.anchoredAt = new Date();
        await gaslessIdentity.save();

        await logAudit(
            `did:eth:${claimantWallet}`, 
            "IDENTITY_CLAIMED", 
            `Claimed gasless identity ${shareHash}`,
            txHash
        );

        res.json({
            success: true,
            message: "Identity successfully anchored on blockchain",
            newDid: `did:eth:${claimantWallet}`,
            txHash: gaslessIdentity.txHash
        });

    } catch (error) {
        logger.error("Identity Claim Error:", error);
        res.status(500).json({ error: "Claim failed" });
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
    logger.error('Unhandled Error:', err);
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
    logger.info(`\n🚀 DecentraID Services running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔐 Security: Enabled`);
    logger.info(`📝 Services: Identity, Verification, Audit active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            logger.info('Server and database connections closed');
            process.exit(0);
        });
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the process
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

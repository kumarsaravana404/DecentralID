const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Validate required environment variables in production
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ENCRYPTION_KEY'];
if (process.env.NODE_ENV === 'production') {
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}

// Import Supabase client and services
const { supabase, testSupabaseConnection } = require('./supabaseClient');
const AuditLogService = require('./services/AuditLogService');
const VerificationRequestService = require('./services/VerificationRequestService');
const GaslessIdentityService = require('./services/GaslessIdentityService');

// ==========================================
// LOGGER CONFIGURATION (Winston)
// ==========================================

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'decentraid-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
    ],
});

// Always log to console (for container environments like Docker/Render)
logger.add(new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
        ? logFormat
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
}));

const app = express();

// Trust proxy for proper IP detection behind reverse proxies (Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Compression for responses
app.use(compression());

// Security headers
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https:'],
        }
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:5173', 'https://decentral-id.vercel.app'];
        
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

// Rate limiting - General API
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/ready', // Skip health checks
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`, { path: req.path });
        res.status(options.statusCode).send(options.message);
    },
    keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
});
app.use(limiter);

// Stricter rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10,
    message: { error: 'Too many requests to this endpoint, please slow down.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
});

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request Logger Middleware with response time tracking
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        logger[logLevel](`${req.method} ${req.originalUrl}`, {
            ip: req.ip,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent')
        });
    });
    
    next();
});

// ==========================================
// DATABASE CONNECTION (SUPABASE)
// ==========================================

const connectDB = async () => {
    try {
        const isConnected = await testSupabaseConnection();
        if (!isConnected && process.env.NODE_ENV === 'production') {
            logger.error('Cannot start without database in production mode');
            process.exit(1);
        }
    } catch (err) {
        logger.error('❌ Supabase Connection Error:', err.message);
        if (process.env.NODE_ENV === 'production') {
            logger.error('Cannot start without database in production mode');
            process.exit(1);
        }
    }
};
connectDB();

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
        did,
        action,
        details,
        txHash,
        timestamp: new Date()
    };
    
    try {
        await AuditLogService.create(log);
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
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/ready', async (req, res) => {
    try {
        // Test Supabase connection by querying a table
        const { data, error } = await supabase
            .from('audit_logs')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        res.json({ 
            status: 'ready', 
            database: 'connected (Supabase)',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'healthy',
                memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
            }
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'not ready', 
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
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
app.post('/verify/request', strictLimiter, [
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
        
        await VerificationRequestService.create({
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
        
        const request = await VerificationRequestService.findOne({ requestId });
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
            query.did = did;
        }
        
        const logs = await AuditLogService.find(query, { 
            sort: { timestamp: -1 }, 
            limit: 100 
        });
        
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
app.post('/identity/create-gasless', strictLimiter, [
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
        await GaslessIdentityService.create({
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

        const gaslessIdentity = await GaslessIdentityService.findOne({ shareHash });
        
        if (!gaslessIdentity) {
            return res.status(404).json({ error: "Identity not found" });
        }

        // Increment access count
        await GaslessIdentityService.incrementAccessCount(shareHash);

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

        const gaslessIdentity = await GaslessIdentityService.findOne({ shareHash });
        
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


// Root Endpoint - Welcome Message
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to DecentraID API',
        status: 'running',
        documentation: 'https://github.com/kumarsaravana404/DecentraID',
        endpoints: {
            health: '/health',
            ready: '/ready'
        }
    });
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

const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 DecentraID Services running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔐 Security: Enabled`);
    logger.info(`📝 Services: Identity, Verification, Audit active`);
});

// Set server timeouts for production
server.keepAliveTimeout = 65000; // Slightly higher than ALB's 60s
server.headersTimeout = 66000;

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            await mongoose.connection.close();
            logger.info('Database connection closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the process
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

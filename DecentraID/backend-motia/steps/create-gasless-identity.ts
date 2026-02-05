import type { ApiRouteConfig, Handlers } from 'motia';
import crypto from 'crypto';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'create-gasless-identity',
  path: '/identity/create-gasless',
  method: 'POST',
  emits: [],
  description: 'Create identity without blockchain transaction (gasless)'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { did, personalData } = req.body;

  if (!did || !personalData) {
    return {
      status: 400,
      body: { error: 'DID and personalData are required' }
    };
  }

  try {
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
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareableLink = `${FRONTEND_URL}/import/${shareHash}`;

    return {
      status: 200,
      body: {
        success: true,
        shareHash,
        shareableLink,
        ipfsHash: mockIpfsCid,
        message: "Identity created successfully! Share this link to transfer ownership."
      }
    };
  } catch (error) {
    logger.error('Gasless identity creation error:', error);
    return {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};

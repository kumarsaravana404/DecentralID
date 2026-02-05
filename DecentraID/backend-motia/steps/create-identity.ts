import type { ApiRouteConfig, Handlers } from 'motia';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'create-identity',
  path: '/identity/create',
  method: 'POST',
  emits: [],
  description: 'Create a new encrypted identity and upload to IPFS'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { did, personalData } = req.body;

  if (!did || !personalData) {
    return {
      status: 400,
      body: { error: 'DID and personalData are required' }
    };
  }

  // Validate email if provided
  if (personalData.email && !personalData.email.includes('@')) {
    return {
      status: 400,
      body: { error: 'Invalid email format' }
    };
  }

  try {
    // 1. Encrypt Data
    const encryptedData = encrypt(JSON.stringify(personalData));

    // 2. Upload to Storage (Mock/Real IPFS)
    const mockIpfsCid = await uploadToIPFS(encryptedData);

    // 3. Log Audit
    await logAudit(did, "IDENTITY_CREATION", "Encrypted payload generated");

    return {
      status: 200,
      body: {
        success: true,
        ipfsHash: mockIpfsCid,
        encryptedPayload: encryptedData
      }
    };
  } catch (error) {
    logger.error('Identity creation error:', error);
    return {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};

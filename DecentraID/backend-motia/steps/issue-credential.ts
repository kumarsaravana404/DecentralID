import type { ApiRouteConfig, Handlers } from 'motia';
import crypto from 'crypto';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'issue-credential',
  path: '/credential/issue',
  method: 'POST',
  emits: [],
  description: 'Issue a verifiable credential to a user'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { issuerDid, holderDid, credentialType, data } = req.body;

  if (!issuerDid || !holderDid || !credentialType || !data) {
    return {
      status: 400,
      body: { error: 'issuerDid, holderDid, credentialType, and data are required' }
    };
  }

  try {
    // 1. Encrypt Credential Data
    const encryptedData = encrypt(JSON.stringify(data));
    
    // 2. IPFS Upload
    const mockIpfsCid = await uploadToIPFS(encryptedData);
    
    await logAudit(issuerDid, "CREDENTIAL_ISSUANCE", `Issued ${credentialType} to ${holderDid}`);

    return {
      status: 200,
      body: {
        success: true,
        ipfsHash: mockIpfsCid,
        credentialId: crypto.randomUUID()
      }
    };
  } catch (error) {
    logger.error('Credential issuance error:', error);
    return {
      status: 500,
      body: { error: 'Issuance failed' }
    };
  }
};

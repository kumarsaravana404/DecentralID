import { defineStep } from 'motia';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';

interface CreateIdentityInput {
  did: string;
  personalData: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

interface CreateIdentityOutput {
  success: boolean;
  ipfsHash: string;
  encryptedPayload: string;
}

/**
 * POST /identity/create
 * Creates a new encrypted identity and uploads to IPFS
 */
export default defineStep({CreateIdentityInput, CreateIdentityOutput>({
  id: 'create-identity',
  inputSchema: {
    type: 'object',
    properties: {
      did: { type: 'string' },
      personalData: { type: 'object' }
    },
    required: ['did', 'personalData']
  },
  handler: async (input: any) => {
    const { did, personalData } = input;

    // Validate email if provided
    if (personalData.email && !personalData.email.includes('@')) {
      throw new Error('Invalid email format');
    }

    // 1. Encrypt Data
    const encryptedData = encrypt(JSON.stringify(personalData));

    // 2. Upload to Storage (Mock/Real IPFS)
    const mockIpfsCid = await uploadToIPFS(encryptedData);

    // 3. Log Audit
    await logAudit(did, "IDENTITY_CREATION", "Encrypted payload generated");

    return {
      success: true,
      ipfsHash: mockIpfsCid,
      encryptedPayload: encryptedData
    };
  }
});

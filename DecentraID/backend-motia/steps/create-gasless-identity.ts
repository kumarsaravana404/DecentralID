import { defineStep } from 'motia';
import crypto from 'crypto';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

interface CreateGaslessIdentityInput {
  did: string;
  personalData: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

interface CreateGaslessIdentityOutput {
  success: boolean;
  shareHash: string;
  shareableLink: string;
  ipfsHash: string;
  message: string;
}

/**
 * POST /identity/create-gasless
 * Create identity WITHOUT blockchain transaction (no gas needed)
 */
export default defineStep({CreateGaslessIdentityInput, CreateGaslessIdentityOutput>({
  id: 'create-gasless-identity',
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
      success: true,
      shareHash,
      shareableLink,
      ipfsHash: mockIpfsCid,
      message: "Identity created successfully! Share this link to transfer ownership."
    };
  }
});

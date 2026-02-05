import { defineStep } from 'motia';
import crypto from 'crypto';
import { encrypt } from '../src/utils/encryption.js';
import { uploadToIPFS } from '../src/utils/ipfs.js';
import { logAudit } from '../src/utils/audit.js';

interface IssueCredentialInput {
  issuerDid: string;
  holderDid: string;
  credentialType: string;
  data: Record<string, any>;
}

/**
 * POST /credential/issue
 * Issuer issues a credential to a user
 */
export default defineStep({IssueCredentialInput>({
  id: 'issue-credential',
  inputSchema: {
    type: 'object',
    properties: {
      issuerDid: { type: 'string' },
      holderDid: { type: 'string' },
      credentialType: { type: 'string' },
      data: { type: 'object' }
    },
    required: ['issuerDid', 'holderDid', 'credentialType', 'data']
  },
  handler: async (input: any) => {
    const { issuerDid, holderDid, credentialType, data } = input;
    
    // 1. Encrypt Credential Data
    const encryptedData = encrypt(JSON.stringify(data));
    
    // 2. IPFS Upload
    const mockIpfsCid = await uploadToIPFS(encryptedData);
    
    await logAudit(issuerDid, "CREDENTIAL_ISSUANCE", `Issued ${credentialType} to ${holderDid}`);

    return {
      success: true,
      ipfsHash: mockIpfsCid,
      credentialId: crypto.randomUUID()
    };
  }
});

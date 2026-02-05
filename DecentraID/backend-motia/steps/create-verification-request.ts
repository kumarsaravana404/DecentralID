import { defineStep } from 'motia';
import crypto from 'crypto';
import { logAudit } from '../src/utils/audit.js';
import { VerificationRequest } from '../src/models/VerificationRequest.js';

interface CreateVerificationRequestInput {
  verifierDid: string;
  userDid: string;
  purpose: string;
}

/**
 * POST /verify/request
 * Verifier backend requests a verification
 */
export default defineStep({CreateVerificationRequestInput>({
  id: 'create-verification-request',
  inputSchema: {
    type: 'object',
    properties: {
      verifierDid: { type: 'string' },
      userDid: { type: 'string' },
      purpose: { type: 'string' }
    },
    required: ['verifierDid', 'userDid', 'purpose']
  },
  handler: async (input: any) => {
    const { verifierDid, userDid, purpose } = input;
    
    const requestId = crypto.randomInt(100000, 999999);
    
    await VerificationRequest.create({
      requestId,
      verifierDid,
      userDid,
      purpose,
      status: 'PENDING'
    });

    await logAudit(verifierDid, "VERIFICATION_REQUEST", `Requested data from ${userDid}`);

    return {
      success: true,
      requestId,
      message: "Verification request initiated. Waiting for user consent."
    };
  }
});

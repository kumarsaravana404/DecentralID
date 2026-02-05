import { defineStep } from 'motia';
import { decrypt } from '../src/utils/encryption.js';
import { logAudit } from '../src/utils/audit.js';
import { VerificationRequest } from '../src/models/VerificationRequest.js';

interface ConfirmVerificationInput {
  requestId: number;
  userDid: string;
  encryptedPayload: string;
}

/**
 * POST /verify/confirm
 * User consents and provides proof (Decrypted data or ZK Proof)
 */
export default defineStep({ConfirmVerificationInput>({
  id: 'confirm-verification',
  inputSchema: {
    type: 'object',
    properties: {
      requestId: { type: 'number' },
      userDid: { type: 'string' },
      encryptedPayload: { type: 'string' }
    },
    required: ['requestId', 'userDid', 'encryptedPayload']
  },
  handler: async (input: any) => {
    const { requestId, userDid, encryptedPayload } = input;
    
    const request = await VerificationRequest.findOne({ requestId });
    if (!request) {
      throw new Error("Request not found");
    }

    const data = JSON.parse(decrypt(encryptedPayload));
    
    request.status = 'VERIFIED';
    await request.save();
    
    await logAudit(userDid, "CONSENT_GRANTED", `Approved request ${requestId}`);
    
    // Selective disclosure based on purpose
    const disclosedData: Record<string, any> = {};
    const p = request.purpose.toLowerCase();
    if (p.includes('age') || p.includes('18')) disclosedData.isOver18 = true;
    if (p.includes('id') || p.includes('identity')) disclosedData.idVerified = true;
    
    const finalData = Object.keys(disclosedData).length > 0 ? disclosedData : data;

    await logAudit(request.verifierDid, "VERIFICATION_SUCCESS", `Identity verified for ${userDid}`);

    return {
      success: true,
      verifiedData: finalData
    };
  }
});

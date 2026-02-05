import type { ApiRouteConfig } from 'motia';
import { decrypt } from '../src/utils/encryption.js';
import { logAudit } from '../src/utils/audit.js';
import { VerificationRequest } from '../src/models/VerificationRequest.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'confirm-verification',
  path: '/verify/confirm',
  method: 'POST',
  emits: [],
  description: 'User confirms verification with selective disclosure'
};

export const handler = async (req: any, { logger }: any) => {
  const { requestId, userDid, encryptedPayload } = req.body;

  if (!requestId || !userDid || !encryptedPayload) {
    return {
      status: 400,
      body: { error: 'requestId, userDid, and encryptedPayload are required' }
    };
  }

  try {
    const request = await VerificationRequest.findOne({ requestId });
    if (!request) {
      return {
        status: 404,
        body: { error: "Request not found" }
      };
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
      status: 200,
      body: {
        success: true,
        verifiedData: finalData
      }
    };
  } catch (error) {
    logger.error('Verification confirm error:', error);
    return {
      status: 500,
      body: { error: 'Confirmation failed' }
    };
  }
};

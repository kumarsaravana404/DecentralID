import type { ApiRouteConfig, Handlers } from 'motia';
import crypto from 'crypto';
import { logAudit } from '../src/utils/audit.js';
import { VerificationRequest } from '../src/models/VerificationRequest.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'create-verification-request',
  path: '/verify/request',
  method: 'POST',
  emits: [],
  description: 'Create a verification request from verifier to user'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { verifierDid, userDid, purpose } = req.body;

  if (!verifierDid || !userDid || !purpose) {
    return {
      status: 400,
      body: { error: 'verifierDid, userDid, and purpose are required' }
    };
  }

  try {
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
      status: 200,
      body: {
        success: true,
        requestId,
        message: "Verification request initiated. Waiting for user consent."
      }
    };
  } catch (error) {
    logger.error('Verification request error:', error);
    return {
      status: 500,
      body: { error: 'Request failed' }
    };
  }
};

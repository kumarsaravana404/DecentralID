import type { ApiRouteConfig, Handlers } from 'motia';
import { logAudit } from '../src/utils/audit.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'claim-identity',
  path: '/identity/claim',
  method: 'POST',
  emits: [],
  description: 'Claim and anchor a gasless identity on-chain'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { shareHash, claimantWallet, txHash } = req.body;

  if (!shareHash || !claimantWallet) {
    return {
      status: 400,
      body: { error: 'shareHash and claimantWallet are required' }
    };
  }

  try {
    const gaslessIdentity = await GaslessIdentity.findOne({ shareHash });
    
    if (!gaslessIdentity) {
      return {
        status: 404,
        body: { error: "Identity not found" }
      };
    }

    if (gaslessIdentity.onChainStatus === 'ANCHORED') {
      return {
        status: 400,
        body: { error: "Identity already anchored on-chain" }
      };
    }

    // Update the identity with anchor details
    gaslessIdentity.onChainStatus = 'ANCHORED';
    gaslessIdentity.anchoredBy = claimantWallet;
    gaslessIdentity.txHash = txHash || 'PENDING';
    gaslessIdentity.anchoredAt = new Date();
    await gaslessIdentity.save();

    await logAudit(
      `did:eth:${claimantWallet}`, 
      "IDENTITY_CLAIMED", 
      `Claimed gasless identity ${shareHash}`,
      txHash || 'PENDING'
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Identity successfully anchored on blockchain",
        newDid: `did:eth:${claimantWallet}`,
        txHash: gaslessIdentity.txHash
      }
    };
  } catch (error) {
    logger.error('Claim identity error:', error);
    return {
      status: 500,
      body: { error: 'Claim failed' }
    };
  }
};

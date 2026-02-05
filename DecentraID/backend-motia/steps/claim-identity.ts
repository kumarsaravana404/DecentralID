import { defineStep } from 'motia';
import { logAudit } from '../src/utils/audit.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

interface ClaimIdentityInput {
  shareHash: string;
  claimantWallet: string;
  txHash?: string;
}

/**
 * POST /identity/claim
 * Allow another wallet to claim/anchor a gasless identity on-chain
 */
export default defineStep({ClaimIdentityInput>({
  id: 'claim-identity',
  inputSchema: {
    type: 'object',
    properties: {
      shareHash: { type: 'string' },
      claimantWallet: { type: 'string' },
      txHash: { type: 'string' }
    },
    required: ['shareHash', 'claimantWallet']
  },
  handler: async (input: any) => {
    const { shareHash, claimantWallet, txHash } = input;

    const gaslessIdentity = await GaslessIdentity.findOne({ shareHash });
    
    if (!gaslessIdentity) {
      throw new Error("Identity not found");
    }

    if (gaslessIdentity.onChainStatus === 'ANCHORED') {
      throw new Error("Identity already anchored on-chain");
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
      success: true,
      message: "Identity successfully anchored on blockchain",
      newDid: `did:eth:${claimantWallet}`,
      txHash: gaslessIdentity.txHash
    };
  }
});

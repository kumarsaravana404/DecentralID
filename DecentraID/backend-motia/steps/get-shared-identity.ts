import { defineStep } from 'motia';
import { decrypt } from '../src/utils/encryption.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

interface GetSharedIdentityInput {
  shareHash: string;
}

/**
 * GET /identity/share/:shareHash
 * Retrieve identity details by shareable hash
 */
export default defineStep({GetSharedIdentityInput>({
  id: 'get-shared-identity',
  inputSchema: {
    type: 'object',
    properties: {
      shareHash: { type: 'string' }
    },
    required: ['shareHash']
  },
  handler: async (input: any) => {
    const { shareHash } = input;

    const gaslessIdentity = await GaslessIdentity.findOne({ shareHash });
    
    if (!gaslessIdentity) {
      throw new Error("Identity not found");
    }

    // Increment access count
    gaslessIdentity.accessCount += 1;
    await gaslessIdentity.save();

    // Decrypt the data for display
    const decryptedData = JSON.parse(decrypt(gaslessIdentity.encryptedData));

    return {
      success: true,
      did: gaslessIdentity.did,
      personalData: decryptedData,
      ipfsHash: gaslessIdentity.ipfsHash,
      onChainStatus: gaslessIdentity.onChainStatus,
      anchoredBy: gaslessIdentity.anchoredBy,
      txHash: gaslessIdentity.txHash,
      createdAt: gaslessIdentity.createdAt,
      accessCount: gaslessIdentity.accessCount
    };
  }
});

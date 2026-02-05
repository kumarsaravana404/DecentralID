import type { ApiRouteConfig, Handlers } from 'motia';
import { decrypt } from '../src/utils/encryption.js';
import { GaslessIdentity } from '../src/models/GaslessIdentity.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'get-shared-identity',
  path: '/identity/share/:shareHash',
  method: 'GET',
  emits: [],
  description: 'Retrieve identity details by shareable hash'
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  const { shareHash } = req.params;

  if (!shareHash) {
    return {
      status: 400,
      body: { error: 'shareHash parameter is required' }
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

    // Increment access count
    gaslessIdentity.accessCount += 1;
    await gaslessIdentity.save();

    // Decrypt the data for display
    const decryptedData = JSON.parse(decrypt(gaslessIdentity.encryptedData));

    return {
      status: 200,
      body: {
        success: true,
        did: gaslessIdentity.did,
        personalData: decryptedData,
        ipfsHash: gaslessIdentity.ipfsHash,
        onChainStatus: gaslessIdentity.onChainStatus,
        anchoredBy: gaslessIdentity.anchoredBy,
        txHash: gaslessIdentity.txHash,
        createdAt: gaslessIdentity.createdAt,
        accessCount: gaslessIdentity.accessCount
      }
    };
  } catch (error) {
    logger.error('Get shared identity error:', error);
    return {
      status: 500,
      body: { error: 'Failed to retrieve identity' }
    };
  }
};

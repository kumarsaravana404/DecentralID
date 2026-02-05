import { Schema, model } from 'mongoose';

const GaslessIdentitySchema = new Schema({
  shareHash: { type: String, required: true, unique: true, index: true },
  did: { type: String, required: true },
  encryptedData: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  onChainStatus: { type: String, enum: ['PENDING', 'ANCHORED'], default: 'PENDING' },
  anchoredBy: { type: String, default: null },
  txHash: { type: String, default: null },
  anchoredAt: { type: Date, default: null },
  accessCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const GaslessIdentity = model('GaslessIdentity', GaslessIdentitySchema);

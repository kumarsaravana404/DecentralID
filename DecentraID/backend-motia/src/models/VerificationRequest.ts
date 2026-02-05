import { Schema, model } from 'mongoose';

const VerificationRequestSchema = new Schema({
  requestId: { type: Number, required: true, unique: true, index: true },
  verifierDid: { type: String, required: true },
  userDid: { type: String, required: true },
  purpose: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

export const VerificationRequest = model('VerificationRequest', VerificationRequestSchema);

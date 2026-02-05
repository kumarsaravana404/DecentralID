import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  did: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  txHash: { type: String, default: 'OFF-CHAIN' },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const AuditLog = model('AuditLog', AuditLogSchema);

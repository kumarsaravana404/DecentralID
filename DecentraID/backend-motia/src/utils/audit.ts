import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';

export async function logAudit(
  did: string,
  action: string,
  details: string,
  txHash: string = 'OFF-CHAIN'
): Promise<void> {
  const log = {
    id: crypto.randomUUID(),
    did,
    action,
    details,
    txHash,
    timestamp: new Date()
  };
  
  try {
    await AuditLog.create(log);
    console.log(`[AUDIT] ${action} - ${did}`);
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

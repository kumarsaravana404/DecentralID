import { defineStep } from 'motia';
import { AuditLog } from '../src/models/AuditLog.js';

interface GetAuditLogsInput {
  did?: string;
}

/**
 * GET /audit/logs
 * Retrieve audit logs, optionally filtered by DID
 */
export default defineStep({GetAuditLogsInput>({
  id: 'get-audit-logs',
  inputSchema: {
    type: 'object',
    properties: {
      did: { type: 'string' }
    }
  },
  handler: async (input: any) => {
    const { did } = input;
    
    let query = {};
    if (did) {
      query = { did };
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100);
    
    return logs;
  }
});

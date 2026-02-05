import type { ApiRouteConfig } from 'motia';
import { AuditLog } from '../src/models/AuditLog.js';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'get-audit-logs',
  path: '/audit/logs',
  method: 'GET',
  emits: [],
  description: 'Retrieve audit logs with optional DID filtering'
};

export const handler = async (req: any, { logger }: any) => {
  try {
    const { did } = req.query;
    
    let query = {};
    if (did) {
      query = { did: String(did) };
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100);
    
    return {
      status: 200,
      body: logs
    };
  } catch (error) {
    logger.error('Get audit logs error:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch logs' }
    };
  }
};

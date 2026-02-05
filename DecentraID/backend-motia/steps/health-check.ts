import type { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'health-check',
  path: '/health',
  method: 'GET',
  emits: []
};

export const handler: Handlers['api'] = async (req, { logger }) => {
  return {
    status: 200,
    body: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'decentraid-backend-motia'
    }
  };
};

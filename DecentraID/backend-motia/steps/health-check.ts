import type { ApiRouteConfig } from 'motia';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'health-check',
  path: '/health',
  method: 'GET',
  emits: []
};

export const handler = async (req: any, { logger }: any) => {
  return {
    status: 200,
    body: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'decentraid-backend-motia'
    }
  };
};

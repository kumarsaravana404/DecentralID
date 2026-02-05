import { defineStep } from 'motia';

export default defineStep({
  id: 'health-check',
  handler: async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'decentraid-backend-motia'
    };
  }
});

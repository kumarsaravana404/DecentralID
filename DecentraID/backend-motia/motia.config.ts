import { defineConfig } from 'motia';

export default defineConfig({
  name: 'decentraid-backend',
  steps: './steps/**/*.ts',
  env: {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  onStart: async () => {
    // Connect to MongoDB on startup
    const { connectDB } = await import('./src/db/connection.js');
    await connectDB();
    console.log('✅ DecentraID Backend Ready');
  }
});

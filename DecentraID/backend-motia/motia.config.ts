import { defineConfig } from 'motia';
import { connectDB } from './src/db/connection';

export default defineConfig({
  steps: './steps/**/*.ts',
  port: parseInt(process.env.PORT || '5000'),
  onStart: async () => {
    // Connect to MongoDB on startup
    await connectDB();
    console.log('✅ DecentraID Backend Ready');
  }
});

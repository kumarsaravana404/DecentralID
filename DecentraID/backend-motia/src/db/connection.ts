import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decentraid';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB Runtime Error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
    });
    
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot start without database in production mode');
      process.exit(1);
    }
    throw err;
  }
}

export { mongoose };

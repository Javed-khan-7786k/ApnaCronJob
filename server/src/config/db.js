import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

let isConnected = false;

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected. Retrying connection in background...');
});

export async function connectDB(uri = env.MONGODB_URI) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: err.message });
    throw err;
  }
}

let retryIntervalTimer = null;

export function startBackgroundDbRetry(uri = env.MONGODB_URI) {
  if (retryIntervalTimer || (mongoose.connection && mongoose.connection.readyState === 1)) {
    return;
  }
  logger.info('Starting background MongoDB reconnect loop (interval 5s)...');
  retryIntervalTimer = setInterval(async () => {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      clearInterval(retryIntervalTimer);
      retryIntervalTimer = null;
      return;
    }
    try {
      await connectDB(uri);
      logger.info('Background MongoDB reconnect succeeded!');
      clearInterval(retryIntervalTimer);
      retryIntervalTimer = null;
    } catch (err) {
      logger.warn(`Background MongoDB reconnection attempt failed: ${err.message}`);
    }
  }, 5000);
}

export function stopBackgroundDbRetry() {
  if (retryIntervalTimer) {
    clearInterval(retryIntervalTimer);
    retryIntervalTimer = null;
  }
}

export function isDatabaseHealthy() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  stopBackgroundDbRetry();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
}

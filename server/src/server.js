import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startInProcessScheduler, stopInProcessScheduler, triggerJobNow } from './services/schedulerService.js';
import { startTelegramPolling, stopTelegramPolling } from './services/telegramService.js';
import { startSelfPinger, stopSelfPinger } from './services/selfPingerService.js';

let server = null;

async function bootstrap() {
  try {
    logger.info('Starting Apna Scheduler OS...');

    // 1. Connect to Database
    try {
      await connectDB();
    } catch (dbErr) {
      logger.warn(`Initial MongoDB connection failed: ${dbErr.message}. Server will start and retry in background.`);
    }

    // 2. Start HTTP Express Server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 Apna Scheduler API Server running on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`🌐 Health check: http://localhost:${env.PORT}/api/health`);
      logger.info(`⏰ Internal Tick endpoint: http://localhost:${env.PORT}/internal/tick`);
    });

    // 3. Start Scheduler Engine
    startInProcessScheduler();

    // 4. Start Telegram Bot Polling if enabled
    startTelegramPolling(triggerJobNow);

    // 5. Start Keep-Alive Self-Pinger (prevents sleeping on free cloud tiers)
    startSelfPinger();

  } catch (err) {
    logger.error('Fatal bootstrap error', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// Graceful Shutdown handling
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  stopInProcessScheduler();
  stopTelegramPolling();
  stopSelfPinger();

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }

  await disconnectDB();

  logger.info('Graceful shutdown completed. Exiting process.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  // In production, exit to let supervisor restart clean
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

bootstrap();

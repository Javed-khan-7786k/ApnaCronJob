import env from './config/env.js';
import logger from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startInProcessScheduler, stopInProcessScheduler, triggerJobNow } from './services/schedulerService.js';
import { startTelegramPolling, stopTelegramPolling } from './services/telegramService.js';

async function startWorker() {
  logger.info('Initializing Standalone Worker Node for Apna Scheduler...');

  await connectDB();
  startInProcessScheduler();
  startTelegramPolling(triggerJobNow);

  logger.info('Standalone Worker Node is active and listening for due jobs and retries.');
}

async function shutdownWorker(signal) {
  logger.info(`Worker received ${signal}. Stopping queues...`);
  stopInProcessScheduler();
  stopTelegramPolling();
  await disconnectDB();
  process.exit(0);
}

process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
process.on('SIGINT', () => shutdownWorker('SIGINT'));

startWorker().catch(err => {
  logger.error('Worker failed to initialize', { error: err.message });
  process.exit(1);
});

import express from 'express';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { tickLimiter } from '../middleware/rateLimiter.js';
import { processSchedulerTick } from '../services/schedulerService.js';

const router = express.Router();

/**
 * POST /internal/tick
 * Protected trigger endpoint used by GitHub Actions, Render Cron, or external triggers
 */
router.post('/tick', tickLimiter, async (req, res) => {
  const incomingSecret = req.headers['x-tick-secret'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!incomingSecret || incomingSecret !== env.INTERNAL_TICK_SECRET) {
    logger.warn('Unauthorized tick trigger attempt detected', {
      ip: req.ip,
      providedSecret: incomingSecret ? '[MISMATCHED]' : '[MISSING]',
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing X-Tick-Secret header.',
    });
  }

  const startTime = Date.now();
  logger.info('External tick trigger invoked', { ip: req.ip });

  try {
    const summary = await processSchedulerTick('tick');
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      summary,
    });
  } catch (err) {
    logger.error('Error executing tick process', { error: err.message });
    res.status(500).json({
      success: false,
      error: `Tick execution failed: ${err.message}`,
    });
  }
});

export default router;

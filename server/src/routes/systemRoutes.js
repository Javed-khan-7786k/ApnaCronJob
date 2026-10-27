import express from 'express';
import mongoose from 'mongoose';
import { isDatabaseHealthy } from '../config/db.js';
import env from '../config/env.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const serverStartTime = Date.now();

// GET /api/health (Liveness probe)
router.get('/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: 'ok',
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    service: 'aapna-cron-job',
  });
});

// GET /api/ready (Readiness probe: validates DB & Scheduler)
router.get('/ready', (req, res) => {
  const dbOk = isDatabaseHealthy();
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

  if (!dbOk || dbState !== 1) {
    return res.status(503).json({
      status: 'unready',
      database: {
        healthy: false,
        state: dbState,
      },
      scheduler: env.SCHEDULER_ENABLED,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    status: 'ready',
    database: {
      healthy: true,
      state: 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    scheduler: {
      enabled: env.SCHEDULER_ENABLED,
      tickIntervalMs: env.SCHEDULER_TICK_INTERVAL_MS,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/system/stats (Dashboard statistics)
router.get('/system/stats', authenticateToken, async (req, res, next) => {
  try {
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const next24h = new Date(Date.now() + (24 * 60 * 60 * 1000));

    const [
      totalJobs,
      enabledJobs,
      totalExecutions,
      success24h,
      failed24h,
      retryingCount,
      upcomingCount,
      lastSuccess,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ enabled: true }),
      Execution.countDocuments(),
      Execution.countDocuments({ status: 'completed', createdAt: { $gte: oneDayAgo } }),
      Execution.countDocuments({ status: 'failed', createdAt: { $gte: oneDayAgo } }),
      Execution.countDocuments({ status: 'retrying' }),
      Job.countDocuments({ enabled: true, nextRunAt: { $gte: new Date(), $lte: next24h } }),
      Execution.findOne({ status: 'completed' }).sort({ completedAt: -1 }).select('jobName completedAt durationMs'),
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        enabledJobs,
        disabledJobs: totalJobs - enabledJobs,
        totalExecutions,
        success24h,
        failed24h,
        retryingCount,
        upcomingCount,
        lastSuccess: lastSuccess ? {
          jobName: lastSuccess.jobName,
          completedAt: lastSuccess.completedAt,
          durationMs: lastSuccess.durationMs,
        } : null,
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        databaseConnected: isDatabaseHealthy(),
        schedulerActive: env.SCHEDULER_ENABLED,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

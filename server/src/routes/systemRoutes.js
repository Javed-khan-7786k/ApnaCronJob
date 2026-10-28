import express from 'express';
import mongoose from 'mongoose';
import { isDatabaseHealthy } from '../config/db.js';
import env from '../config/env.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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

    const jobFilter = req.user && req.user.role !== 'admin' ? { createdBy: req.user._id } : {};
    let executionFilter = {};
    if (req.user && req.user.role !== 'admin') {
      const userJobs = await Job.find({ createdBy: req.user._id }).select('_id');
      executionFilter = { jobId: { $in: userJobs.map(j => j._id) } };
    }

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
      Job.countDocuments(jobFilter),
      Job.countDocuments({ ...jobFilter, enabled: true }),
      Execution.countDocuments(executionFilter),
      Execution.countDocuments({ ...executionFilter, status: 'completed', createdAt: { $gte: oneDayAgo } }),
      Execution.countDocuments({ ...executionFilter, status: 'failed', createdAt: { $gte: oneDayAgo } }),
      Execution.countDocuments({ ...executionFilter, status: 'retrying' }),
      Job.countDocuments({ ...jobFilter, enabled: true, nextRunAt: { $gte: new Date(), $lte: next24h } }),
      Execution.findOne({ ...executionFilter, status: 'completed' }).sort({ completedAt: -1 }).select('jobName completedAt durationMs'),
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

import {
  getSelfPingerStatus,
  updateSelfPingerConfig,
  executePing,
} from '../services/selfPingerService.js';
import { validateUrlForSSRF } from '../utils/ssrf.js';

// GET /api/system/self-pinger (Get keepalive status - Admin only)
router.get('/system/self-pinger', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: getSelfPingerStatus(),
  });
});

// POST /api/system/self-pinger (Configure self-pinger - Admin only)
router.post('/system/self-pinger', authenticateToken, requireAdmin, async (req, res) => {
  const { enabled, intervalMs, targetUrl } = req.body;

  if (targetUrl && typeof targetUrl === 'string' && targetUrl.trim()) {
    const ssrfCheck = await validateUrlForSSRF(targetUrl.trim());
    if (!ssrfCheck.safe) {
      return res.status(400).json({
        success: false,
        error: `SSRF Violation: Target URL rejected: ${ssrfCheck.error}`,
      });
    }
  }

  if (intervalMs !== undefined && (isNaN(Number(intervalMs)) || Number(intervalMs) < 30000)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid intervalMs: minimum interval is 30000ms (30 seconds)',
    });
  }

  const updated = updateSelfPingerConfig({ enabled, intervalMs, targetUrl });
  res.json({
    success: true,
    message: 'Self-pinger configuration updated successfully',
    data: updated,
  });
});

// POST /api/system/self-pinger/ping-now (Manual test ping - Admin only)
router.post('/system/self-pinger/ping-now', authenticateToken, requireAdmin, async (req, res) => {
  const result = await executePing();
  res.json({
    success: result.success,
    data: result,
  });
});

import Setting from '../models/Setting.js';

// GET /api/system/settings
router.get('/system/settings', authenticateToken, async (req, res, next) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: {
          workspaceName: 'Production Infrastructure',
          supportEmail: 'engineering@acme.dev',
          defaultTimeout: 30,
          retentionDays: 30,
        },
      });
    }

    let settings = await Setting.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await Setting.create({
        userId: req.user._id,
        workspaceName: 'Production Infrastructure',
        supportEmail: req.user.email || 'engineering@acme.dev',
        defaultTimeout: 30,
        retentionDays: 30,
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// POST /api/system/settings
router.post('/system/settings', authenticateToken, async (req, res, next) => {
  try {
    const { workspaceName, supportEmail, defaultTimeout, retentionDays } = req.body;
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: { workspaceName, supportEmail, defaultTimeout, retentionDays },
      });
    }

    let settings = await Setting.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(workspaceName !== undefined && { workspaceName }),
          ...(supportEmail !== undefined && { supportEmail }),
          ...(defaultTimeout !== undefined && { defaultTimeout: Number(defaultTimeout) }),
          ...(retentionDays !== undefined && { retentionDays: Number(retentionDays) }),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

export default router;

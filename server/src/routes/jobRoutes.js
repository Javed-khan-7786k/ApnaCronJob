import express from 'express';
import { z } from 'zod';
import Job from '../models/Job.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { buildCronExpression, calculateNextRunAt, getUpcomingRunsPreview, validateCronExpression, isValidTimezone } from '../utils/cronHelper.js';
import { validateUrlForSSRF } from '../utils/ssrf.js';
import { executeHttpRequest } from '../services/httpExecutor.js';
import { triggerJobNow } from '../services/schedulerService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

const jobInputSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  targetUrl: z.string().url(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']).default('GET'),
  headers: z.record(z.string()).optional().default({}),
  body: z.string().optional().default(''),
  expectedStatusCodes: z.array(z.number()).optional().default([200, 201, 202, 204]),
  responseValidation: z.object({
    containsText: z.string().optional().default(''),
  }).optional().default({}),
  scheduleType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']),
  scheduleTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().default('00:00'),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().default([]),
  daysOfMonth: z.array(z.number().min(1).max(31)).optional().default([]),
  customCron: z.string().optional().default(''),
  oneTimeRunAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default('Asia/Kolkata'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  enabled: z.boolean().default(true),
  timeoutMs: z.number().min(1000).max(120000).default(30000),
  retryPolicy: z.object({
    maxAttempts: z.number().min(1).max(10).default(10),
    delaySeconds: z.number().min(1).max(3600).default(5),
    strategy: z.enum(['fixed', 'exponential']).default('fixed'),
    retryOnHttp5xx: z.boolean().default(true),
    retryOn429: z.boolean().default(true),
    retryOnNetworkError: z.boolean().default(true),
  }).optional().default({}),
  misfirePolicy: z.enum(['skip', 'run-once', 'run-all']).default('run-once'),
  notificationSettings: z.object({
    notifyOnSuccess: z.boolean().default(false),
    notifyOnFailure: z.boolean().default(true),
    notifyOnRetryExhausted: z.boolean().default(true),
    telegramChatId: z.string().optional().default(''),
  }).optional().default({}),
});

// GET /api/jobs
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, tag, status, enabled, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { targetUrl: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    if (status) {
      query.lastStatus = status;
    }

    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ enabled: -1, nextRunAt: 1, createdAt: -1 }).skip(skip).limit(limitNum),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/preview-schedule
router.post('/preview-schedule', authenticateToken, async (req, res) => {
  try {
    const previews = getUpcomingRunsPreview(req.body, 5);
    res.json({ success: true, previews });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/jobs/test-request
router.post('/test-request', authenticateToken, async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body = '', timeoutMs = 15000, expectedStatusCodes = [200, 201, 202, 204] } = req.body;

    const result = await executeHttpRequest({
      url,
      method,
      headers,
      body,
      timeoutMs,
      expectedStatusCodes,
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs
router.post('/', authenticateToken, validateRequest(jobInputSchema), async (req, res, next) => {
  try {
    const data = req.body;

    // SSRF Check
    const ssrfCheck = await validateUrlForSSRF(data.targetUrl);
    if (!ssrfCheck.safe) {
      return res.status(400).json({
        success: false,
        error: `SSRF Violation: ${ssrfCheck.error}`,
      });
    }

    // Timezone validation
    if (!isValidTimezone(data.timezone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid IANA timezone "${data.timezone}".`,
      });
    }

    // Cron syntax validation
    if (data.scheduleType === 'custom') {
      const cronValidation = validateCronExpression(data.customCron);
      if (!cronValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid cron expression: ${cronValidation.error}`,
        });
      }
    }

    // Build cron expression
    let cronExpression = '';
    if (data.scheduleType !== 'once') {
      cronExpression = buildCronExpression({
        type: data.scheduleType,
        time: data.scheduleTime,
        daysOfWeek: data.daysOfWeek,
        daysOfMonth: data.daysOfMonth,
        customCron: data.customCron,
      });
    }

    const jobDoc = {
      ...data,
      cronExpression,
      createdBy: req.user._id,
    };

    // Calculate initial nextRunAt
    if (data.enabled) {
      jobDoc.nextRunAt = calculateNextRunAt(jobDoc);
    } else {
      jobDoc.nextRunAt = null;
    }

    const job = await Job.create(jobDoc);

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'JOB_CREATE',
      targetType: 'job',
      targetId: job._id,
      details: { name: job.name, url: job.targetUrl },
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id
router.put('/:id', authenticateToken, validateRequest(jobInputSchema), async (req, res, next) => {
  try {
    const data = req.body;

    const ssrfCheck = await validateUrlForSSRF(data.targetUrl);
    if (!ssrfCheck.safe) {
      return res.status(400).json({
        success: false,
        error: `SSRF Violation: ${ssrfCheck.error}`,
      });
    }

    if (!isValidTimezone(data.timezone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid IANA timezone "${data.timezone}".`,
      });
    }

    if (data.scheduleType === 'custom') {
      const cronValidation = validateCronExpression(data.customCron);
      if (!cronValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid cron expression: ${cronValidation.error}`,
        });
      }
    }

    let cronExpression = '';
    if (data.scheduleType !== 'once') {
      cronExpression = buildCronExpression({
        type: data.scheduleType,
        time: data.scheduleTime,
        daysOfWeek: data.daysOfWeek,
        daysOfMonth: data.daysOfMonth,
        customCron: data.customCron,
      });
    }

    const updateDoc = {
      ...data,
      cronExpression,
    };

    if (data.enabled) {
      updateDoc.nextRunAt = calculateNextRunAt(updateDoc);
    } else {
      updateDoc.nextRunAt = null;
    }

    const job = await Job.findByIdAndUpdate(req.params.id, updateDoc, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'JOB_UPDATE',
      targetType: 'job',
      targetId: job._id,
      ip: req.ip,
    });

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'JOB_DELETE',
      targetType: 'job',
      targetId: req.params.id,
      details: { name: job.name },
      ip: req.ip,
    });

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/run
router.post('/:id/run', authenticateToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const execution = await triggerJobNow(job, 'manual');

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'JOB_RUN_NOW',
      targetType: 'job',
      targetId: job._id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Manual execution triggered successfully',
      executionId: execution._id,
      status: execution.status,
      responseStatus: execution.responseStatus,
      durationMs: execution.durationMs,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/toggle
router.post('/:id/toggle', authenticateToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const newEnabled = !job.enabled;
    job.enabled = newEnabled;
    job.nextRunAt = newEnabled ? calculateNextRunAt(job) : null;
    await job.save();

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: newEnabled ? 'JOB_ENABLE' : 'JOB_PAUSE',
      targetType: 'job',
      targetId: job._id,
      ip: req.ip,
    });

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/duplicate
router.post('/:id/duplicate', authenticateToken, async (req, res, next) => {
  try {
    const original = await Job.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.name = `${original.name} (Copy)`;
    duplicateData.lastStatus = 'never_run';
    duplicateData.lastRunAt = null;
    duplicateData.nextRunAt = original.enabled ? calculateNextRunAt(duplicateData) : null;
    duplicateData.createdBy = req.user._id;

    const duplicatedJob = await Job.create(duplicateData);

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'JOB_DUPLICATE',
      targetType: 'job',
      targetId: duplicatedJob._id,
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: duplicatedJob });
  } catch (err) {
    next(err);
  }
});

export default router;

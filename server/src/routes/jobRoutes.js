import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Job from '../models/Job.js';
import { authenticateToken } from '../middleware/auth.js';
import { buildCronExpression, calculateNextRunAt, getUpcomingRunsPreview, validateCronExpression, isValidTimezone } from '../utils/cronHelper.js';
import { validateUrlForSSRF } from '../utils/ssrf.js';
import { executeHttpRequest } from '../services/httpExecutor.js';
import { triggerJobNow } from '../services/schedulerService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

async function findJobDoc(id) {
  if (mongoose.isValidObjectId(id)) {
    const byId = await Job.findById(id);
    if (byId) return byId;
  }
  return await Job.findOne({ $or: [{ name: id }] });
}

/**
 * Normalizes input from both the React console and the TanStack frontend
 */
function normalizeJobInput(body) {
  const data = { ...body };

  // Normalize target URL
  if (data.url && !data.targetUrl) {
    data.targetUrl = data.url;
  }

  // Normalize HTTP method
  if (data.method && !data.httpMethod) {
    data.httpMethod = String(data.method).toUpperCase();
  }

  // Normalize cron expression
  if (data.cron && !data.customCron && !data.cronExpression) {
    data.customCron = data.cron;
    data.scheduleType = 'custom';
  }

  // Normalize timeout
  if (data.timeoutSeconds !== undefined && data.timeoutMs === undefined) {
    data.timeoutMs = Number(data.timeoutSeconds) * 1000;
  }

  // Normalize retry policy
  data.retryPolicy = data.retryPolicy || {};
  if (data.maxRetries !== undefined) {
    data.retryPolicy.maxAttempts = Number(data.maxRetries);
  }
  if (data.retryBackoff !== undefined) {
    data.retryPolicy.strategy = data.retryBackoff;
  }

  // Normalize headers
  if (Array.isArray(data.headers)) {
    data.headersList = data.headers;
    const obj = {};
    data.headers.forEach(h => {
      if (h && h.key && h.key.trim()) obj[h.key.trim()] = String(h.value || '');
    });
    data.headers = obj;
  } else if (data.headers && typeof data.headers === 'object') {
    data.headersList = Object.entries(data.headers).map(([k, v]) => ({ key: k, value: String(v) }));
  }

  // Handle authMode header injection if configured
  if (data.authMode === 'bearer' && data.authToken) {
    data.headers = data.headers || {};
    data.headers['Authorization'] = `Bearer ${data.authToken}`;
  }

  return data;
}

// GET /api/jobs (List jobs)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, tag, status, enabled, page = 1, limit = 100 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { targetUrl: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) query.tags = tag;
    if (status) query.lastStatus = status;
    if (enabled !== undefined) query.enabled = enabled === 'true';

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
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
    const normalized = normalizeJobInput(req.body);
    const previews = getUpcomingRunsPreview(normalized, 5);
    res.json({ success: true, previews });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/jobs/test-request
router.post('/test-request', authenticateToken, async (req, res) => {
  try {
    const { url, targetUrl, method = 'GET', httpMethod, headers = {}, body = '', timeoutMs = 15000, expectedStatusCodes = [200, 201, 202, 204] } = req.body;

    let headerObj = headers;
    if (Array.isArray(headers)) {
      headerObj = {};
      headers.forEach(h => {
        if (h && h.key) headerObj[h.key] = h.value;
      });
    }

    const result = await executeHttpRequest({
      url: url || targetUrl,
      method: (httpMethod || method).toUpperCase(),
      headers: headerObj,
      body,
      timeoutMs,
      expectedStatusCodes,
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs (Create Job)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const data = normalizeJobInput(req.body);

    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ success: false, error: 'Job name is required.' });
    }
    if (!data.targetUrl || !data.targetUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Target URL is required.' });
    }

    // SSRF Check
    const ssrfCheck = await validateUrlForSSRF(data.targetUrl);
    if (!ssrfCheck.safe) {
      return res.status(400).json({
        success: false,
        error: `SSRF Violation: ${ssrfCheck.error}`,
      });
    }

    // Timezone validation
    const tz = data.timezone || 'Asia/Kolkata';
    if (!isValidTimezone(tz)) {
      return res.status(400).json({
        success: false,
        error: `Invalid IANA timezone "${tz}".`,
      });
    }

    // Cron validation
    let cronExpression = data.cronExpression || '';
    if (data.scheduleType === 'custom' || data.customCron) {
      const expr = data.customCron || data.cron;
      const cronValidation = validateCronExpression(expr);
      if (!cronValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid cron expression: ${cronValidation.error}`,
        });
      }
      cronExpression = expr;
    } else if (data.scheduleType !== 'once') {
      cronExpression = buildCronExpression({
        type: data.scheduleType || 'daily',
        time: data.scheduleTime || '00:00',
        daysOfWeek: data.daysOfWeek || [],
        daysOfMonth: data.daysOfMonth || [],
        customCron: data.customCron,
      });
    }

    const jobDoc = {
      ...data,
      timezone: tz,
      cronExpression,
      createdBy: req.user?._id,
      status: data.enabled !== false ? 'active' : 'paused',
    };

    if (data.enabled !== false) {
      jobDoc.nextRunAt = calculateNextRunAt(jobDoc);
    } else {
      jobDoc.nextRunAt = null;
    }

    const job = await Job.create(jobDoc);

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
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
    const job = await findJobDoc(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const data = normalizeJobInput(req.body);

    if (data.targetUrl) {
      const ssrfCheck = await validateUrlForSSRF(data.targetUrl);
      if (!ssrfCheck.safe) {
        return res.status(400).json({
          success: false,
          error: `SSRF Violation: ${ssrfCheck.error}`,
        });
      }
    }

    const tz = data.timezone || 'Asia/Kolkata';
    if (!isValidTimezone(tz)) {
      return res.status(400).json({
        success: false,
        error: `Invalid IANA timezone "${tz}".`,
      });
    }

    let cronExpression = data.cronExpression || '';
    if (data.scheduleType === 'custom' || data.customCron) {
      const expr = data.customCron || data.cron;
      const cronValidation = validateCronExpression(expr);
      if (!cronValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid cron expression: ${cronValidation.error}`,
        });
      }
      cronExpression = expr;
    } else if (data.scheduleType !== 'once') {
      cronExpression = buildCronExpression({
        type: data.scheduleType || 'daily',
        time: data.scheduleTime || '00:00',
        daysOfWeek: data.daysOfWeek || [],
        daysOfMonth: data.daysOfMonth || [],
        customCron: data.customCron,
      });
    }

    const updateDoc = {
      ...data,
      cronExpression,
      status: data.enabled !== false ? 'active' : 'paused',
    };

    if (data.enabled !== false) {
      updateDoc.nextRunAt = calculateNextRunAt(updateDoc);
    } else {
      updateDoc.nextRunAt = null;
    }

    const existing = await findJobDoc(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const job = await Job.findByIdAndUpdate(existing._id, updateDoc, { new: true });

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
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
    const existing = await findJobDoc(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await Job.findByIdAndDelete(existing._id);

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
      action: 'JOB_DELETE',
      targetType: 'job',
      targetId: existing._id,
      details: { name: existing.name },
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
    const job = await findJobDoc(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const execution = await triggerJobNow(job, 'manual');

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
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
      data: execution,
    });
  } catch (err) {
    next(err);
  }
});

const toggleJobHandler = async (req, res, next) => {
  try {
    const job = await findJobDoc(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const newEnabled = !job.enabled;
    job.enabled = newEnabled;
    job.status = newEnabled ? 'active' : 'paused';
    job.nextRunAt = newEnabled ? calculateNextRunAt(job) : null;
    await job.save();

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
      action: newEnabled ? 'JOB_ENABLE' : 'JOB_PAUSE',
      targetType: 'job',
      targetId: job._id,
      ip: req.ip,
    });

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// Support both POST and PATCH for toggle
router.post('/:id/toggle', authenticateToken, toggleJobHandler);
router.patch('/:id/toggle', authenticateToken, toggleJobHandler);

// POST /api/jobs/:id/duplicate
router.post('/:id/duplicate', authenticateToken, async (req, res, next) => {
  try {
    const original = await Job.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.name = `${original.name} (Copy)`;
    duplicateData.lastStatus = 'never_run';
    duplicateData.lastRunAt = null;
    duplicateData.nextRunAt = original.enabled ? calculateNextRunAt(duplicateData) : null;
    duplicateData.createdBy = req.user?._id;

    const duplicatedJob = await Job.create(duplicateData);

    await logAuditEvent({
      userId: req.user?._id,
      username: req.user?.username || 'system',
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

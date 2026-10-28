import express from 'express';
import Execution from '../models/Execution.js';
import Job from '../models/Job.js';
import { authenticateToken, requireEditorOrAdmin } from '../middleware/auth.js';
import { performExecution } from '../services/schedulerService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// GET /api/executions
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { jobId, status, triggerSource, page = 1, limit = 50 } = req.query;
    const query = {};

    if (req.user && req.user.role !== 'admin') {
      const userJobs = await Job.find({ createdBy: req.user._id }).select('_id');
      const userJobIds = userJobs.map(j => j._id);
      if (jobId) {
        if (!userJobIds.some(id => String(id) === String(jobId))) {
          return res.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: Number(limit) || 50, total: 0, pages: 0 },
          });
        }
        query.jobId = jobId;
      } else {
        query.jobId = { $in: userJobIds };
      }
    } else if (jobId) {
      query.jobId = jobId;
    }

    if (status) query.status = status;
    if (triggerSource) query.triggerSource = triggerSource;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [executions, total] = await Promise.all([
      Execution.find(query)
        .select('-responseBody -responseHeaders') // exclude heavy body for list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Execution.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: executions,
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

// GET /api/executions/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution record not found' });
    }

    if (req.user && req.user.role !== 'admin') {
      const parentJob = await Job.findById(execution.jobId);
      if (!parentJob || !parentJob.createdBy || String(parentJob.createdBy) !== String(req.user._id)) {
        return res.status(404).json({ success: false, error: 'Execution record not found' });
      }
    }

    res.json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
});

// POST /api/executions/:id/retry
router.post('/:id/retry', authenticateToken, requireEditorOrAdmin, async (req, res, next) => {
  try {
    const existing = await Execution.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Execution record not found' });
    }

    if (existing.status === 'running') {
      return res.status(409).json({ success: false, error: 'Execution is currently in progress' });
    }

    const job = await Job.findById(existing.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Parent job was not found' });
    }

    if (req.user && req.user.role !== 'admin') {
      if (!job.createdBy || String(job.createdBy) !== String(req.user._id)) {
        return res.status(404).json({ success: false, error: 'Parent job was not found' });
      }
    }

    // Atomically claim the execution for manual retry to prevent race conditions
    const execution = await Execution.findOneAndUpdate(
      {
        _id: existing._id,
        status: { $ne: 'running' },
      },
      {
        $set: {
          status: 'running',
          workerId: 'manual-api',
          lockedUntil: new Date(Date.now() + (job.timeoutMs || 60000) + 15000),
        },
      },
      { new: true }
    );

    if (!execution) {
      return res.status(409).json({ success: false, error: 'Execution is currently running or was claimed' });
    }

    execution.logs.push({
      timestamp: new Date(),
      level: 'INFO',
      message: `Manual retry initiated by user ${req.user.username}`,
    });

    const updated = await performExecution(job, execution);

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'EXECUTION_MANUAL_RETRY',
      targetType: 'execution',
      targetId: execution._id,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: updated,
      message: `Retry completed with status: ${updated.status}`,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/executions/purge
router.delete('/purge', authenticateToken, requireEditorOrAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "days" must be a positive integer greater than or equal to 1.',
      });
    }

    const thresholdDate = new Date(Date.now() - (parsedDays * 86400000));
    const deleteQuery = {
      createdAt: { $lt: thresholdDate },
      status: { $in: ['completed', 'failed'] },
    };

    if (req.user && req.user.role !== 'admin') {
      const userJobs = await Job.find({ createdBy: req.user._id }).select('_id');
      deleteQuery.jobId = { $in: userJobs.map(j => j._id) };
    }

    const result = await Execution.deleteMany(deleteQuery);

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'EXECUTIONS_PURGE',
      targetType: 'execution',
      details: { deletedCount: result.deletedCount, olderThanDays: parsedDays },
      ip: req.ip,
    });

    res.json({
      success: true,
      message: `Purged ${result.deletedCount} executions older than ${parsedDays} days.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

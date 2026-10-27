import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit-logs
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { action, targetType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
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

export default router;

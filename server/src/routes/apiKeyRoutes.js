import express from 'express';
import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// GET /api/api-keys
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
});

// POST /api/api-keys (Generate new API Key)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { label = 'API Worker Key', scopes = ['jobs:read', 'jobs:write', 'runs:dispatch'] } = req.body;

    // Generate random secure token
    const randomHex = crypto.randomBytes(24).toString('hex');
    const secretKey = `crn_live_${randomHex}`;
    const prefix = secretKey.substring(0, 13);
    const keyHash = crypto.createHash('sha256').update(secretKey).digest('hex');

    const apiKey = await ApiKey.create({
      label: label.trim() || 'New API Key',
      prefix,
      keyHash,
      scopes,
      userId: req.user._id,
    });

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'API_KEY_CREATE',
      targetType: 'system',
      targetId: apiKey._id,
      details: { label: apiKey.label, prefix: apiKey.prefix },
      ip: req.ip,
    });

    // Return the secretKey only ONCE upon creation!
    res.status(201).json({
      success: true,
      data: {
        ...apiKey.toJSON(),
        secretKey, // full plaintext key revealed once
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/api-keys/:id (Revoke key)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'API_KEY_REVOKE',
      targetType: 'system',
      targetId: req.params.id,
      details: { label: apiKey.label, prefix: apiKey.prefix },
      ip: req.ip,
    });

    res.json({ success: true, message: `Key "${apiKey.label}" revoked successfully` });
  } catch (err) {
    next(err);
  }
});

export default router;

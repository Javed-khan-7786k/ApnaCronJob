import express from 'express';
import Integration from '../models/Integration.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

const INITIAL_INTEGRATIONS = [
  {
    name: 'Slack Alerts Bot',
    category: 'Messaging',
    description: 'Post structured incident summaries and recovery announcements to designated Slack channels.',
    connected: true,
    icon: 'slack',
  },
  {
    name: 'Discord Webhook Dispatcher',
    category: 'Messaging',
    description: 'Stream execution logs, failed assertions, and retry exhaustions directly into your Discord dev guild.',
    connected: false,
    icon: 'discord',
  },
  {
    name: 'PagerDuty Incident Escalation',
    category: 'Incident',
    description: 'Automatically trigger high-urgency incidents when primary production sync jobs fail.',
    connected: true,
    icon: 'pagerduty',
  },
  {
    name: 'GitHub Actions Wakeup Mesh',
    category: 'DevOps',
    description: 'Trigger CI/CD deployment pipelines or receive scheduled cron ticks from GitHub runner pools.',
    connected: true,
    icon: 'github',
  },
  {
    name: 'Generic HTTPS Webhook Sink',
    category: 'Webhooks',
    description: 'Deliver signed JSON payloads with HMAC-SHA256 signatures for custom downstream ingest.',
    connected: true,
    icon: 'webhook',
  },
];

// GET /api/integrations
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    let items = await Integration.find({ userId: req.user._id });

    if (items.length === 0) {
      items = await Integration.create(
        INITIAL_INTEGRATIONS.map(i => ({ ...i, userId: req.user._id }))
      );
    }

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/:id/toggle
router.post('/:id/toggle', authenticateToken, async (req, res, next) => {
  try {
    const item = await Integration.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    item.connected = !item.connected;
    await item.save();

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: item.connected ? 'INTEGRATION_CONNECT' : 'INTEGRATION_DISCONNECT',
      targetType: 'system',
      targetId: item._id,
      details: { name: item.name },
      ip: req.ip,
    });

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/integrations/:id/config
router.put('/:id/config', authenticateToken, async (req, res, next) => {
  try {
    const { config } = req.body;
    const item = await Integration.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { config },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

export default router;

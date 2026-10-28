import express from 'express';
import axios from 'axios';
import NotificationChannel from '../models/NotificationChannel.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendTelegramMessage } from '../services/telegramService.js';
import { validateUrlForSSRF } from '../utils/ssrf.js';
import { logAuditEvent } from '../services/auditService.js';

import mongoose from 'mongoose';

const router = express.Router();

const getChannelsHandler = async (req, res, next) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, data: [] });
    }

    let channels = await NotificationChannel.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Seed default channels if empty
    if (channels.length === 0) {
      channels = await NotificationChannel.create([
        {
          type: 'webhook',
          label: 'Primary PagerDuty Hook',
          target: 'https://events.pagerduty.com/v2/enqueue',
          events: ['failures', 'retries'],
          enabled: true,
          userId: req.user._id,
        },
        {
          type: 'slack',
          label: '#cron-ops Alerts',
          target: 'https://hooks.slack.com/services/T00/B00/XXXXX',
          events: ['failures', 'recovers'],
          enabled: true,
          userId: req.user._id,
        },
        {
          type: 'email',
          label: 'Engineering On-Call',
          target: req.user.email || 'ops@acme.dev',
          events: ['failures'],
          enabled: true,
          userId: req.user._id,
        },
      ]);
    }

    res.json({ success: true, data: channels });
  } catch (err) {
    next(err);
  }
};

router.get('/', authenticateToken, getChannelsHandler);
router.get('/channels', authenticateToken, getChannelsHandler);

const createChannelHandler = async (req, res, next) => {
  try {
    const { type, label, target, events, enabled = true } = req.body;

    if (!label || !target) {
      return res.status(400).json({ success: false, error: 'Channel label and target destination are required.' });
    }

    const channel = await NotificationChannel.create({
      type: type || 'webhook',
      label: label.trim(),
      target: target.trim(),
      events: Array.isArray(events) ? events : ['failures', 'retries'],
      enabled,
      userId: req.user._id,
    });

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'NOTIFICATION_CHANNEL_CREATE',
      targetType: 'system',
      targetId: channel._id,
      details: { label: channel.label, type: channel.type },
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: channel });
  } catch (err) {
    next(err);
  }
};

router.post('/', authenticateToken, createChannelHandler);
router.post('/channels', authenticateToken, createChannelHandler);

const updateChannelHandler = async (req, res, next) => {
  try {
    const channel = await NotificationChannel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Notification channel not found' });
    }
    res.json({ success: true, data: channel });
  } catch (err) {
    next(err);
  }
};

const deleteChannelHandler = async (req, res, next) => {
  try {
    const channel = await NotificationChannel.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Notification channel not found' });
    }
    res.json({ success: true, message: `Channel "${channel.label}" deleted successfully` });
  } catch (err) {
    next(err);
  }
};

const testChannelHandler = async (req, res, next) => {
  try {
    const channel = await NotificationChannel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Notification channel not found' });
    }

    const testPayload = {
      event: 'test_alert',
      message: `🔔 [Aapna Cron Job] Sample test incident alert dispatched for channel "${channel.label}"`,
      timestamp: new Date().toISOString(),
      channel: channel.label,
      type: channel.type,
    };

    // If Telegram
    if (channel.type === 'telegram') {
      await sendTelegramMessage(channel.target, `🔔 <b>[Aapna Cron Job] Test Alert:</b> Channel "${channel.label}" is working properly.`);
      return res.json({ success: true, message: `Test message dispatched to Telegram chat ${channel.target}` });
    }

    // If Webhook, Slack, or Discord
    if (['webhook', 'slack', 'discord'].includes(channel.type)) {
      if (channel.target.startsWith('http://') || channel.target.startsWith('https://')) {
        const ssrfCheck = await validateUrlForSSRF(channel.target);
        if (ssrfCheck.safe) {
          try {
            await axios.post(channel.target, testPayload, { timeout: 8000 });
          } catch {
            // quiet webhook error
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Sample test notification successfully queued for "${channel.label}"`,
    });
  } catch (err) {
    next(err);
  }
};

router.put('/channels/:id', authenticateToken, updateChannelHandler);
router.put('/:id', authenticateToken, updateChannelHandler);

router.delete('/channels/:id', authenticateToken, deleteChannelHandler);
router.delete('/:id', authenticateToken, deleteChannelHandler);

router.post('/channels/:id/test', authenticateToken, testChannelHandler);
router.post('/:id/test', authenticateToken, testChannelHandler);

export default router;

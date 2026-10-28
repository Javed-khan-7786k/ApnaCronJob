import express from 'express';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleTelegramMessage, sendTelegramMessage } from '../services/telegramService.js';
import { triggerJobNow } from '../services/schedulerService.js';

const router = express.Router();

// POST /api/telegram/webhook (Public endpoint for Telegram Bot API webhook)
router.post('/webhook', async (req, res) => {
  // Telegram Bot API secret token verification
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (!receivedSecret || receivedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
      logger.warn('Telegram webhook received with invalid or missing secret token');
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    // If webhook secret is not configured, reject external webhook calls to prevent forgery
    logger.warn('Telegram webhook rejected: TELEGRAM_WEBHOOK_SECRET is not configured');
    return res.status(403).json({ error: 'Webhook secret required' });
  }

  const update = req.body;
  if (update && update.message) {
    handleTelegramMessage(update.message, triggerJobNow).catch(err => {
      logger.error('Error processing Telegram webhook message', { error: err.message });
    });
  }

  // Telegram expects 200 OK fast
  res.status(200).json({ ok: true });
});

// POST /api/telegram/test (Authenticated test message dispatcher)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;
    const targetChatId = chatId || req.user.telegramChatId || env.TELEGRAM_ALLOWED_CHAT_IDS?.split(',')[0];

    if (!targetChatId) {
      return res.status(400).json({
        success: false,
        error: 'No Telegram Chat ID specified or configured.',
      });
    }

    if (!env.TELEGRAM_BOT_TOKEN) {
      return res.status(400).json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN is not configured in environment.',
      });
    }

    const testText = `🔔 <b>Apna Scheduler OS - Test Notification</b>\n\n` +
      `✅ Your Telegram integration is working properly!\n` +
      `🕒 Timestamp: <code>${new Date().toISOString()}</code>\n` +
      `👤 Triggered by: <b>${req.user.username}</b>`;

    const sent = await sendTelegramMessage(targetChatId, testText);

    if (sent) {
      res.json({ success: true, message: `Test message sent to Chat ID ${targetChatId}` });
    } else {
      res.status(502).json({ success: false, error: 'Telegram Bot API rejected the message. Verify Bot Token and Chat ID.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/info
router.get('/info', authenticateToken, (req, res) => {
  const isConfigured = !!env.TELEGRAM_BOT_TOKEN;
  const mode = env.TELEGRAM_POLLING_ENABLED ? 'polling' : (env.TELEGRAM_WEBHOOK_URL ? 'webhook' : 'none');
  const allowedCount = (env.TELEGRAM_ALLOWED_CHAT_IDS || '').split(',').filter(Boolean).length;

  res.json({
    success: true,
    data: {
      isConfigured,
      mode,
      allowedChatsConfigured: allowedCount,
      webhookUrl: env.TELEGRAM_WEBHOOK_URL ? `${env.TELEGRAM_WEBHOOK_URL.substring(0, 15)}...` : null,
    },
  });
});

export default router;

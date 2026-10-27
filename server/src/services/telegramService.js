import axios from 'axios';
import env from '../config/env.js';
import logger from '../config/logger.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { calculateNextRunAt } from '../utils/cronHelper.js';

let pollingInterval = null;
let lastUpdateId = 0;

/**
 * Checks if a Telegram Chat ID is authorized
 * @param {string|number} chatId
 * @returns {boolean}
 */
export function isChatAuthorized(chatId) {
  if (!chatId) return false;
  const strId = String(chatId);
  const allowed = (env.TELEGRAM_ALLOWED_CHAT_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    // If no specific chat IDs are set yet, warn and allow or reject
    return true;
  }

  return allowed.includes(strId);
}

/**
 * Sends a Telegram message using official Bot API
 * @param {string|number} chatId
 * @param {string} text
 * @param {string} parseMode
 * @returns {Promise<boolean>}
 */
export async function sendTelegramMessage(chatId, text, parseMode = 'HTML') {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) {
    return false;
  }

  const endpoint = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(endpoint, {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }, { timeout: 10000 });
    return true;
  } catch (err) {
    logger.warn('Failed to send Telegram message', {
      chatId,
      error: err.response?.data?.description || err.message,
    });
    return false;
  }
}

/**
 * Sends notifications to all configured administrators or job specific chats
 * @param {object} payload
 */
export async function notifyAdmins(text) {
  const allowed = (env.TELEGRAM_ALLOWED_CHAT_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  for (const chatId of allowed) {
    await sendTelegramMessage(chatId, text);
  }
}

/**
 * Dispatches notification for execution event
 * @param {object} job
 * @param {object} execution
 * @param {'success'|'failure'|'retry'|'exhausted'} eventType
 */
export async function dispatchExecutionNotification(job, execution, eventType) {
  const settings = job.notificationSettings || {};
  const targetChatId = settings.telegramChatId || env.TELEGRAM_ALLOWED_CHAT_IDS?.split(',')[0];

  if (!targetChatId) return;

  const jobName = job.name || 'Unnamed Job';
  const url = job.targetUrl;
  const status = execution.responseStatus || 'N/A';
  const duration = execution.durationMs ? `${execution.durationMs}ms` : '0ms';
  const attempts = `${execution.attemptCount}/${execution.maxAttempts}`;

  let title = '';
  let icon = '⚡';

  if (eventType === 'success' && settings.notifyOnSuccess) {
    title = `✅ <b>Job Succeeded: ${jobName}</b>`;
  } else if (eventType === 'failure' && settings.notifyOnFailure) {
    title = `⚠️ <b>Job Attempt Failed: ${jobName}</b>`;
    icon = '⚠️';
  } else if (eventType === 'exhausted' && settings.notifyOnRetryExhausted) {
    title = `🚨 <b>Job Retries Exhausted: ${jobName}</b>`;
    icon = '🚨';
  } else {
    return; // Notification not enabled for this event
  }

  const errorLine = execution.errorDetails?.message
    ? `\n❌ <b>Error:</b> <code>${execution.errorDetails.message.replace(/[<>]/g, '')}</code>`
    : '';

  const msg = `${title}
${icon} <b>Target:</b> <code>${url}</code>
📊 <b>Status:</b> ${status} | <b>Duration:</b> ${duration}
🔄 <b>Attempts:</b> ${attempts}${errorLine}
🕒 <b>Time:</b> ${new Date().toISOString()}`;

  await sendTelegramMessage(targetChatId, msg);
}

/**
 * Process a Telegram command from webhook or polling
 * @param {object} message
 * @param {Function} runJobNowCallback
 */
export async function handleTelegramMessage(message, runJobNowCallback) {
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (!isChatAuthorized(chatId)) {
    logger.warn('Unauthorized Telegram interaction attempt', { chatId, text });
    await sendTelegramMessage(chatId, '⛔ <b>Access Denied:</b> This chat is not authorized to interact with Apna Scheduler OS.');
    return;
  }

  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ').trim();

  switch (command) {
    case '/start':
    case '/help': {
      const helpMsg = `🤖 <b>Aapna Cron Job Bot Commands:</b>

/status - Health of API, DB, and Scheduler
/jobs - List active scheduled jobs
/next - View upcoming scheduled executions
/run <code>JOB_ID</code> - Trigger instant execution
/pause <code>JOB_ID</code> - Pause/disable a scheduled job
/resume <code>JOB_ID</code> - Enable/resume a scheduled job
/history - View 5 most recent executions
/failed - View latest failed executions

🔒 <i>Authorized Chat ID:</i> <code>${chatId}</code>`;
      await sendTelegramMessage(chatId, helpMsg);
      break;
    }

    case '/status': {
      const totalJobs = await Job.countDocuments();
      const enabledJobs = await Job.countDocuments({ enabled: true });
      const recentFails = await Execution.countDocuments({ status: 'failed', createdAt: { $gt: new Date(Date.now() - 86400000) } });
      const statusMsg = `📊 <b>System Status:</b>
🟢 <b>Scheduler:</b> Active
📁 <b>Total Jobs:</b> ${totalJobs} (${enabledJobs} enabled)
⚠️ <b>Failures (last 24h):</b> ${recentFails}
🕒 <b>Server Time:</b> ${new Date().toISOString()}`;
      await sendTelegramMessage(chatId, statusMsg);
      break;
    }

    case '/jobs': {
      const jobs = await Job.find().sort({ enabled: -1, createdAt: -1 }).limit(10);
      if (jobs.length === 0) {
        await sendTelegramMessage(chatId, 'ℹ️ No scheduled jobs found.');
        return;
      }
      let reply = `📋 <b>Scheduled Jobs:</b>\n\n`;
      jobs.forEach((j, i) => {
        const state = j.enabled ? '🟢 Enabled' : '⏸️ Paused';
        reply += `${i + 1}. <b>${j.name}</b> (${state})\n` +
                 `   ID: <code>${j._id}</code>\n` +
                 `   Schedule: ${j.scheduleType} | Next: ${j.nextRunAt ? new Date(j.nextRunAt).toLocaleTimeString() : 'N/A'}\n\n`;
      });
      await sendTelegramMessage(chatId, reply);
      break;
    }

    case '/next': {
      const nextJobs = await Job.find({ enabled: true, nextRunAt: { $ne: null } })
        .sort({ nextRunAt: 1 })
        .limit(5);
      if (nextJobs.length === 0) {
        await sendTelegramMessage(chatId, 'ℹ️ No upcoming jobs scheduled.');
        return;
      }
      let reply = `⏰ <b>Upcoming Executions:</b>\n\n`;
      nextJobs.forEach((j, i) => {
        reply += `${i + 1}. <b>${j.name}</b>\n` +
                 `   Time: <code>${new Date(j.nextRunAt).toISOString()}</code>\n` +
                 `   Target: ${j.targetUrl}\n\n`;
      });
      await sendTelegramMessage(chatId, reply);
      break;
    }

    case '/run': {
      if (!arg) {
        await sendTelegramMessage(chatId, '⚠️ Please provide Job ID. Usage: <code>/run &lt;JOB_ID&gt;</code>');
        return;
      }
      try {
        const job = await Job.findById(arg);
        if (!job) {
          await sendTelegramMessage(chatId, `❌ Job not found with ID <code>${arg}</code>`);
          return;
        }
        await sendTelegramMessage(chatId, `🚀 Initiating manual execution for <b>${job.name}</b>...`);
        if (runJobNowCallback) {
          await runJobNowCallback(job, 'telegram');
        }
        await sendTelegramMessage(chatId, `✅ Manual run completed for <b>${job.name}</b>.`);
      } catch (err) {
        await sendTelegramMessage(chatId, `❌ Failed to execute job: ${err.message}`);
      }
      break;
    }

    case '/pause': {
      if (!arg) {
        await sendTelegramMessage(chatId, '⚠️ Please provide Job ID. Usage: <code>/pause &lt;JOB_ID&gt;</code>');
        return;
      }
      const job = await Job.findByIdAndUpdate(arg, { enabled: false }, { new: true });
      if (!job) {
        await sendTelegramMessage(chatId, `❌ Job not found with ID <code>${arg}</code>`);
      } else {
        await sendTelegramMessage(chatId, `⏸️ Job <b>${job.name}</b> has been paused.`);
      }
      break;
    }

    case '/resume': {
      if (!arg) {
        await sendTelegramMessage(chatId, '⚠️ Please provide Job ID. Usage: <code>/resume &lt;JOB_ID&gt;</code>');
        return;
      }
      const job = await Job.findById(arg);
      if (!job) {
        await sendTelegramMessage(chatId, `❌ Job not found with ID <code>${arg}</code>`);
        return;
      }
      const nextRun = calculateNextRunAt(job);
      job.enabled = true;
      job.nextRunAt = nextRun;
      await job.save();
      await sendTelegramMessage(chatId, `▶️ Job <b>${job.name}</b> resumed. Next run: <code>${nextRun ? new Date(nextRun).toISOString() : 'N/A'}</code>`);
      break;
    }

    case '/history': {
      const executions = await Execution.find().sort({ createdAt: -1 }).limit(5);
      if (executions.length === 0) {
        await sendTelegramMessage(chatId, 'ℹ️ No execution history recorded.');
        return;
      }
      let reply = `📜 <b>Recent Executions:</b>\n\n`;
      executions.forEach((e, i) => {
        const icon = e.status === 'completed' ? '✅' : '❌';
        reply += `${i + 1}. ${icon} <b>${e.jobName || 'Job'}</b> (${e.status})\n` +
                 `   Status: ${e.responseStatus || 'N/A'} | Duration: ${e.durationMs}ms\n` +
                 `   Time: ${new Date(e.createdAt).toLocaleTimeString()}\n\n`;
      });
      await sendTelegramMessage(chatId, reply);
      break;
    }

    case '/failed': {
      const failed = await Execution.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(5);
      if (failed.length === 0) {
        await sendTelegramMessage(chatId, '🎉 No failed executions found!');
        return;
      }
      let reply = `🚨 <b>Latest Failed Executions:</b>\n\n`;
      failed.forEach((f, i) => {
        reply += `${i + 1}. <b>${f.jobName}</b>\n` +
                 `   Error: <code>${f.errorDetails?.message?.substring(0, 100) || 'Unknown'}</code>\n` +
                 `   Time: ${new Date(f.createdAt).toISOString()}\n\n`;
      });
      await sendTelegramMessage(chatId, reply);
      break;
    }

    default:
      await sendTelegramMessage(chatId, `❓ Unknown command: <code>${command}</code>. Send /help for available options.`);
  }
}

/**
 * Starts long-polling for local development if enabled
 * @param {Function} runJobNowCallback
 */
export function startTelegramPolling(runJobNowCallback) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_POLLING_ENABLED) return;

  logger.info('Starting Telegram Bot long-polling service...');

  pollingInterval = setInterval(async () => {
    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`;
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data?.ok && Array.isArray(res.data.result)) {
        for (const update of res.data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          if (update.message) {
            await handleTelegramMessage(update.message, runJobNowCallback);
          }
        }
      }
    } catch (err) {
      // Quiet poll errors
    }
  }, 3000);
}

export function stopTelegramPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

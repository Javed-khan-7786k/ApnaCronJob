import axios from 'axios';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { validateUrlForSSRF } from '../utils/ssrf.js';

let pingerIntervalTimer = null;
let pingerInitialTimer = null;

const pingerState = {
  enabled: env.SELF_PINGER_ENABLED ?? (process.env.SELF_PINGER_ENABLED !== 'false'),
  intervalMs: env.SELF_PINGER_INTERVAL_MS ?? parseInt(process.env.SELF_PINGER_INTERVAL_MS || '600000', 10), // default 10 minutes
  targetUrl: env.SELF_PINGER_TARGET_URL || process.env.SELF_PINGER_TARGET_URL || '',
  totalPings: 0,
  successCount: 0,
  failCount: 0,
  lastPingAt: null,
  lastPingDurationMs: 0,
  lastPingStatus: 'never',
  lastError: null,
};

function resolvePingUrl() {
  if (pingerState.targetUrl && pingerState.targetUrl.trim()) {
    return pingerState.targetUrl.trim();
  }
  const port = env.PORT || 5000;
  return `http://127.0.0.1:${port}/api/health`;
}

/**
 * Executes a single ping attempt
 */
export async function executePing() {
  const url = resolvePingUrl();
  const startTime = Date.now();
  pingerState.totalPings += 1;

  // If a custom target URL is configured, enforce SSRF validation before firing request
  if (pingerState.targetUrl && pingerState.targetUrl.trim()) {
    const ssrfCheck = await validateUrlForSSRF(url);
    if (!ssrfCheck.safe) {
      const duration = Date.now() - startTime;
      pingerState.lastPingAt = new Date().toISOString();
      pingerState.lastPingDurationMs = duration;
      pingerState.lastPingStatus = 'failed';
      pingerState.lastError = `SSRF Blocked: ${ssrfCheck.error}`;
      pingerState.failCount += 1;

      logger.warn(`[SelfPinger] Keep-alive ping rejected by SSRF guard: ${ssrfCheck.error}`);
      return {
        success: false,
        url,
        durationMs: duration,
        error: `SSRF Blocked: ${ssrfCheck.error}`,
        timestamp: pingerState.lastPingAt,
      };
    }
  }

  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'ApnaScheduler-SelfPinger/1.0',
        'X-KeepAlive-Ping': 'true',
      },
    });

    const duration = Date.now() - startTime;
    pingerState.lastPingAt = new Date().toISOString();
    pingerState.lastPingDurationMs = duration;
    pingerState.lastPingStatus = 'success';
    pingerState.lastError = null;
    pingerState.successCount += 1;

    logger.info(`[SelfPinger] Keep-alive ping succeeded (${duration}ms) -> ${url}`);
    return {
      success: true,
      url,
      durationMs: duration,
      statusCode: res.status,
      timestamp: pingerState.lastPingAt,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    pingerState.lastPingAt = new Date().toISOString();
    pingerState.lastPingDurationMs = duration;
    pingerState.lastPingStatus = 'failed';
    pingerState.lastError = err.message;
    pingerState.failCount += 1;

    logger.warn(`[SelfPinger] Keep-alive ping failed (${duration}ms) -> ${url}: ${err.message}`);
    return {
      success: false,
      url,
      durationMs: duration,
      error: err.message,
      timestamp: pingerState.lastPingAt,
    };
  }
}

/**
 * Starts the background self-pinger loop
 */
export function startSelfPinger() {
  if (pingerInitialTimer) {
    clearTimeout(pingerInitialTimer);
    pingerInitialTimer = null;
  }
  if (pingerIntervalTimer) {
    clearInterval(pingerIntervalTimer);
    pingerIntervalTimer = null;
  }

  if (!pingerState.enabled) {
    logger.info('[SelfPinger] Keep-alive self-pinger is disabled.');
    return;
  }

  const interval = Math.max(pingerState.intervalMs, 30000); // min 30 seconds
  logger.info(`[SelfPinger] Starting keep-alive self-pinger every ${Math.round(interval / 1000)}s`);

  // Initial delayed ping 10 seconds after boot
  pingerInitialTimer = setTimeout(() => {
    if (pingerState.enabled) {
      executePing().catch(() => {});
    }
  }, 10000);

  pingerIntervalTimer = setInterval(() => {
    if (pingerState.enabled) {
      executePing().catch(() => {});
    }
  }, interval);
}

/**
 * Stops the background self-pinger loop
 */
export function stopSelfPinger() {
  if (pingerInitialTimer) {
    clearTimeout(pingerInitialTimer);
    pingerInitialTimer = null;
  }
  if (pingerIntervalTimer) {
    clearInterval(pingerIntervalTimer);
    pingerIntervalTimer = null;
    logger.info('[SelfPinger] Keep-alive self-pinger stopped.');
  }
}

/**
 * Returns current status and telemetry
 */
export function getSelfPingerStatus() {
  return {
    ...pingerState,
    activeUrl: resolvePingUrl(),
    isRunning: !!pingerIntervalTimer && pingerState.enabled,
  };
}

/**
 * Updates self-pinger configuration at runtime
 */
export function updateSelfPingerConfig({ enabled, intervalMs, targetUrl }) {
  if (typeof enabled === 'boolean') {
    pingerState.enabled = enabled;
  }
  if (intervalMs && Number(intervalMs) >= 30000) {
    pingerState.intervalMs = Number(intervalMs);
  }
  if (typeof targetUrl === 'string') {
    pingerState.targetUrl = targetUrl.trim();
  }

  startSelfPinger();
  return getSelfPingerStatus();
}

export default {
  startSelfPinger,
  stopSelfPinger,
  executePing,
  getSelfPingerStatus,
  updateSelfPingerConfig,
};

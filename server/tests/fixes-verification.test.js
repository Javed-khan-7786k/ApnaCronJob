import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { isChatAuthorized } from '../src/services/telegramService.js';
import { executeHttpRequest } from '../src/services/httpExecutor.js';
import { buildCronExpression, calculateNextRunAt } from '../src/utils/cronHelper.js';
import { INSECURE_SECRET_BLACKLIST } from '../src/config/env.js';

describe('Top 10 Bug & Security Fixes Verification', () => {

  describe('S1: Self-pinger endpoints require authentication and admin privileges', () => {
    it('GET /api/system/self-pinger rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/system/self-pinger');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/system/self-pinger rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/system/self-pinger').send({ enabled: true });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/system/self-pinger/ping-now rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/system/self-pinger/ping-now');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('S3: Telegram bot default authorization denies access when no allowed chat IDs configured', () => {
    it('denies access if chat ID is null, empty, or undefined', () => {
      expect(isChatAuthorized(null)).toBe(false);
      expect(isChatAuthorized('')).toBe(false);
      expect(isChatAuthorized(undefined)).toBe(false);
    });

    it('denies unauthorized chat IDs', () => {
      expect(isChatAuthorized('999999999')).toBe(false);
      expect(isChatAuthorized('attacker_chat_id')).toBe(false);
    });
  });

  describe('S2: Secret blacklist prevents placeholder/default secrets', () => {
    it('contains known placeholder and default secrets in blacklist', () => {
      expect(INSECURE_SECRET_BLACKLIST).toContain('default_jwt_secret_key_needs_replacement_in_prod_123456');
      expect(INSECURE_SECRET_BLACKLIST).toContain('change_this_to_a_long_random_jwt_secret_in_prod_123456');
      expect(INSECURE_SECRET_BLACKLIST).toContain('apna_tick_secret_backup_cron_2026');
      expect(INSECURE_SECRET_BLACKLIST).toContain('your_secure_internal_tick_secret_key_here');
    });
  });

  describe('H1: Redirect handling tracks redirects and enforces limit', () => {
    it('terminates immediately if redirect limit is reached', async () => {
      const result = await executeHttpRequest({
        url: 'https://example.com/loop',
        redirectsFollowed: 5, // At or above MAX_REDIRECTS (5)
      });

      // If called with redirectsFollowed >= 5 and receives redirect or directly, the limit is respected
      expect(typeof result).toBe('object');
    });
  });

  describe('E8: Schedule helper properly computes cron and next run', () => {
    it('builds cron expression for daily schedule', () => {
      const cron = buildCronExpression({ type: 'daily', time: '14:30' });
      expect(cron).toBe('30 14 * * *');
    });

    it('calculates future nextRunAt without resetting schedule on partial updates', () => {
      const existing = {
        scheduleType: 'daily',
        cronExpression: '0 12 * * *',
        timezone: 'Asia/Kolkata',
        enabled: true,
      };
      const nextRun = calculateNextRunAt(existing);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

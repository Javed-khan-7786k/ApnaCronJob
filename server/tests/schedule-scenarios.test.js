import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import {
  buildCronExpression,
  validateCronExpression,
  calculateNextRunAt,
  getUpcomingRunsPreview,
  isValidTimezone,
} from '../src/utils/cronHelper.js';
import {
  calculateRetryDelay,
  shouldRetry,
} from '../src/services/retryService.js';
import {
  isRetryableError,
} from '../src/services/httpExecutor.js';
import {
  processSchedulerTick,
  performExecution,
  recoverStuckExecutions,
  triggerJobNow,
} from '../src/services/schedulerService.js';
import * as httpExecutor from '../src/services/httpExecutor.js';
import Job from '../src/models/Job.js';
import Execution from '../src/models/Execution.js';
import { signToken } from '../src/utils/crypto.js';

describe('Job Scheduling Engine — Comprehensive Multi-Scenario Vitest Suite', () => {

  const testUserToken = signToken({
    userId: '65f1234567890abcdef12345',
    username: 'test_scheduler_user',
    role: 'admin',
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SCENARIO 1: Schedule Expression Generation Across All Types
  // =========================================================================
  describe('Scenario 1: Cron Expression Generation by Schedule Type', () => {
    it('Scenario 1.1: Daily schedule generates correct "minute hour * * *" expression', () => {
      const cron1 = buildCronExpression({ type: 'daily', time: '14:30' });
      expect(cron1).toBe('30 14 * * *');

      const cron2 = buildCronExpression({ type: 'daily', time: '00:00' });
      expect(cron2).toBe('0 0 * * *');

      const cron3 = buildCronExpression({ type: 'daily', time: '23:59' });
      expect(cron3).toBe('59 23 * * *');
    });

    it('Scenario 1.2: Weekly schedule generates correct days of week (0=Sun, 1=Mon, ..., 6=Sat)', () => {
      // Monday, Wednesday, Friday at 09:15
      const cronWeekdays = buildCronExpression({
        type: 'weekly',
        time: '09:15',
        daysOfWeek: [1, 3, 5],
      });
      expect(cronWeekdays).toBe('15 9 * * 1,3,5');

      // Weekend (Sunday = 0, Saturday = 6) at 10:00
      const cronWeekend = buildCronExpression({
        type: 'weekly',
        time: '10:00',
        daysOfWeek: [0, 6],
      });
      expect(cronWeekend).toBe('0 10 * * 0,6');
    });

    it('Scenario 1.3: Monthly schedule generates correct days of month', () => {
      // 1st and 15th of each month at midnight
      const cronBimonthly = buildCronExpression({
        type: 'monthly',
        time: '00:00',
        daysOfMonth: [1, 15],
      });
      expect(cronBimonthly).toBe('0 0 1,15 * *');

      // End of month (31st)
      const cronEndMonth = buildCronExpression({
        type: 'monthly',
        time: '18:45',
        daysOfMonth: [31],
      });
      expect(cronEndMonth).toBe('45 18 31 * *');
    });

    it('Scenario 1.4: One-time schedule ("once") returns null cron expression', () => {
      const cronOnce = buildCronExpression({ type: 'once' });
      expect(cronOnce).toBeNull();
    });

    it('Scenario 1.5: Custom cron preserves trimmed cron string and rejects empty format', () => {
      const customCron = buildCronExpression({
        type: 'custom',
        customCron: '*/10 * * * *',
      });
      expect(customCron).toBe('*/10 * * * *');

      expect(() => buildCronExpression({ type: 'custom', customCron: '' })).toThrow(
        /Custom schedule requires a non-empty cron expression/i
      );
    });

    it('Scenario 1.6: Time validation strictly enforces 00:00 - 23:59 boundaries', () => {
      expect(() => buildCronExpression({ type: 'daily', time: '25:00' })).toThrow(/Invalid schedule time/i);
      expect(() => buildCronExpression({ type: 'daily', time: '12:65' })).toThrow(/Invalid schedule time/i);
      expect(() => buildCronExpression({ type: 'daily', time: '-1:30' })).toThrow(/Invalid schedule time/i);
    });
  });

  // =========================================================================
  // SCENARIO 2: Next Run Date & Time Calculation Accuracy
  // =========================================================================
  describe('Scenario 2: On-Time Next Run Calculation Accuracy', () => {
    const fixedReference = new Date('2026-06-15T10:00:00.000Z'); // A Monday

    it('Scenario 2.1: One-time job calculates exact future timestamp and null if past', () => {
      const futureRunAt = new Date('2026-06-15T12:00:00.000Z');
      const pastRunAt = new Date('2026-06-15T08:00:00.000Z');

      const futureJob = { scheduleType: 'once', oneTimeRunAt: futureRunAt };
      const pastJob = { scheduleType: 'once', oneTimeRunAt: pastRunAt };

      expect(calculateNextRunAt(futureJob, fixedReference)).toEqual(futureRunAt);
      expect(calculateNextRunAt(pastJob, fixedReference)).toBeNull();
    });

    it('Scenario 2.2: Daily schedule accurately lands on the target time', () => {
      // Reference is 10:00 UTC. Job scheduled for 15:30 UTC daily.
      const job = {
        scheduleType: 'daily',
        cronExpression: '30 15 * * *',
        timezone: 'UTC',
      };

      const nextRun = calculateNextRunAt(job, fixedReference);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.toISOString()).toBe('2026-06-15T15:30:00.000Z');

      // If reference is after 15:30 UTC (e.g., 16:00 UTC), next run must advance to next day
      const eveningRef = new Date('2026-06-15T16:00:00.000Z');
      const nextDayRun = calculateNextRunAt(job, eveningRef);
      expect(nextDayRun.toISOString()).toBe('2026-06-16T15:30:00.000Z');
    });

    it('Scenario 2.3: Weekly schedule skips non-scheduled days and selects next valid weekday', () => {
      // Reference: Monday 2026-06-15T10:00:00Z.
      // Scheduled for Wednesday (3) and Friday (5) at 09:00 UTC.
      const job = {
        scheduleType: 'weekly',
        cronExpression: '0 9 * * 3,5',
        timezone: 'UTC',
      };

      const nextRun = calculateNextRunAt(job, fixedReference);
      // Next run should be Wednesday, June 17, 2026 at 09:00:00Z
      expect(nextRun.toISOString()).toBe('2026-06-17T09:00:00.000Z');

      // From Wednesday after 09:00 UTC, next run should be Friday June 19, 2026 at 09:00:00Z
      const wednesdayAfternoon = new Date('2026-06-17T12:00:00.000Z');
      const fridayRun = calculateNextRunAt(job, wednesdayAfternoon);
      expect(fridayRun.toISOString()).toBe('2026-06-19T09:00:00.000Z');
    });

    it('Scenario 2.4: Sub-minute & frequent interval cron expressions calculate accurate cadence', () => {
      const jobEvery5m = {
        scheduleType: 'custom',
        cronExpression: '*/5 * * * *',
        timezone: 'UTC',
      };

      // Reference: 10:01:23 UTC -> next run must be 10:05:00 UTC
      const ref = new Date('2026-06-15T10:01:23.000Z');
      const nextRun = calculateNextRunAt(jobEvery5m, ref);
      expect(nextRun.toISOString()).toBe('2026-06-15T10:05:00.000Z');
    });
  });

  // =========================================================================
  // SCENARIO 3: Timezone Precision Across Different Geographies
  // =========================================================================
  describe('Scenario 3: Timezone Precision Across Different Geographies', () => {
    it('Scenario 3.1: Asia/Kolkata (UTC+5:30) converts 10:00 AM IST to 04:30 AM UTC', () => {
      const jobIST = {
        scheduleType: 'daily',
        cronExpression: '0 10 * * *', // 10:00 AM IST
        timezone: 'Asia/Kolkata',
      };

      const refIST = new Date('2026-06-15T00:00:00.000Z');
      const nextRun = calculateNextRunAt(jobIST, refIST);

      // 10:00 AM IST = 04:30 AM UTC
      expect(nextRun.toISOString()).toBe('2026-06-15T04:30:00.000Z');
    });

    it('Scenario 3.2: America/New_York daylight saving time offset alignment', () => {
      const jobNY = {
        scheduleType: 'daily',
        cronExpression: '0 9 * * *', // 09:00 AM New York time (EDT = UTC-4 in June)
        timezone: 'America/New_York',
      };

      const refNY = new Date('2026-06-15T00:00:00.000Z');
      const nextRun = calculateNextRunAt(jobNY, refNY);

      // 09:00 AM EDT = 13:00 UTC
      expect(nextRun.toISOString()).toBe('2026-06-15T13:00:00.000Z');
    });

    it('Scenario 3.3: Invalid timezone gracefully falls back to default system timezone', () => {
      const jobInvalidTZ = {
        scheduleType: 'daily',
        cronExpression: '0 12 * * *',
        timezone: 'NonExistent/Mars_Base',
      };

      const nextRun = calculateNextRunAt(jobInvalidTZ, new Date('2026-06-15T00:00:00.000Z'));
      expect(nextRun).toBeInstanceOf(Date);
    });
  });

  // =========================================================================
  // SCENARIO 4: Schedule Start & End Date Boundary Constraints
  // =========================================================================
  describe('Scenario 4: Start Date and End Date Lifespan Enforcement', () => {
    it('Scenario 4.1: Job with future startDate is not scheduled before that date', () => {
      const ref = new Date('2026-06-15T10:00:00.000Z');
      const futureStart = new Date('2026-07-01T00:00:00.000Z');

      const job = {
        scheduleType: 'daily',
        cronExpression: '0 12 * * *',
        startDate: futureStart,
        timezone: 'UTC',
      };

      const nextRun = calculateNextRunAt(job, ref);
      expect(nextRun.getTime()).toBeGreaterThanOrEqual(futureStart.getTime());
      expect(nextRun.toISOString()).toBe('2026-07-01T12:00:00.000Z');
    });

    it('Scenario 4.2: Job past its endDate returns null and ceases future execution', () => {
      const ref = new Date('2026-06-15T10:00:00.000Z');
      const pastEnd = new Date('2026-06-10T00:00:00.000Z');

      const job = {
        scheduleType: 'daily',
        cronExpression: '0 12 * * *',
        endDate: pastEnd,
        timezone: 'UTC',
      };

      const nextRun = calculateNextRunAt(job, ref);
      expect(nextRun).toBeNull();
    });
  });

  // =========================================================================
  // SCENARIO 5: Upcoming Schedule Preview (getUpcomingRunsPreview)
  // =========================================================================
  describe('Scenario 5: Multi-Occurrence Schedule Preview Generation', () => {
    it('Scenario 5.1: Generates requested count of future runs with relative & ISO formatting', () => {
      const preview = getUpcomingRunsPreview({
        scheduleType: 'daily',
        cronExpression: '0 8 * * *',
        timezone: 'UTC',
      }, 4);

      expect(preview).toHaveLength(4);
      preview.forEach((item) => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('formatted');
        expect(item).toHaveProperty('relative');
        expect(new Date(item.date).getTime()).toBeGreaterThan(Date.now() - 5000);
      });
    });

    it('Scenario 5.2: Preview truncates when reaching endDate boundary', () => {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      const preview = getUpcomingRunsPreview({
        scheduleType: 'daily',
        cronExpression: '0 12 * * *',
        endDate: threeDaysLater,
        timezone: 'UTC',
      }, 10);

      expect(preview.length).toBeLessThanOrEqual(4);
    });
  });

  // =========================================================================
  // SCENARIO 6: Retry Delays, Strategies & Error Classification
  // =========================================================================
  describe('Scenario 6: Retry Delays, Strategies & Error Classification', () => {
    it('Scenario 6.1: Fixed retry strategy applies exact delay interval', () => {
      const policy = { strategy: 'fixed', delaySeconds: 15 };
      expect(calculateRetryDelay(1, policy)).toBe(15000);
      expect(calculateRetryDelay(2, policy)).toBe(15000);
      expect(calculateRetryDelay(5, policy)).toBe(15000);
    });

    it('Scenario 6.2: Exponential backoff computes doubling delays with bounded jitter', () => {
      const policy = { strategy: 'exponential', delaySeconds: 5 };

      // Attempt 1: 5 * 2^0 = 5s (+/- 20% jitter = 4.0s to 6.0s)
      const d1 = calculateRetryDelay(1, policy);
      expect(d1).toBeGreaterThanOrEqual(4000);
      expect(d1).toBeLessThanOrEqual(6000);

      // Attempt 2: 5 * 2^1 = 10s (+/- 20% jitter = 8.0s to 12.0s)
      const d2 = calculateRetryDelay(2, policy);
      expect(d2).toBeGreaterThanOrEqual(8000);
      expect(d2).toBeLessThanOrEqual(12000);

      // Attempt 3: 5 * 2^2 = 20s (+/- 20% jitter = 16.0s to 24.0s)
      const d3 = calculateRetryDelay(3, policy);
      expect(d3).toBeGreaterThanOrEqual(16000);
      expect(d3).toBeLessThanOrEqual(24000);
    });

    it('Scenario 6.3: HTTP Retry-After header overrides internal policy', () => {
      const policy = { strategy: 'exponential', delaySeconds: 10 };
      const headerSec = 45;
      expect(calculateRetryDelay(1, policy, headerSec)).toBe(45000);
    });

    it('Scenario 6.4: Retry eligibility correctly checks attempt count against maximum', () => {
      expect(shouldRetry(1, 3, true)).toBe(true);
      expect(shouldRetry(2, 3, true)).toBe(true);
      expect(shouldRetry(3, 3, true)).toBe(false); // Max attempts reached
      expect(shouldRetry(1, 3, false)).toBe(false); // Non-retryable error
    });

    it('Scenario 6.5: Classifies transient vs permanent HTTP status codes correctly', () => {
      const policy = { retryOnHttp5xx: true, retryOn429: true, retryOnNetworkError: true };

      // Transient errors (retryable)
      expect(isRetryableError(500, '', policy)).toBe(true);
      expect(isRetryableError(502, '', policy)).toBe(true);
      expect(isRetryableError(503, '', policy)).toBe(true);
      expect(isRetryableError(504, '', policy)).toBe(true);
      expect(isRetryableError(429, '', policy)).toBe(true);
      expect(isRetryableError(408, '', policy)).toBe(true);
      expect(isRetryableError(null, 'ECONNRESET', policy)).toBe(true);

      // Permanent errors (non-retryable)
      expect(isRetryableError(200, '', policy)).toBe(false);
      expect(isRetryableError(400, '', policy)).toBe(false);
      expect(isRetryableError(401, '', policy)).toBe(false);
      expect(isRetryableError(404, '', policy)).toBe(false);
    });
  });

  // =========================================================================
  // SCENARIO 7: In-Memory Scheduler Execution Tick & On-Time Running
  // =========================================================================
  describe('Scenario 7: Scheduler Execution Tick & On-Time Running Engine', () => {
    it('Scenario 7.1: Job model properly populates schedule attributes & virtual getters', () => {
      const job = new Job({
        name: 'test_scenarios_model_persistence',
        targetUrl: 'https://httpbin.org/get',
        httpMethod: 'GET',
        scheduleType: 'daily',
        scheduleTime: '04:15',
        cronExpression: '15 4 * * *',
        timezone: 'Asia/Kolkata',
        enabled: true,
        timeoutMs: 45000,
        retryPolicy: { maxAttempts: 5, strategy: 'exponential', delaySeconds: 10 },
      });

      expect(job.cron).toBe('15 4 * * *');
      expect(job.timeoutSeconds).toBe(45);
      expect(job.maxRetries).toBe(5);
      expect(job.retryBackoff).toBe('exponential');
      expect(job.status).toBe('active');
    });

    it('Scenario 7.2: One-time job execution marks enabled: false after running on time', async () => {
      const pastDue = new Date(Date.now() - 5000);
      const mockJob = new Job({
        _id: new mongoose.Types.ObjectId(),
        name: 'test_scenarios_onetime_auto_complete',
        targetUrl: 'https://httpbin.org/status/200',
        httpMethod: 'GET',
        scheduleType: 'once',
        oneTimeRunAt: pastDue,
        nextRunAt: pastDue,
        enabled: true,
      });

      const mockExec = new Execution({
        _id: new mongoose.Types.ObjectId(),
        jobId: mockJob._id,
        jobName: mockJob.name,
        occurrenceId: `${mockJob._id}_${pastDue.toISOString()}`,
        status: 'pending',
        attemptCount: 0,
        maxAttempts: 3,
        logs: [],
      });

      vi.spyOn(Job, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockJob]),
        }),
      });
      vi.spyOn(mockJob, 'save').mockResolvedValue(mockJob);
      vi.spyOn(Execution, 'create').mockResolvedValue(mockExec);
      vi.spyOn(mockExec, 'save').mockResolvedValue(mockExec);
      vi.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue(mockJob);
      vi.spyOn(Execution, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockResolvedValue([]),
      });

      const mockHttp = vi.spyOn(httpExecutor, 'executeHttpRequest').mockResolvedValue({
        success: true,
        statusCode: 200,
        durationMs: 42,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Success' }),
        truncated: false,
        error: null,
        isRetryable: false,
        retryAfterSec: null,
      });

      const summary = await processSchedulerTick('test_runner');

      expect(summary.claimed).toBe(1);
      expect(mockJob.enabled).toBe(false); // One-time job auto-disabled!
      expect(mockExec.status).toBe('completed');
    });

    it('Scenario 7.3: Recurring job automatically advances nextRunAt into future after on-time execution', async () => {
      const pastDue = new Date(Date.now() - 10000);
      const mockJob = new Job({
        _id: new mongoose.Types.ObjectId(),
        name: 'test_scenarios_recurring_advance',
        targetUrl: 'https://httpbin.org/status/200',
        httpMethod: 'POST',
        scheduleType: 'custom',
        cronExpression: '*/5 * * * *', // Every 5 minutes
        nextRunAt: pastDue,
        enabled: true,
      });

      const mockExec = new Execution({
        _id: new mongoose.Types.ObjectId(),
        jobId: mockJob._id,
        jobName: mockJob.name,
        occurrenceId: `${mockJob._id}_${pastDue.toISOString()}`,
        status: 'pending',
        attemptCount: 0,
        maxAttempts: 3,
        logs: [],
      });

      vi.spyOn(Job, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockJob]),
        }),
      });
      vi.spyOn(mockJob, 'save').mockResolvedValue(mockJob);
      vi.spyOn(Execution, 'create').mockResolvedValue(mockExec);
      vi.spyOn(mockExec, 'save').mockResolvedValue(mockExec);
      vi.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue(mockJob);
      vi.spyOn(Execution, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.spyOn(httpExecutor, 'executeHttpRequest').mockResolvedValue({
        success: true,
        statusCode: 200,
        durationMs: 55,
        headers: {},
        body: 'OK',
        truncated: false,
        error: null,
        isRetryable: false,
        retryAfterSec: null,
      });

      await processSchedulerTick('test_runner');

      expect(mockJob.enabled).toBe(true); // Recurring remains enabled
      expect(mockJob.nextRunAt.getTime()).toBeGreaterThan(Date.now()); // Advanced forward!
      expect(mockExec.status).toBe('completed');
    });

    it('Scenario 7.4: Misfire policy "skip" skips execution if overdue > 5 minutes', async () => {
      const heavilyOverdue = new Date(Date.now() - (15 * 60 * 1000)); // 15 minutes overdue
      const mockJob = new Job({
        _id: new mongoose.Types.ObjectId(),
        name: 'test_scenarios_misfire_skip',
        targetUrl: 'https://httpbin.org/get',
        scheduleType: 'custom',
        cronExpression: '*/10 * * * *',
        nextRunAt: heavilyOverdue,
        misfirePolicy: 'skip',
        enabled: true,
      });

      vi.spyOn(Job, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockJob]),
        }),
      });
      vi.spyOn(mockJob, 'save').mockResolvedValue(mockJob);
      vi.spyOn(Execution, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockResolvedValue([]),
      });

      const mockHttp = vi.spyOn(httpExecutor, 'executeHttpRequest');

      const summary = await processSchedulerTick('test_runner');

      expect(summary.recovered).toBe(1);
      expect(mockHttp).not.toHaveBeenCalled(); // Overdue execution skipped!
      expect(mockJob.nextRunAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('Scenario 7.5: Failed execution transitions to retrying with calculated delay', async () => {
      const mockJob = new Job({
        _id: new mongoose.Types.ObjectId(),
        name: 'test_scenarios_retry_lifecycle',
        targetUrl: 'https://httpbin.org/status/503',
        retryPolicy: { maxAttempts: 3, delaySeconds: 5, strategy: 'fixed' },
        enabled: true,
      });

      const mockExec = new Execution({
        _id: new mongoose.Types.ObjectId(),
        jobId: mockJob._id,
        jobName: mockJob.name,
        occurrenceId: `retry_test_${Date.now()}`,
        scheduledFor: new Date(),
        status: 'pending',
        attemptCount: 0,
        maxAttempts: 3,
        logs: [],
      });

      vi.spyOn(mockExec, 'save').mockResolvedValue(mockExec);
      vi.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue(mockJob);
      vi.spyOn(httpExecutor, 'executeHttpRequest').mockResolvedValue({
        success: false,
        statusCode: 503,
        durationMs: 120,
        headers: {},
        body: 'Service Unavailable',
        truncated: false,
        error: 'Request failed with status code 503',
        isRetryable: true,
        retryAfterSec: null,
      });

      await performExecution(mockJob, mockExec);

      expect(mockExec.status).toBe('retrying');
      expect(mockExec.attemptCount).toBe(1);
      expect(mockExec.nextRetryAt).toBeInstanceOf(Date);
      expect(mockExec.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('Scenario 7.6: Stuck execution monitor reclaims expired worker lease', async () => {
      const mockStuck = new Execution({
        _id: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(),
        jobName: 'stuck_job',
        occurrenceId: `stuck_${Date.now()}`,
        status: 'running',
        workerId: 'dead_worker_process',
        lockedUntil: new Date(Date.now() - 30000), // Lease expired
        logs: [],
      });

      vi.spyOn(mockStuck, 'save').mockResolvedValue(mockStuck);
      vi.spyOn(Execution, 'find').mockImplementation((filter) => {
        if (filter.status === 'running') {
          return { limit: vi.fn().mockResolvedValue([mockStuck]) };
        }
        return { limit: vi.fn().mockResolvedValue([]) };
      });
      vi.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue({});

      await recoverStuckExecutions();

      expect(mockStuck.status).toBe('failed');
      expect(mockStuck.errorDetails.code).toBe('WORKER_TIMEOUT_OR_CRASH');
      expect(mockStuck.lockedUntil).toBeNull();
    });

    it('Scenario 7.7: Manual trigger (triggerJobNow) executes immediately without altering nextRunAt', async () => {
      const futureScheduled = new Date(Date.now() + 86400000); // Tomorrow
      const mockJob = new Job({
        _id: new mongoose.Types.ObjectId(),
        name: 'test_scenarios_manual_trigger',
        targetUrl: 'https://httpbin.org/get',
        scheduleType: 'daily',
        cronExpression: '0 9 * * *',
        nextRunAt: futureScheduled,
        enabled: true,
      });

      const mockExec = new Execution({
        _id: new mongoose.Types.ObjectId(),
        jobId: mockJob._id,
        occurrenceId: `manual_${Date.now()}`,
        status: 'pending',
        attemptCount: 0,
        maxAttempts: 10,
        logs: [],
      });

      vi.spyOn(mockExec, 'save').mockResolvedValue(mockExec);
      vi.spyOn(Execution, 'create').mockImplementation((data) => {
        const doc = new Execution(data);
        vi.spyOn(doc, 'save').mockResolvedValue(doc);
        return Promise.resolve(doc);
      });
      vi.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue(mockJob);
      vi.spyOn(httpExecutor, 'executeHttpRequest').mockResolvedValue({
        success: true,
        statusCode: 200,
        durationMs: 30,
        headers: {},
        body: '{"ok": true}',
        truncated: false,
        error: null,
        isRetryable: false,
        retryAfterSec: null,
      });

      const executedResult = await triggerJobNow(mockJob, 'manual');

      expect(executedResult.status).toBe('completed');
      expect(executedResult.triggerSource).toBe('manual');
      // Regular future scheduled nextRunAt is untouched
      expect(mockJob.nextRunAt.toISOString()).toBe(futureScheduled.toISOString());
    });
  });

  // =========================================================================
  // SCENARIO 8: Job REST API Endpoints & Schedule Validation
  // =========================================================================
  describe('Scenario 8: Job REST API Endpoints & Validation', () => {
    it('Scenario 8.1: POST /api/jobs/validate-cron validates correct and invalid cron syntax', async () => {
      const validRes = await request(app)
        .post('/api/jobs/validate-cron')
        .send({ cron: '*/15 * * * *', timezone: 'Asia/Kolkata' });

      expect(validRes.status).toBe(200);
      expect(validRes.body.valid).toBe(true);
      expect(validRes.body.nextRunAt).toBeDefined();

      const invalidRes = await request(app)
        .post('/api/jobs/validate-cron')
        .send({ cron: 'invalid-cron-format', timezone: 'UTC' });

      expect(invalidRes.status).toBe(200);
      expect(invalidRes.body.valid).toBe(false);
      expect(invalidRes.body.error).toBeDefined();
    });

    it('Scenario 8.2: POST /api/jobs/preview-schedule returns upcoming occurrences', async () => {
      const res = await request(app)
        .post('/api/jobs/preview-schedule')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          scheduleType: 'daily',
          scheduleTime: '12:00',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.previews).toHaveLength(5);
      expect(res.body.previews[0]).toHaveProperty('formatted');
    });

    it('Scenario 8.3: POST /api/jobs rejects SSRF attempts to private IP / AWS metadata', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'malicious_ssrf_job',
          targetUrl: 'http://169.254.169.254/latest/meta-data/',
          scheduleType: 'daily',
          scheduleTime: '10:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/SSRF Violation/i);
    });

    it('Scenario 8.4: POST /api/jobs rejects invalid timezones', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'bad_tz_job',
          targetUrl: 'https://example.com/api',
          scheduleType: 'daily',
          timezone: 'BadZone/Atlantis',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid IANA timezone/i);
    });
  });
});

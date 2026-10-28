import crypto from 'crypto';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import SystemLock from '../models/SystemLock.js';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { calculateNextRunAt } from '../utils/cronHelper.js';
import { executeHttpRequest } from './httpExecutor.js';
import { calculateRetryDelay, shouldRetry } from './retryService.js';
import { dispatchExecutionNotification } from './telegramService.js';

const WORKER_ID = `worker_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
let inProcessTickTimer = null;

/**
 * Acquires a distributed lock for tick leader election across multiple instances
 * @param {string} lockName
 * @param {number} ttlMs
 * @returns {Promise<boolean>}
 */
export async function acquireDistributedLock(lockName = 'scheduler_tick', ttlMs = 25000) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    const lock = await SystemLock.findOneAndUpdate(
      {
        lockName,
        $or: [
          { expiresAt: { $lt: now } },
          { lockedBy: WORKER_ID }
        ]
      },
      {
        $set: {
          lockedBy: WORKER_ID,
          lockedAt: now,
          expiresAt,
        }
      },
      { upsert: true, new: true, rawResult: true }
    );
    return !!lock;
  } catch (err) {
    if (err.code === 11000) {
      // Another worker holds the active lock
      return false;
    }
    logger.warn('Error acquiring distributed lock', { error: err.message });
    return false;
  }
}

/**
 * Releases the distributed lock
 * @param {string} lockName
 */
export async function releaseDistributedLock(lockName = 'scheduler_tick') {
  try {
    await SystemLock.deleteOne({ lockName, lockedBy: WORKER_ID });
  } catch (err) {
    // Ignore release errors
  }
}

/**
 * Recovers stuck executions where worker died or lease expired
 */
export async function recoverStuckExecutions() {
  const now = new Date();
  const stuckThreshold = new Date(now.getTime() - env.STUCK_JOB_TIMEOUT_MS);

  try {
    const stuckList = await Execution.find({
      status: 'running',
      lockedUntil: { $lt: now, $ne: null }
    }).limit(10);

    for (const exec of stuckList) {
      logger.warn(`Recovering stuck execution ${exec.occurrenceId} from abandoned worker ${exec.workerId}`);
      exec.status = 'failed';
      exec.errorDetails = {
        message: 'Worker lease expired before completion. Process restart or timeout detected.',
        code: 'WORKER_TIMEOUT_OR_CRASH',
      };
      exec.completedAt = now;
      exec.logs.push({
        timestamp: now,
        level: 'WARN',
        message: 'Lease expired. Recovered automatically by Stuck Execution Monitor.',
      });
      await exec.save();

      // Update parent job status
      await Job.findByIdAndUpdate(exec.jobId, { lastStatus: 'failure' });
    }
  } catch (err) {
    logger.error('Error recovering stuck executions', { error: err.message });
  }
}

/**
 * Executes a single claimed job or retry attempt
 * @param {object} job
 * @param {object} execution
 */
export async function performExecution(job, execution) {
  const now = new Date();
  const leaseMs = (job.timeoutMs || env.DEFAULT_EXECUTION_TIMEOUT_MS) + 15000;

  execution.status = 'running';
  execution.startedAt = now;
  execution.workerId = WORKER_ID;
  execution.lockedUntil = new Date(now.getTime() + leaseMs);
  execution.attemptCount += 1;
  execution.logs.push({
    timestamp: now,
    level: 'INFO',
    message: `Attempt ${execution.attemptCount}/${execution.maxAttempts} started by worker ${WORKER_ID}`,
  });
  await execution.save();

  // Convert headers map to plain object
  const headerObj = job.headers instanceof Map
    ? Object.fromEntries(job.headers)
    : (job.headers || {});

  const result = await executeHttpRequest({
    url: job.targetUrl,
    method: job.httpMethod,
    headers: headerObj,
    body: job.body,
    timeoutMs: job.timeoutMs || env.DEFAULT_EXECUTION_TIMEOUT_MS,
    expectedStatusCodes: job.expectedStatusCodes,
    responseValidation: job.responseValidation,
    retryPolicy: job.retryPolicy,
  });

  const finishTime = new Date();
  execution.completedAt = finishTime;
  execution.durationMs = result.durationMs;
  execution.responseStatus = result.statusCode;
  execution.responseHeaders = result.headers;
  execution.responseBody = result.body;
  execution.responseTruncated = result.truncated;
  execution.lockedUntil = null; // release lease

  if (result.success) {
    execution.status = 'completed';
    execution.nextRetryAt = null;
    execution.logs.push({
      timestamp: finishTime,
      level: 'INFO',
      message: `Execution completed successfully with HTTP ${result.statusCode} in ${result.durationMs}ms`,
    });
    await execution.save();

    await Job.findByIdAndUpdate(job._id, {
      lastRunAt: finishTime,
      lastStatus: 'success',
      lastHttpStatus: result.statusCode,
      lastDurationMs: result.durationMs,
      status: job.enabled ? 'active' : 'paused',
      $inc: { successCount: 1 },
    });

    await dispatchExecutionNotification(job, execution, 'success');
  } else {
    // Failure occurred
    execution.errorDetails = {
      message: result.error || 'Request failed without specific error message',
      code: String(result.statusCode || 'NETWORK_FAILURE'),
    };

    const eligibleForRetry = shouldRetry(
      execution.attemptCount,
      execution.maxAttempts,
      result.isRetryable
    );

    if (eligibleForRetry) {
      const delayMs = calculateRetryDelay(execution.attemptCount, job.retryPolicy, result.retryAfterSec);
      const nextRetry = new Date(finishTime.getTime() + delayMs);

      execution.status = 'retrying';
      execution.nextRetryAt = nextRetry;
      execution.logs.push({
        timestamp: finishTime,
        level: 'WARN',
        message: `Attempt ${execution.attemptCount} failed: ${result.error}. Next retry scheduled for ${nextRetry.toISOString()} (+${Math.round(delayMs / 1000)}s)`,
      });
      await execution.save();

      await Job.findByIdAndUpdate(job._id, {
        lastRunAt: finishTime,
        lastStatus: 'retrying',
        lastHttpStatus: result.statusCode || null,
        lastDurationMs: result.durationMs,
        status: job.enabled ? 'retrying' : 'paused',
      });

      await dispatchExecutionNotification(job, execution, 'retry');
    } else {
      // Final Failure
      execution.status = 'failed';
      execution.nextRetryAt = null;
      execution.logs.push({
        timestamp: finishTime,
        level: 'ERROR',
        message: `Execution definitively failed after attempt ${execution.attemptCount}: ${result.error}`,
      });
      await execution.save();

      await Job.findByIdAndUpdate(job._id, {
        lastRunAt: finishTime,
        lastStatus: 'failure',
        lastHttpStatus: result.statusCode || null,
        lastDurationMs: result.durationMs,
        status: job.enabled ? 'failed' : 'paused',
        $inc: { failureCount: 1 },
      });

      const isExhausted = execution.attemptCount >= execution.maxAttempts;
      await dispatchExecutionNotification(job, execution, isExhausted ? 'exhausted' : 'failure');
    }
  }

  return execution;
}

/**
 * Processes queued retry attempts that are due
 */
export async function processDueRetries() {
  const now = new Date();
  let retryCount = 0;

  try {
    const dueCandidates = await Execution.find({
      status: 'retrying',
      nextRetryAt: { $lte: now },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $lt: now } }
      ]
    }).select('_id jobId').limit(10);

    const retryPromises = dueCandidates.map(async (candidate) => {
      // Atomically claim the retry execution so no other concurrent tick/process can execute it
      const claimedExec = await Execution.findOneAndUpdate(
        {
          _id: candidate._id,
          status: 'retrying',
          $or: [
            { lockedUntil: null },
            { lockedUntil: { $lt: now } },
          ],
        },
        {
          $set: {
            status: 'running',
            workerId: WORKER_ID,
            lockedUntil: new Date(now.getTime() + 75000), // initial claim lease
          },
        },
        { new: true }
      );

      if (!claimedExec) {
        // Concurrently claimed by another worker/tick, skip to prevent duplicate run
        return;
      }

      const job = await Job.findById(claimedExec.jobId);
      if (!job) {
        claimedExec.status = 'failed';
        claimedExec.errorDetails = { message: 'Parent job was deleted during retry phase' };
        await claimedExec.save();
        return;
      }

      await performExecution(job, claimedExec);
      retryCount++;
    });

    await Promise.allSettled(retryPromises);
  } catch (err) {
    logger.error('Error processing due retries', { error: err.message });
  }

  return retryCount;
}

/**
 * Claims and executes due scheduled jobs atomically
 * @param {'scheduler'|'tick'|'manual'} source
 * @returns {Promise<{ claimed: number, retries: number, recovered: number, errors: string[] }>}
 */
export async function processSchedulerTick(source = 'scheduler') {
  const now = new Date();
  const summary = {
    claimed: 0,
    retries: 0,
    recovered: 0,
    errors: [],
  };

  // Recover abandoned locks or workers
  await recoverStuckExecutions();

  // Process due retries first
  summary.retries = await processDueRetries();

  // Find due jobs
  const dueJobs = await Job.find({
    enabled: true,
    nextRunAt: { $lte: now, $ne: null }
  }).sort({ nextRunAt: 1 }).limit(25);

  const claimedJobsToExecute = [];

  for (const job of dueJobs) {
    try {
      const scheduledMoment = job.nextRunAt || now;
      const occurrenceId = `${job._id}_${scheduledMoment.toISOString()}`;

      // Check misfire policy if significantly overdue (> 5 minutes)
      const diffMs = now.getTime() - scheduledMoment.getTime();
      const isMisfired = diffMs > (5 * 60 * 1000);

      if (isMisfired && job.misfirePolicy === 'skip') {
        logger.info(`Job ${job.name} missed by ${Math.round(diffMs / 1000)}s. Skipping per misfire policy.`);
        const futureNextRun = calculateNextRunAt(job, now);
        job.nextRunAt = futureNextRun;
        if (job.scheduleType === 'once') {
          job.enabled = false;
        }
        await job.save();
        summary.recovered++;
        continue;
      }

      // Atomic claim via Execution creation with unique index on occurrenceId
      let execution;
      try {
        execution = await Execution.create({
          jobId: job._id,
          jobName: job.name,
          occurrenceId,
          scheduledFor: scheduledMoment,
          status: 'pending',
          triggerSource: source,
          maxAttempts: job.retryPolicy?.maxAttempts || 10,
          requestDetails: {
            url: job.targetUrl,
            method: job.httpMethod,
            headers: job.headers,
            body: job.body,
          },
          workerId: WORKER_ID,
          lockedUntil: new Date(now.getTime() + 60000),
        });
      } catch (mongoErr) {
        if (mongoErr.code === 11000) {
          // Occurrence was already claimed by another tick or worker
          continue;
        }
        throw mongoErr;
      }

      // Advance nextRunAt on the Job immediately so next tick won't query it
      const nextRun = calculateNextRunAt(job, now);
      job.nextRunAt = nextRun;
      if (job.scheduleType === 'once') {
        job.enabled = false;
      }
      await job.save();

      summary.claimed++;
      claimedJobsToExecute.push({ job, execution });
    } catch (err) {
      logger.error(`Error claiming scheduled job ${job.name}: ${err.message}`, {
        jobId: job._id,
      });
      summary.errors.push(`${job.name}: ${err.message}`);
    }
  }

  // Execute all claimed jobs concurrently without blocking tick or expiring leader lease
  if (claimedJobsToExecute.length > 0) {
    await Promise.allSettled(
      claimedJobsToExecute.map(({ job, execution }) =>
        performExecution(job, execution).catch((execErr) => {
          logger.error(`Error during execution of ${job.name}: ${execErr.message}`);
          summary.errors.push(`${job.name}: ${execErr.message}`);
        })
      )
    );
  }

  return summary;
}

/**
 * Triggers an immediate manual run of a specific job
 * @param {object} job
 * @param {'manual'|'telegram'} source
 * @returns {Promise<object>}
 */
export async function triggerJobNow(job, source = 'manual') {
  const now = new Date();
  const occurrenceId = `manual_${job._id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const execution = await Execution.create({
    jobId: job._id,
    jobName: job.name,
    occurrenceId,
    scheduledFor: now,
    status: 'pending',
    triggerSource: source,
    maxAttempts: job.retryPolicy?.maxAttempts || 10,
    requestDetails: {
      url: job.targetUrl,
      method: job.httpMethod,
      headers: job.headers,
      body: job.body,
    },
    workerId: WORKER_ID,
    lockedUntil: new Date(now.getTime() + 60000),
  });

  return performExecution(job, execution);
}

/**
 * Starts the in-process background scheduler interval
 */
export function startInProcessScheduler() {
  if (!env.SCHEDULER_ENABLED) {
    logger.info('Scheduler is disabled by environment configuration.');
    return;
  }

  if (inProcessTickTimer) {
    clearInterval(inProcessTickTimer);
  }

  logger.info(`Starting in-process scheduler engine (Interval: ${env.SCHEDULER_TICK_INTERVAL_MS}ms, Worker: ${WORKER_ID})`);

  inProcessTickTimer = setInterval(async () => {
    try {
      const hasLock = await acquireDistributedLock('in_process_tick', env.SCHEDULER_TICK_INTERVAL_MS);
      if (hasLock) {
        await processSchedulerTick('scheduler');
      }
    } catch (err) {
      logger.error('In-process tick loop exception', { error: err.message });
    }
  }, env.SCHEDULER_TICK_INTERVAL_MS);
}

/**
 * Stops in-process scheduler
 */
export function stopInProcessScheduler() {
  if (inProcessTickTimer) {
    clearInterval(inProcessTickTimer);
    inProcessTickTimer = null;
    logger.info('In-process scheduler stopped');
  }
}

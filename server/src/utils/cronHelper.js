import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';
import env from '../config/env.js';

/**
 * Validates timezone string using Luxon
 * @param {string} tz
 * @returns {boolean}
 */
export function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  const dt = DateTime.now().setZone(tz);
  return dt.isValid;
}

/**
 * Converts schedule parameters to a standard 5-part cron expression
 * @param {object} schedule
 * @returns {string} cron expression or null if one-time
 */
export function buildCronExpression(schedule) {
  const { type, time = '00:00', daysOfWeek = [], daysOfMonth = [], customCron } = schedule;
  const [hour = '0', minute = '0'] = (time || '00:00').split(':');

  switch (type) {
    case 'once':
      return null;
    case 'daily':
      return `${parseInt(minute, 10)} ${parseInt(hour, 10)} * * *`;
    case 'weekly': {
      // daysOfWeek array: [0..6] (0 = Sunday, 1 = Monday, etc.)
      const days = Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek.join(',') : '*';
      return `${parseInt(minute, 10)} ${parseInt(hour, 10)} * * ${days}`;
    }
    case 'monthly': {
      const dates = Array.isArray(daysOfMonth) && daysOfMonth.length > 0 ? daysOfMonth.join(',') : '1';
      return `${parseInt(minute, 10)} ${parseInt(hour, 10)} ${dates} * *`;
    }
    case 'custom':
      return customCron ? customCron.trim() : '* * * * *';
    default:
      throw new Error(`Unsupported schedule type: "${type}"`);
  }
}

/**
 * Validates cron expression syntax
 * @param {string} cronExpr
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCronExpression(cronExpr) {
  if (!cronExpr || typeof cronExpr !== 'string') {
    return { valid: false, error: 'Cron expression must be a non-empty string' };
  }
  try {
    CronExpressionParser.parse(cronExpr.trim());
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Calculates the next run Date for a job
 * @param {object} job
 * @param {Date} [fromDate]
 * @returns {Date|null}
 */
export function calculateNextRunAt(job, fromDate = new Date()) {
  const tz = isValidTimezone(job.timezone) ? job.timezone : env.DEFAULT_TIMEZONE;
  const nowLuxon = DateTime.fromJSDate(fromDate).setZone(tz);

  // Check end date bounds
  if (job.endDate) {
    const endLuxon = DateTime.fromJSDate(new Date(job.endDate)).setZone(tz);
    if (nowLuxon >= endLuxon) {
      return null;
    }
  }

  // Handle one-time jobs
  if (job.scheduleType === 'once') {
    if (!job.oneTimeRunAt) return null;
    const runDate = new Date(job.oneTimeRunAt);
    if (runDate > fromDate) {
      return runDate;
    }
    return null; // Expired or already past
  }

  // Handle recurring cron
  const cronExpr = job.cronExpression || buildCronExpression({
    type: job.scheduleType,
    time: job.scheduleTime,
    daysOfWeek: job.daysOfWeek,
    daysOfMonth: job.daysOfMonth,
    customCron: job.customCron,
  });

  if (!cronExpr) return null;

  try {
    const options = {
      currentDate: fromDate,
      tz: tz,
    };
    if (job.startDate && new Date(job.startDate) > fromDate) {
      options.currentDate = new Date(job.startDate);
    }
    if (job.endDate) {
      options.endDate = new Date(job.endDate);
    }

    const interval = CronExpressionParser.parse(cronExpr, options);
    const nextDate = interval.next().toDate();

    if (job.endDate && nextDate > new Date(job.endDate)) {
      return null;
    }

    return nextDate;
  } catch (err) {
    return null;
  }
}

/**
 * Generates an array of upcoming run dates for schedule preview
 * @param {object} jobParams
 * @param {number} count
 * @returns {Array<{ date: string, relative: string }>}
 */
export function getUpcomingRunsPreview(jobParams, count = 5) {
  const tz = isValidTimezone(jobParams.timezone) ? jobParams.timezone : env.DEFAULT_TIMEZONE;
  const results = [];

  if (jobParams.scheduleType === 'once') {
    if (jobParams.oneTimeRunAt) {
      const dt = DateTime.fromJSDate(new Date(jobParams.oneTimeRunAt)).setZone(tz);
      results.push({
        date: dt.toISO(),
        formatted: dt.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
        relative: dt.toRelative(),
      });
    }
    return results;
  }

  let cronExpr = jobParams.cronExpression;
  if (!cronExpr) {
    try {
      cronExpr = buildCronExpression({
        type: jobParams.scheduleType,
        time: jobParams.scheduleTime,
        daysOfWeek: jobParams.daysOfWeek,
        daysOfMonth: jobParams.daysOfMonth,
        customCron: jobParams.customCron,
      });
    } catch {
      return [];
    }
  }

  if (!cronExpr) return [];

  try {
    const interval = CronExpressionParser.parse(cronExpr, {
      currentDate: new Date(),
      tz: tz,
    });

    for (let i = 0; i < count; i++) {
      if (interval.hasNext()) {
        const nextDate = interval.next().toDate();
        if (jobParams.endDate && nextDate > new Date(jobParams.endDate)) break;
        const dt = DateTime.fromJSDate(nextDate).setZone(tz);
        results.push({
          date: dt.toISO(),
          formatted: dt.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
          relative: dt.toRelative(),
        });
      }
    }
  } catch (err) {
    // Return empty on parse failure
  }

  return results;
}

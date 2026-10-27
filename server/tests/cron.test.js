import { describe, it, expect } from 'vitest';
import {
  buildCronExpression,
  validateCronExpression,
  calculateNextRunAt,
  getUpcomingRunsPreview,
  isValidTimezone,
} from '../src/utils/cronHelper.js';

describe('Cron & Scheduling Helper', () => {
  it('builds valid cron expression for daily schedules', () => {
    const expr = buildCronExpression({
      type: 'daily',
      time: '14:30',
    });
    expect(expr).toBe('30 14 * * *');
  });

  it('builds valid cron expression for weekly schedules', () => {
    const expr = buildCronExpression({
      type: 'weekly',
      time: '09:00',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    });
    expect(expr).toBe('0 9 * * 1,3,5');
  });

  it('builds valid cron expression for monthly schedules', () => {
    const expr = buildCronExpression({
      type: 'monthly',
      time: '00:00',
      daysOfMonth: [1, 15],
    });
    expect(expr).toBe('0 0 1,15 * *');
  });

  it('validates correct cron expressions', () => {
    expect(validateCronExpression('*/5 * * * *').valid).toBe(true);
    expect(validateCronExpression('0 12 * * 1-5').valid).toBe(true);
  });

  it('rejects invalid or impossible cron expressions', () => {
    expect(validateCronExpression('invalid cron text').valid).toBe(false);
    expect(validateCronExpression('99 99 99 99 99').valid).toBe(false);
  });

  it('validates IANA timezones', () => {
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Fake/NonExistent_Zone')).toBe(false);
  });

  it('calculates next run date in the future for daily schedule', () => {
    const job = {
      scheduleType: 'daily',
      scheduleTime: '12:00',
      timezone: 'Asia/Kolkata',
    };
    const nextRun = calculateNextRunAt(job, new Date('2026-01-01T08:00:00Z'));
    expect(nextRun).toBeInstanceOf(Date);
    expect(nextRun.getTime()).toBeGreaterThan(new Date('2026-01-01T08:00:00Z').getTime());
  });

  it('generates upcoming runs preview array', () => {
    const previews = getUpcomingRunsPreview({
      scheduleType: 'daily',
      scheduleTime: '10:00',
      timezone: 'Asia/Kolkata',
    }, 3);

    expect(previews).toHaveLength(3);
    expect(previews[0]).toHaveProperty('formatted');
    expect(previews[0]).toHaveProperty('relative');
  });
});

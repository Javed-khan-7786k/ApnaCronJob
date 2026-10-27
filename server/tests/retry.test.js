import { describe, it, expect } from 'vitest';
import { calculateRetryDelay, shouldRetry } from '../src/services/retryService.js';
import { isRetryableError, parseRetryAfterHeader } from '../src/services/httpExecutor.js';

describe('Retry & Backoff Engine', () => {
  it('enforces fixed 5-second delay by default', () => {
    const delay = calculateRetryDelay(1, { strategy: 'fixed', delaySeconds: 5 });
    expect(delay).toBe(5000);
  });

  it('respects Retry-After header if returned by target API', () => {
    const delay = calculateRetryDelay(1, { strategy: 'fixed', delaySeconds: 5 }, 12);
    expect(delay).toBe(12000);
  });

  it('computes exponential backoff delay with bounds', () => {
    const delayAttempt1 = calculateRetryDelay(1, { strategy: 'exponential', delaySeconds: 2 });
    const delayAttempt3 = calculateRetryDelay(3, { strategy: 'exponential', delaySeconds: 2 });

    // Attempt 1 ~ 2s (+- 20% jitter)
    expect(delayAttempt1).toBeGreaterThanOrEqual(1600);
    expect(delayAttempt1).toBeLessThanOrEqual(2400);

    // Attempt 3: 2 * 2^(3-1) = 8s (+- 20% jitter)
    expect(delayAttempt3).toBeGreaterThanOrEqual(6400);
    expect(delayAttempt3).toBeLessThanOrEqual(9600);
  });

  it('determines retry eligibility up to 10 attempts', () => {
    expect(shouldRetry(1, 10, true)).toBe(true);
    expect(shouldRetry(9, 10, true)).toBe(true);
    expect(shouldRetry(10, 10, true)).toBe(false); // Exhausted!
    expect(shouldRetry(1, 10, false)).toBe(false); // Non-retryable error
  });

  it('classifies transient vs permanent HTTP status codes correctly', () => {
    const policy = { retryOnHttp5xx: true, retryOn429: true, retryOnNetworkError: true };

    // Transient errors (retryable)
    expect(isRetryableError(500, '', policy)).toBe(true);
    expect(isRetryableError(502, '', policy)).toBe(true);
    expect(isRetryableError(503, '', policy)).toBe(true);
    expect(isRetryableError(504, '', policy)).toBe(true);
    expect(isRetryableError(429, '', policy)).toBe(true);
    expect(isRetryableError(408, '', policy)).toBe(true);
    expect(isRetryableError(null, 'ECONNRESET', policy)).toBe(true);

    // Permanent client errors (not retryable)
    expect(isRetryableError(400, '', policy)).toBe(false);
    expect(isRetryableError(401, '', policy)).toBe(false);
    expect(isRetryableError(403, '', policy)).toBe(false);
    expect(isRetryableError(404, '', policy)).toBe(false);
    expect(isRetryableError(422, '', policy)).toBe(false);
  });

  it('parses Retry-After headers in seconds or date string', () => {
    expect(parseRetryAfterHeader({ 'retry-after': '30' })).toBe(30);
    expect(parseRetryAfterHeader({ 'Retry-After': '120' })).toBe(120);
    expect(parseRetryAfterHeader({})).toBe(null);
  });
});

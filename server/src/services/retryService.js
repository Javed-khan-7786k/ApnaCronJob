/**
 * Calculates next retry delay in milliseconds
 * @param {number} attemptNumber current attempt count (1-indexed)
 * @param {object} retryPolicy
 * @param {number|null} retryAfterSec delay suggested by server Retry-After header
 * @returns {number} delay in milliseconds
 */
export function calculateRetryDelay(attemptNumber, retryPolicy = {}, retryAfterSec = null) {
  // If server provided explicit Retry-After, honor it
  if (retryAfterSec && retryAfterSec > 0) {
    return retryAfterSec * 1000;
  }

  const baseDelaySec = retryPolicy.delaySeconds || 5;
  const strategy = retryPolicy.strategy || 'fixed';

  if (strategy === 'exponential') {
    // Bounded exponential backoff with +/- 20% jitter
    // Base * 2^(attempt - 1), capped at 3600 seconds (1 hour)
    const factor = Math.pow(2, Math.min(attemptNumber - 1, 8));
    const delaySec = Math.min(baseDelaySec * factor, 3600);
    const jitter = delaySec * 0.2 * (Math.random() * 2 - 1);
    return Math.max(1000, Math.round((delaySec + jitter) * 1000));
  }

  // Default: Fixed delay (e.g., 5 seconds)
  return Math.max(1000, baseDelaySec * 1000);
}

/**
 * Evaluates whether a new retry should be scheduled
 * @param {number} currentAttempt
 * @param {number} maxAttempts
 * @param {boolean} isRetryable
 * @returns {boolean}
 */
export function shouldRetry(currentAttempt, maxAttempts = 10, isRetryable = false) {
  if (!isRetryable) return false;
  return currentAttempt < maxAttempts;
}

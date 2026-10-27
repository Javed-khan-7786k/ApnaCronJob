import axios from 'axios';
import { validateUrlForSSRF } from '../utils/ssrf.js';
import { sanitizeResponseBody, sanitizeHeaders } from '../utils/sanitize.js';
import logger from '../config/logger.js';

const MAX_REDIRECTS = 5;

/**
 * Checks if an HTTP error is transient and eligible for retry
 * @param {number|null} statusCode
 * @param {string} errorCode
 * @param {object} retryPolicy
 * @returns {boolean}
 */
export function isRetryableError(statusCode, errorCode, retryPolicy = {}) {
  const {
    retryOnHttp5xx = true,
    retryOn429 = true,
    retryOnNetworkError = true,
  } = retryPolicy;

  // Network / timeout errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED, ENOTFOUND)
  if (!statusCode) {
    if (retryOnNetworkError) return true;
    return false;
  }

  // Rate limited
  if (statusCode === 429 && retryOn429) {
    return true;
  }

  // Request timeout
  if (statusCode === 408) {
    return true;
  }

  // Server errors (5xx)
  if (statusCode >= 500 && statusCode <= 599 && retryOnHttp5xx) {
    return true;
  }

  // Permanent client errors (400, 401, 403, 404, 422) are not retried by default
  return false;
}

/**
 * Extracts retry delay from Retry-After header if present
 * @param {object} headers
 * @returns {number|null} delay in seconds, or null
 */
export function parseRetryAfterHeader(headers) {
  if (!headers) return null;
  const headerVal = headers['retry-after'] || headers['Retry-After'];
  if (!headerVal) return null;

  const seconds = parseInt(headerVal, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return Math.min(seconds, 300); // cap at 5 minutes
  }

  // Check HTTP date format
  const dateMs = Date.parse(headerVal);
  if (!isNaN(dateMs)) {
    const diffSec = Math.round((dateMs - Date.now()) / 1000);
    return diffSec > 0 ? Math.min(diffSec, 300) : null;
  }

  return null;
}

/**
 * Executes an automated HTTP request with SSRF protection, timeout, and redirect safety
 * @param {object} options
 * @returns {Promise<{
 *   success: boolean,
 *   statusCode: number|null,
 *   durationMs: number,
 *   headers: object,
 *   body: string,
 *   truncated: boolean,
 *   error: string|null,
 *   isRetryable: boolean,
 *   retryAfterSec: number|null
 * }>}
 */
export async function executeHttpRequest({
  url,
  method = 'GET',
  headers = {},
  body = null,
  timeoutMs = 30000,
  expectedStatusCodes = [200, 201, 202, 204],
  responseValidation = {},
  retryPolicy = {},
}) {
  const startTime = Date.now();
  let currentUrl = url;
  let redirectsFollowed = 0;

  // SSRF pre-check on target URL
  const ssrfCheck = await validateUrlForSSRF(currentUrl);
  if (!ssrfCheck.safe) {
    return {
      success: false,
      statusCode: null,
      durationMs: Date.now() - startTime,
      headers: {},
      body: '',
      truncated: false,
      error: `SSRF Blocked: ${ssrfCheck.error}`,
      isRetryable: false, // Security violation is never retryable
      retryAfterSec: null,
    };
  }

  // Build clean request headers
  const requestHeaders = {
    'User-Agent': 'ApnaScheduler/1.0 (+https://github.com/aapna-scheduler)',
    'Accept': 'application/json, text/plain, */*',
    ...headers,
  };

  // Convert body to JSON string if object
  let dataPayload = body;
  if (body && typeof body === 'object') {
    dataPayload = JSON.stringify(body);
    if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await axios({
      url: currentUrl,
      method: method.toUpperCase(),
      headers: requestHeaders,
      data: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : dataPayload,
      timeout: Math.min(Math.max(timeoutMs, 1000), 120000),
      maxRedirects: 0, // We handle redirects manually to ensure every redirect URL is validated against SSRF!
      validateStatus: () => true, // Don't throw on HTTP status codes
      transformResponse: [(data) => data], // Preserve raw text body for accurate sanitization
    });

    const durationMs = Date.now() - startTime;
    const statusCode = response.status;

    // Check for redirect (301, 302, 307, 308)
    if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {
      if (redirectsFollowed >= MAX_REDIRECTS) {
        return {
          success: false,
          statusCode,
          durationMs,
          headers: sanitizeHeaders(response.headers),
          body: '',
          truncated: false,
          error: `Exceeded maximum redirect limit of ${MAX_REDIRECTS}`,
          isRetryable: false,
          retryAfterSec: null,
        };
      }

      const redirectTarget = new URL(response.headers.location, currentUrl).toString();
      const redirectSSRF = await validateUrlForSSRF(redirectTarget);
      if (!redirectSSRF.safe) {
        return {
          success: false,
          statusCode,
          durationMs,
          headers: sanitizeHeaders(response.headers),
          body: '',
          truncated: false,
          error: `Redirect SSRF Blocked: Redirect to "${redirectTarget}" rejected: ${redirectSSRF.error}`,
          isRetryable: false,
          retryAfterSec: null,
        };
      }

      // Recurse safely with decremented redirect quota
      return executeHttpRequest({
        url: redirectTarget,
        method: statusCode === 303 ? 'GET' : method,
        headers,
        body: statusCode === 303 ? null : body,
        timeoutMs: Math.max(1000, timeoutMs - durationMs),
        expectedStatusCodes,
        responseValidation,
        retryPolicy,
      });
    }

    const { sanitized, truncated } = sanitizeResponseBody(response.data);
    const retryAfter = parseRetryAfterHeader(response.headers);

    // Validate Status Code
    const isStatusExpected = expectedStatusCodes.includes(statusCode);
    let validationError = null;

    if (!isStatusExpected) {
      validationError = `Unexpected HTTP Status: ${statusCode} (Expected: ${expectedStatusCodes.join(', ')})`;
    } else if (responseValidation?.containsText && responseValidation.containsText.trim().length > 0) {
      const matchText = responseValidation.containsText.trim();
      if (!sanitized.includes(matchText)) {
        validationError = `Response validation failed: Body does not contain expected substring "${matchText}"`;
      }
    }

    const success = isStatusExpected && !validationError;
    const isRetryable = !success && isRetryableError(statusCode, '', retryPolicy);

    return {
      success,
      statusCode,
      durationMs,
      headers: sanitizeHeaders(response.headers),
      body: sanitized,
      truncated,
      error: validationError,
      isRetryable,
      retryAfterSec: retryAfter,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorCode = err.code || err.name || 'UNKNOWN_ERROR';
    const isRetryable = isRetryableError(null, errorCode, retryPolicy);

    logger.warn(`HTTP Execution failed for "${currentUrl}": ${err.message}`, {
      code: errorCode,
      durationMs,
    });

    return {
      success: false,
      statusCode: null,
      durationMs,
      headers: {},
      body: '',
      truncated: false,
      error: `Network/Execution Error: ${err.message} (${errorCode})`,
      isRetryable,
      retryAfterSec: null,
    };
  }
}

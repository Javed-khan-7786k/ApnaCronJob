const MAX_BODY_LENGTH = 64 * 1024; // 64 KB

const SENSITIVE_HEADER_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'proxy-authorization',
];

/**
 * Truncates and sanitizes a response body string
 * @param {any} body
 * @param {number} maxLength
 * @returns {{ sanitized: string, truncated: boolean, byteLength: number }}
 */
export function sanitizeResponseBody(body, maxLength = MAX_BODY_LENGTH) {
  if (body === null || body === undefined) {
    return { sanitized: '', truncated: false, byteLength: 0 };
  }

  let str;
  if (typeof body === 'string') {
    str = body;
  } else if (typeof body === 'object') {
    try {
      str = JSON.stringify(body, null, 2);
    } catch {
      str = String(body);
    }
  } else {
    str = String(body);
  }

  const byteLength = Buffer.byteLength(str, 'utf8');
  if (byteLength > maxLength) {
    const truncated = str.slice(0, maxLength) + '\n... [TRUNCATED - EXCEEDS MAXIMUM STORED RESPONSE SIZE (64 KB)]';
    return { sanitized: truncated, truncated: true, byteLength };
  }

  return { sanitized: str, truncated: false, byteLength };
}

/**
 * Sanitizes headers object by masking tokens and sensitive credentials
 * @param {object} headers
 * @returns {object}
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};

  const clean = {};
  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADER_KEYS.includes(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

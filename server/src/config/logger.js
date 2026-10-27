const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'cookie',
  'mongodb_uri',
  'jwt_secret',
  'internal_tick_secret',
  'bot_token'
];

export function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive && typeof value === 'string') {
      redacted[key] = value.length > 8 ? `${value.substring(0, 4)}...[REDACTED]` : '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: msg,
      ...redactSensitiveData(meta)
    }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message: msg,
      ...redactSensitiveData(meta)
    }));
  },
  error: (msg, meta = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message: msg,
      stack: meta?.stack || undefined,
      ...redactSensitiveData(meta)
    }));
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message: msg,
        ...redactSensitiveData(meta)
      }));
    }
  }
};

export default logger;

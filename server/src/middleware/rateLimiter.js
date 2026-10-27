import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'API rate limit exceeded. Please throttle requests.',
  },
});

export const tickLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // Max 20 ticks per 10s
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many tick trigger requests in short interval.',
  },
});

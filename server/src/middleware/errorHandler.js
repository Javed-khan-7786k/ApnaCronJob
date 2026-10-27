import logger from '../config/logger.js';
import env from '../config/env.js';

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled API Exception', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Duplicate value entered for ${field}. Please use another value.`,
    });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid format for resource identifier: ${err.value}`,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error occurred.',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

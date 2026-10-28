import crypto from 'crypto';
import mongoose from 'mongoose';
import { verifyToken } from '../utils/crypto.js';
import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import env from '../config/env.js';

export async function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-api-key']) {
    token = req.headers['x-api-key'];
  } else if (req.cookies && req.cookies.auth_token) {
    // 2. Check HttpOnly cookie
    token = req.cookies.auth_token;
  }

  // Handle Programmatic API Key (e.g. crn_live_...)
  if (token && token.startsWith('crn_live_')) {
    try {
      const prefix = token.substring(0, 13);
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const apiKey = await ApiKey.findOne({ prefix, keyHash: hash });

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or revoked API key.',
        });
      }

      apiKey.lastUsedAt = new Date();
      await apiKey.save();

      const user = await User.findById(apiKey.userId).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'User for API key not found.' });
      }

      req.user = user;
      req.apiKey = apiKey;
      return next();
    } catch (err) {
      return res.status(500).json({ success: false, error: 'API key validation error' });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing token.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'User account not found or deactivated.',
        });
      }
      req.user = user;
    } else if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
      req.user = {
        _id: decoded.userId,
        role: decoded.role || 'viewer',
        username: decoded.username || 'user',
      };
    } else {
      return res.status(503).json({
        success: false,
        error: 'Database connection is temporarily unavailable. Please retry shortly.',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error authenticating user session.',
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Administrator privileges required.',
    });
  }
  next();
}

export function requireEditorOrAdmin(req, res, next) {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Viewer role does not have permission to perform this modification.',
    });
  }
  next();
}

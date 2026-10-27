import { verifyToken } from '../utils/crypto.js';
import User from '../models/User.js';

export async function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.auth_token) {
    // 2. Check HttpOnly cookie
    token = req.cookies.auth_token;
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
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'User account not found or deactivated.',
      });
    }

    req.user = user;
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

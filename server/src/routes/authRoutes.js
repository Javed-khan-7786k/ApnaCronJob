import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { hashPassword, comparePassword, signToken } from '../utils/crypto.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logAuditEvent } from '../services/auditService.js';
import env from '../config/env.js';

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric, dash, and underscore'),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  telegramChatId: z.string().optional().default(''),
});

const loginSchema = z.object({
  login: z.string().min(3), // username or email
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  telegramChatId: z.string().optional(),
  telegramNotificationsEnabled: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

// POST /api/auth/register
router.post('/register', authLimiter, validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password, telegramChatId } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with that email or username already exists.',
      });
    }

    // First user created is automatically admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      telegramChatId: telegramChatId || '',
    });

    const token = signToken({ userId: user._id, role: user.role });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAuditEvent({
      userId: user._id,
      username: user.username,
      action: 'USER_REGISTER',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        telegramChatId: user.telegramChatId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { login, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.',
      });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id, role: user.role });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAuditEvent({
      userId: user._id,
      username: user.username,
      action: 'USER_LOGIN',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        telegramChatId: user.telegramChatId,
        telegramNotificationsEnabled: user.telegramNotificationsEnabled,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    const { telegramChatId, telegramNotificationsEnabled } = req.body;
    const user = await User.findById(req.user._id);

    if (telegramChatId !== undefined) user.telegramChatId = telegramChatId;
    if (telegramNotificationsEnabled !== undefined) user.telegramNotificationsEnabled = telegramNotificationsEnabled;

    await user.save();

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password
router.put('/password', authenticateToken, validateRequest(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: 'Current password does not match.',
      });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import User from '../models/User.js';
import { hashPassword, comparePassword, signToken } from '../utils/crypto.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logAuditEvent } from '../services/auditService.js';
import env from '../config/env.js';

const router = express.Router();

async function generateUniqueUsername(base) {
  let clean = (base || 'user').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
  if (clean.length < 3) clean = 'user_' + clean;
  let candidate = clean;
  for (let i = 0; i < 5; i++) {
    const exists = await User.findOne({ username: candidate });
    if (!exists) return candidate;
    candidate = `${clean.slice(0, 18)}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${clean.slice(0, 16)}_${Date.now().toString().slice(-6)}`;
}

function setAuthCookie(req, res, token, maxAgeDays = 7) {
  const isLocalhost = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' && !isLocalhost,
    sameSite: 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  });
}


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

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.',
      });
    }

    let finalUsername = username.toLowerCase().trim();
    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      finalUsername = await generateUniqueUsername(finalUsername);
    }

    // First user created is automatically admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username: finalUsername,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      telegramChatId: telegramChatId || '',
    });

    const token = signToken({ userId: user._id, role: user.role });
    setAuthCookie(req, res, token, 7);

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

    setAuthCookie(req, res, token, 7);

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

// GET /api/auth/google - Initiates Google OAuth consent screen redirect
router.get('/google', (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ success: false, error: 'Google OAuth is not configured on this server.' });
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /api/auth/google/callback - Google OAuth redirect callback
router.get('/google/callback', async (req, res, next) => {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error || 'Google authentication was cancelled.')}`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Fetch Google User Profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email, name, id: googleId } = profileResponse.data;
    if (!email) {
      return res.redirect(`${clientUrl}/login?error=Google_account_missing_email`);
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const username = await generateUniqueUsername(email.split('@')[0]);
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const hashedPassword = await hashPassword(randomPassword);

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: email.toLowerCase() === 'javedkhan7786king@gmail.com' ? 'admin' : 'user',
        status: 'active',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id, role: user.role });
    setAuthCookie(req, res, token, 30);

    await logAuditEvent({
      userId: user._id,
      username: user.username,
      action: 'USER_LOGIN_GOOGLE_OAUTH',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
    });

    // Redirect to frontend with token
    res.redirect(`${clientUrl}/app?token=${encodeURIComponent(token)}&username=${encodeURIComponent(user.username)}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.response?.data || err.message);
    res.redirect(`${clientUrl}/login?error=oauth_exchange_failed`);
  }
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(401).json({
        success: false,
        error: 'Google ID token or credential is required for secure authentication.',
      });
    }

    let verifiedEmail = null;
    try {
      const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`, {
        timeout: 5000,
      });
      if (!googleRes.data || !googleRes.data.email || (googleRes.data.email_verified !== 'true' && googleRes.data.email_verified !== true)) {
        return res.status(401).json({
          success: false,
          error: 'Google token verification failed: email unverified.',
        });
      }
      verifiedEmail = googleRes.data.email.toLowerCase();
    } catch (tokenErr) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Google credential.',
      });
    }

    let user = await User.findOne({ email: verifiedEmail });
    if (!user) {
      const username = await generateUniqueUsername(verifiedEmail.split('@')[0]);
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const hashedPassword = await hashPassword(randomPassword);

      user = await User.create({
        username,
        email: verifiedEmail,
        password: hashedPassword,
        role: verifiedEmail === 'javedkhan7786king@gmail.com' ? 'admin' : 'user',
        status: 'active',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id, role: user.role });
    setAuthCookie(req, res, token, 30);

    await logAuditEvent({
      userId: user._id,
      username: user.username,
      action: 'USER_LOGIN_GOOGLE',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
    });

    res.json({
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

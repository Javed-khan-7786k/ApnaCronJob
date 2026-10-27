import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import internalRoutes from './routes/internalRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';

const app = express();

// Trust proxy for Render / Vercel reverse proxies
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tick-Secret', 'X-Telegram-Bot-Api-Secret-Token', 'x-api-key'],
}));

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// HTTP Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Health and readiness endpoints (unrestricted for cloud container probes)
app.use('/api', systemRoutes);

// Internal tick routes (rate-limited, secret header checked)
app.use('/internal', internalRoutes);

// Telegram routes (webhook & notifications)
app.use('/api/telegram', telegramRoutes);

// General API Rate Limiting for auth and CRUD
app.use('/api', apiLimiter);

// Application routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/monitoring', monitoringRoutes);

// In production, serve built frontend assets if present
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const dockerPublicPath = path.resolve(__dirname, '../public');

const staticDir = fs.existsSync(clientDistPath) ? clientDistPath : (fs.existsSync(dockerPublicPath) ? dockerPublicPath : null);

if (staticDir) {
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/internal')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;

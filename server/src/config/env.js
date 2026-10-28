import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const INSECURE_SECRET_BLACKLIST = [
  'default_jwt_secret_key_needs_replacement_in_prod_123456',
  'change_this_to_a_long_random_jwt_secret_in_prod_123456',
  'your_jwt_secret_here',
  'supersecretjwtkey_at_least_16_chars_long',
  'apna_tick_secret_backup_cron_2026',
  'your_secure_internal_tick_secret_key_here',
  'internal_tick_secret_for_scheduler_trigger_12345',
  'secret',
  'changeme',
  'password123',
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/apna_scheduler'),
  ADMIN_EMAIL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(16).default('default_jwt_secret_key_needs_replacement_in_prod_123456'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  INTERNAL_TICK_SECRET: z.string().min(8).default('apna_tick_secret_backup_cron_2026'),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_ALLOWED_CHAT_IDS: z.string().optional().default(''),
  TELEGRAM_POLLING_ENABLED: z.string().transform(v => v === 'true').default('false'),
  TELEGRAM_WEBHOOK_URL: z.string().optional().default(''),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(''),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/auth/google/callback'),

  // Engine
  SCHEDULER_ENABLED: z.string().transform(v => v !== 'false').default('true'),
  SCHEDULER_TICK_INTERVAL_MS: z.string().transform(v => parseInt(v, 10)).default('30000'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  DEFAULT_EXECUTION_TIMEOUT_MS: z.string().transform(v => parseInt(v, 10)).default('60000'),
  STUCK_JOB_TIMEOUT_MS: z.string().transform(v => parseInt(v, 10)).default('300000'),

  // Security
  ALLOWED_DOMAINS: z.string().optional().default(''),
  ALLOW_PRIVATE_NETWORK_TARGETS: z.string().transform(v => v === 'true').default('false'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.JWT_SECRET || data.JWT_SECRET.length < 32 || INSECURE_SECRET_BLACKLIST.includes(data.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'In production, JWT_SECRET must be explicitly configured, at least 32 characters long, and cannot be a default or placeholder.',
      });
    }
    if (!data.INTERNAL_TICK_SECRET || data.INTERNAL_TICK_SECRET.length < 16 || INSECURE_SECRET_BLACKLIST.includes(data.INTERNAL_TICK_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['INTERNAL_TICK_SECRET'],
        message: 'In production, INTERNAL_TICK_SECRET must be explicitly configured, at least 16 characters long, and cannot be a default or placeholder.',
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16 ? process.env.JWT_SECRET : undefined,
  INTERNAL_TICK_SECRET: process.env.INTERNAL_TICK_SECRET && process.env.INTERNAL_TICK_SECRET.length >= 8 ? process.env.INTERNAL_TICK_SECRET : undefined,
});
export default env;

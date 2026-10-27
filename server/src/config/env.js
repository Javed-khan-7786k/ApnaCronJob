import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/apna_scheduler'),
  JWT_SECRET: z.string().min(16).default('default_jwt_secret_key_needs_replacement_in_prod_123456'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  INTERNAL_TICK_SECRET: z.string().min(8).default('apna_tick_secret_backup_cron_2026'),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_ALLOWED_CHAT_IDS: z.string().optional().default(''),
  TELEGRAM_POLLING_ENABLED: z.string().transform(v => v === 'true').default('false'),
  TELEGRAM_WEBHOOK_URL: z.string().optional().default(''),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(''),

  // Engine
  SCHEDULER_ENABLED: z.string().transform(v => v !== 'false').default('true'),
  SCHEDULER_TICK_INTERVAL_MS: z.string().transform(v => parseInt(v, 10)).default('30000'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  DEFAULT_EXECUTION_TIMEOUT_MS: z.string().transform(v => parseInt(v, 10)).default('60000'),
  STUCK_JOB_TIMEOUT_MS: z.string().transform(v => parseInt(v, 10)).default('300000'),

  // Security
  ALLOWED_DOMAINS: z.string().optional().default(''),
  ALLOW_PRIVATE_NETWORK_TARGETS: z.string().transform(v => v === 'true').default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
export default env;

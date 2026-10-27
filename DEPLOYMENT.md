# Apna Scheduler OS — Free-Tier Deployment & Operations Guide

This guide details step-by-step instructions for deploying Apna Scheduler OS across **Vercel**, **Render**, **MongoDB Atlas Free**, and **GitHub Actions**, alongside an honest appraisal of free-tier infrastructure limitations.

---

## ⚠️ The Reality of Free-Tier Hosting (Read Before Deploying)

1. **Render Free Web Services Sleep**:
   - Render spins down free Web Services after **15 minutes of inactivity** (no inbound HTTP requests).
   - **Critical Reality**: While asleep, in-process Node.js timers (`setInterval`, `node-cron`) are completely frozen. A sleeping server **cannot execute scheduled jobs on its own**.
   - An inbound request will wake the container, but cold-starts can take 30–60 seconds.

2. **No Guaranteed Real-Time Delivery on Free Tiers**:
   - Neither sleeping cloud containers nor GitHub Actions cron schedules offer millisecond or second-precise execution guarantees.
   - GitHub Actions cron expressions (`schedule: - cron: '*/10 * * * *'`) are queued on shared runner pools and can be delayed by 5 to 20 minutes during peak GitHub traffic.

3. **Background Workers on Render**:
   - True background workers on Render (which never receive web traffic and run continuously) require a paid instance. On the free tier, the unified web service pattern with an external backup trigger is the most practical architecture.

4. **Self-Pinging Pitfall**:
   - Do **NOT** configure your server to self-ping its own health endpoint in an infinite loop. Modern cloud providers detect recursive self-traffic and will enforce monthly free-hour quotas (e.g. 750 free instance hours per month on Render).

---

## 🏛️ Recommended Architecture: Two-Tier Trigger Strategy

To achieve reliable daily automation without paying for dedicated worker compute:

- **Primary Driver (In-Process)**: When the service is active, the internal ticker fires every 30 seconds to execute scheduled jobs and process retries.
- **Secondary Backup (GitHub Actions / UptimeRobot)**: An external scheduled ping to `POST /internal/tick` every 10 minutes wakes the container, claims overdue jobs, and executes pending retries.
- **Duplicate Prevention Guarantee**: Because each scheduled occurrence has a unique index (`jobId_timestamp`) in MongoDB, both triggers can fire simultaneously without ever executing the same job twice!

---

## 1. MongoDB Atlas Free-Tier Setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Deploy a free **M0 Sandbox cluster** (512 MB storage, shared RAM, free forever).
3. Under **Database Access**, create a user (e.g., `scheduler_admin`) with password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere, required for dynamic IPs on Render/Vercel).
5. Click **Connect** &rarr; **Drivers** &rarr; copy the connection URI:
   ```
   mongodb+srv://scheduler_admin:<password>@cluster0.abcde.mongodb.net/apna_scheduler?retryWrites=true&w=majority
   ```

---

## 2. Deploying Backend API to Render

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository.
4. Configure service parameters:
   - **Name**: `apna-scheduler-api`
   - **Language**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `JWT_SECRET`: `<Generate a random 32+ character string>`
   - `INTERNAL_TICK_SECRET`: `<Generate a secure secret token>`
   - `CLIENT_URL`: `https://your-frontend.vercel.app` (or `*`)
   - `DEFAULT_TIMEZONE`: `Asia/Kolkata`
   - `TELEGRAM_BOT_TOKEN`: `<Your bot token from @BotFather>`
   - `TELEGRAM_ALLOWED_CHAT_IDS`: `<Your Telegram Chat ID>`
6. Click **Create Web Service**. Your backend will deploy at `https://apna-scheduler-api.onrender.com`.

---

## 3. Deploying Frontend Dashboard to Vercel

1. In [Vercel Dashboard](https://vercel.com), click **Add New** &rarr; **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://apna-scheduler-api.onrender.com/api` (or configure a `vercel.json` rewrite to proxy `/api` requests to Render).
5. Deploy. Your dashboard will be live at `https://your-project.vercel.app`.

---

## 4. Configuring GitHub Actions Scheduled Wakeup Trigger

To wake your sleeping Render instance and trigger due jobs:

1. In your GitHub repository, navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Add the following repository secrets:
   - `SCHEDULER_API_URL`: `https://apna-scheduler-api.onrender.com`
   - `INTERNAL_TICK_SECRET`: `<The exact secret configured in your Render environment>`
3. The workflow file at `.github/workflows/scheduler-cron.yml` is already committed to the repository and will automatically run every 10 minutes.
4. You can also trigger it manually at any time under the **Actions** tab in GitHub.

---

## 5. Telegram Bot Setup

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the prompts to choose a name and username (e.g. `ApnaSchedulerBot`).
3. Copy the HTTP API token provided by BotFather and set it as `TELEGRAM_BOT_TOKEN`.
4. Message `@userinfobot` or `@raw_data_bot` to get your numeric **Chat ID**.
5. Set `TELEGRAM_ALLOWED_CHAT_IDS=<your-chat-id>`.
6. To set up the Webhook for instant Telegram command response:
   Send an HTTP request or use curl:
   ```bash
   curl -F "url=https://apna-scheduler-api.onrender.com/api/telegram/webhook" \
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

---

## 6. Security Checklist for Production

- [x] Change the default `JWT_SECRET` in `.env` to a cryptographically secure random value (`openssl rand -base64 32`).
- [x] Change the default `INTERNAL_TICK_SECRET`.
- [x] Ensure `ALLOW_PRIVATE_NETWORK_TARGETS` is set to `false` in production.
- [x] Verify that only authorized Telegram Chat IDs are specified in `TELEGRAM_ALLOWED_CHAT_IDS`.
- [x] Confirm that target API credentials use custom request headers rather than embedding secrets in query strings.
- [x] Verify that database indexes are established by checking MongoDB Atlas collection metrics.

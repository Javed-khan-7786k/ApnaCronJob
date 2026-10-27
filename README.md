# Apna Scheduler OS (Personal Scheduler OS)

> **A self-hostable, production-minded personal cron job & HTTP automation platform built on the MERN stack.** Designed specifically for reliable daily automation, Render free-tier keepalives, resilient retries, Telegram bot remote controls, and fault-tolerant scheduling.

---

## ⚡ Core Features

- **Multi-Modal Recurrence Engine**:
  - One-time scheduled executions at a specific datetime.
  - Daily schedules with 24-hour time pickers.
  - Weekly schedules with selectable weekdays.
  - Monthly schedules with selectable calendar days.
  - Custom cron expressions (validated via `cron-parser`).
  - Native timezone support defaulting to **Asia/Kolkata** (Luxon IANA parser).
  - Live next-run previews and calendar timeline forecast.

- **Enterprise HTTP Automation**:
  - GET, POST, PUT, PATCH, DELETE, and HEAD methods.
  - Custom HTTP headers and JSON request payloads.
  - Configurable timeouts (1s to 120s).
  - Expected HTTP status code matching and response body text assertions.
  - Live "Test Request" inspector before saving jobs.
  - Safe response sanitization (64 KB cap and credential redaction).

- **Resilient Retry Engine**:
  - Up to **10 total attempts** with configurable 5-second base delay.
  - Bounded exponential backoff with jitter or fixed delays.
  - Automatic `Retry-After` header extraction and honoring.
  - Retries transient errors (timeouts, network drops, HTTP 408, 429, 502, 503, 504).
  - Permanent client errors (400, 401, 403, 404, 422) fail fast without wasteful retries.
  - State persisted in MongoDB — retries survive complete process crashes and restarts.

- **SSRF & Security Shield**:
  - Blocks loopback (`127.0.0.1`, `localhost`, `::1`).
  - Blocks private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Blocks AWS/Azure/GCP cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
  - Resolves hostnames to IP addresses before initiating requests to prevent DNS rebinding.
  - Validates every individual redirect hop to prevent redirect-based SSRF.

- **Distributed Claiming & Misfire Recovery**:
  - Atomic occurrence claiming using MongoDB unique compound keys (`<jobId>_<timestamp>`).
  - Leases with expiration timestamps (`lockedUntil`) to auto-recover jobs if a worker crashes mid-run.
  - Configurable misfire policies: `run-once` (default), `skip`, or `run-all`.

- **Telegram Bot Remote Controls**:
  - Authorized commands: `/start`, `/help`, `/status`, `/jobs`, `/next`, `/run <ID>`, `/pause <ID>`, `/resume <ID>`, `/history`, `/failed`.
  - Whitelist security via `TELEGRAM_ALLOWED_CHAT_IDS`.
  - Automated alerts on failures and retry exhaustion.

- **Windows-Inspired High Performance Dashboard**:
  - 10 full pages: Dashboard, Jobs, Job Editor, Calendar Timeline, Executions, Dead Letter Queue, Telegram Bot, Settings, Security & Audit Logs.
  - Clean slate aesthetic, zero fluff, instant load times, cURL generators, and copyable workflow snippets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend API** | Node.js (ESM), Express.js, Helmet, CORS, Cookie-Parser, Zod, Morgan |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose 8 |
| **Time & Cron** | Luxon, cron-parser |
| **Outbound HTTP** | Axios, ipaddr.js (DNS and IP inspection) |
| **Testing** | Vitest, Supertest |
| **Deployment** | Render, Vercel, Docker, GitHub Actions |

---

## 🚀 Quick Start (Local Windows Development)

### Prerequisites
- Node.js v20+ (tested on Node v24 LTS)
- MongoDB running locally or a free MongoDB Atlas connection string

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repo-url>
cd "aapna Cron  jjob"

# Install dependencies for both backend and frontend
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI` points to your MongoDB instance, e.g.:
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/apna_scheduler
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_here
INTERNAL_TICK_SECRET=apna_tick_secret_backup_cron_2026
DEFAULT_TIMEZONE=Asia/Kolkata
```

### 3. Run Development Servers
```bash
# Runs Express API on :5000 and Vite React dev server on :5173
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

### 4. Running Automated Tests
```bash
npm run test
```

---

## 🐳 Docker & Self-Hosting

Run the complete platform and MongoDB with a single command:
```bash
docker-compose up -d --build
```
The unified platform will be accessible at **http://localhost:5000**.

---

## 📡 Protected Endpoints & API Reference

| Method | Endpoint | Description | Auth / Security |
|---|---|---|---|
| `GET` | `/api/health` | Liveness health probe | Public |
| `GET` | `/api/ready` | Readiness probe (verifies MongoDB) | Public |
| `POST` | `/internal/tick` | External scheduler tick & keepalive trigger | `X-Tick-Secret` Header |
| `POST` | `/api/auth/register` | First user becomes admin | Public (Rate-limited) |
| `POST` | `/api/auth/login` | Session login with JWT cookie & token | Public (Rate-limited) |
| `GET` | `/api/jobs` | List scheduled jobs (search, tags, status) | Bearer Token / Cookie |
| `POST` | `/api/jobs` | Create job with recurrence & SSRF check | Bearer Token / Cookie |
| `POST` | `/api/jobs/:id/run` | Trigger immediate execution | Bearer Token / Cookie |
| `POST` | `/api/jobs/:id/toggle` | Enable or pause a scheduled job | Bearer Token / Cookie |
| `GET` | `/api/executions` | Paginated execution logs | Bearer Token / Cookie |
| `POST` | `/api/executions/:id/retry`| Manually retry a failed execution | Bearer Token / Cookie |
| `POST` | `/api/telegram/webhook` | Telegram bot webhook receiver | `X-Telegram-Bot-Api-Secret-Token` |

---

## 📄 License
MIT License. Created for the Apna Scheduler OS community.

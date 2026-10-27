# Cronivo — Precision Cron Job Scheduler SaaS Frontend

Cronivo is a production-quality, editorial frontend for a modern Cron Job Scheduler and HTTP Endpoint Monitoring SaaS. Built with an **Editorial + Minimal + Motion** design direction, combining bold typography, minimal paper backgrounds, an electric cobalt accent, and purposeful micro-interactions.

---

## ⚡ Key Highlights

- **Live Atomic Reference Clock**: Running digital clock updated every second with tab-visibility resync guard, 12/24h toggle, IANA timezone selector, and UTC reference offset.
- **Interactive Cron Parser & Builder**: Visual builder, presets, 5-field syntax validation, human-readable English translation, and live upcoming execution previews using `cron-parser`.
- **21-Section Long-Form Landing Page**: Complete editorial narrative covering why crontabs fail, global runner mesh, exponential backoff retries, real-time logs, code examples (cURL, TypeScript, Python, Terraform), pricing with annual toggle, and interactive FAQ accordion.
- **38+ Distinct Functional Routes**:
  - **Public**: `/`, `/features`, `/features/cron-scheduler`, `/features/http-monitoring`, `/features/retries`, `/features/notifications`, `/features/webhooks`, `/integrations`, `/pricing`, `/docs`, `/docs/quickstart`, `/docs/cron-expressions`, `/docs/api`, `/changelog`, `/status`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password`.
  - **Console App**: `/app`, `/app/jobs`, `/app/jobs/new`, `/app/jobs/:jobId`, `/app/calendar`, `/app/history`, `/app/monitoring`, `/app/notifications`, `/app/integrations`, `/app/api-keys`, `/app/team`, `/app/billing`, `/app/settings`, `/app/settings/timezone`, `/app/settings/security`, `/app/audit-logs`.
- **Authenticated Application Shell**: Collapsible sidebar, workspace switcher, breadcrumbs, notification bell popover, global command palette (<kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>), and explicit demo-mode banners.
- **Zero-Backend Demo Mode**: Pre-populated with realistic simulation records (database backups, SSL sweeps, invoice rolls) with clean API abstraction ready to wire to real backend endpoints.

---

## 🛠️ Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router)
- **UI & Runtime**: React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Editorial tokens: `--font-display`, `--color-cobalt`, `hairline`, `eyebrow`)
- **Components**: Radix UI primitives & Lucide Icons
- **Cron Engine**: `cron-parser` 5.10
- **Build & Bundle**: Vite 8.1 & Nitro Cloudflare module
- **Testing**: Vitest 4.1 with DOM environment

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 🧪 Testing & Verification

```bash
# Run unit test suite
npm run test

# Run typecheck and dev build
npm run build:dev
```

All 38 routes and cron parser functions are covered by automated unit tests in `src/test/app-routing.test.tsx`.

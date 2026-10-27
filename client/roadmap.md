# Roadmap — Cronivo (premium cron scheduler SaaS frontend)

Demo-mode frontend. No real backend; all data labeled demo.

- [x] Inspect project, install cron-parser
- [x] Design system (styles.css editorial tokens, fonts in __root, Toaster)
- [x] Lib layer: cron utils, demo data, demo-auth context, head helper, format utils
- [x] Shared components: clock, cron editor, site header/footer, app shell, command palette
- [x] Landing page (21 sections) at /
- [x] Public routes: /features (+5 sub), /integrations, /pricing, /docs (+3 sub), /changelog, /status, /about, /contact, /privacy, /terms
- [x] Auth routes: /login, /register, /forgot-password
- [x] App shell + 16 app routes (jobs CRUD, calendar, history, monitoring, notifications, integrations, api-keys, team, billing, settings x3, audit-logs)
- [x] Head metadata on every content route
- [x] README + AGENTS.md updates
- [x] Verify: build log clean, typecheck, lint, vitest tests passing (8/8)

# ApnaCronJob — Complete Issues Report (Kya issue hai + Kyu aa raha hai)

**Scope:** `ApnaCronJob-main.zip` (239 files) — Express + MongoDB backend (`server/`) aur TanStack Start + React 19 frontend (`client/`).
**Method:** Poora code static review kiya (har server file, client ki lib/auth/data-store, job form, job detail, calendar, settings, notifications, api-keys, docs, Dockerfile, CI). 
**Limit:** Network off hone ki wajah se `npm install` nahi ho saka, isliye **tests / `tsc` / `vite build` / `docker build` run nahi hue**. Jo cheez sirf code padh ke pakdi hai aur run karke confirm nahi ki, usko **[VERIFY]** mark kiya hai (Section 9).

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low

---

## 0. Executive Summary

- **Total distinct issues (is report me):** 81 (+ `fix.md` ka item-by-item audit, Section 8).
- **Sabse badi baat:** `fix.md` me 52 issues likhe hain, lekin us me se **12 item kisi dusre project (video publisher: `publisher.js`, `youtube.js`, `queueService.js`…) ke hain jo is repo me hain hi nahi**, aur kaafi items **already fix ho chuke hain**. Saath hi `fix.md` ne jo cheezein miss ki hain (neeche), woh zyada serious hain.
- **Top 10 jo pehle fix karo:**
  1. 🔴 Self-pinger endpoints bina login ke open hain (SSRF + config change) — S1
  2. 🔴 Telegram bot by-default sab ke liye open (koi bhi `/run`, `/pause` kar sakta hai) — S3
  3. 🟠 Google login me `aud` verify nahi hota (kisi bhi app ka Google token chalta hai) — S4
  4. 🟠 Seed admin ka password `javedkhan1234` public repo me hardcoded + print hota hai — S5
  5. 🟠 Known/default secrets (`JWT_SECRET`, `INTERNAL_TICK_SECRET`) production me chal sakte hain — S2
  6. 🟠 Redirect loop kabhi khatam nahi hota (counter increment hi nahi hota) — H1
  7. 🟠 `PUT /api/jobs/:id` partial update schedule ko daily-midnight me reset kar deta hai — E8
  8. 🟠 Retry processing atomic nahi → duplicate HTTP calls — E1
  9. 🟠 Frontend errors chhupa ke **fake success** dikhata hai (run, save, revoke key) — C1
  10. 🟠 Docker/Vercel deploy guide aur Dockerfile frontend ke build output se match nahi karte — D1, D2

### Root causes (kyu itne issues aa rahe hain)
1. **Demo-first UI baad me backend se jodi gayi** — isliye har jagah `try { backend } catch { local/fake }` pattern hai (fail-silent).
2. **Docs/README pehle likhe gaye, code baad me** — docs jo guarantee dete hain (DNS-rebinding protection, distributed lock, Stuck monitor, "no duplicates") code me poori nahi hain.
3. **Convenience defaults** (default secrets, open Telegram, seeded fake data, prefilled URL) production safety se upar rakhe gaye.
4. **Multi-tenant ka adha implementation** — jobs/executions scoped hain, lekin Telegram, stats, team, notifications, self-pinger scoped/protected nahi.
5. **Validation kam** — Zod import hota hai par job input pe use nahi; `findByIdAndUpdate` bina `runValidators`; mass-assignment (`...req.body`).
6. **Free-tier (Render sleep) architecture ke saath single-process scheduler** — lock/retry/lease logic us scenario ke liye poora nahi sochi gayi.

### Kya theek hai (taaki clear rahe)
Job/execution queries me `createdBy` scoping hai (IDOR fix ho chuka), regex escape hai, Google `POST /auth/google` ab token verify karta hai (sirf `aud` missing), scheduled occurrence pe unique index hai, bcrypt, helmet, rate limiters, tick secret, SSRF ka basic IPv4/hostname block, API key ka secret ek baar dikhaya jata hai.

---

## 1. Security

### S1 🔴 Self-pinger endpoints unauthenticated
- **Where:** `server/src/routes/systemRoutes.js:115-141`, mounted `app.js:69` (rate-limiter se pehle).
- **Kya:** `GET/POST /api/system/self-pinger` aur `POST /api/system/self-pinger/ping-now` me `authenticateToken` hai hi nahi. Koi bhi internet user `targetUrl` set kar sakta hai; server har 30s+ us URL pe GET karega (internal IPs / cloud metadata bhi — yahan `validateUrlForSSRF` use nahi hota). Error text response me wapas aata hai (internal info leak).
- **Kyu:** Routes baad me add hue (line 109 ke baad imports ke beech) aur middleware lagana reh gaya.
- **Fix:** `authenticateToken` + `requireAdmin`, `validateUrlForSSRF(targetUrl)`, ya poora feature hata do (S/D3 dekho).

### S2 🟠 Default / known secrets
- **Where:** `config/env.js:18,20`; `docker-compose.yml:29-30`; `README.md` (.env example).
- **Kya:** `JWT_SECRET` aur `INTERNAL_TICK_SECRET` ke default public repo me hain. docker-compose ka placeholder (`change_this_to_a_long_random_jwt_secret_in_prod_123456`) validation (min 16) pass kar deta hai, to "as-is" run = known secret. Tick secret default se koi bhi `/internal/tick` trigger kar sakta hai. JWT forge karne ke liye valid `userId` chahiye (DB lookup `auth.js:69` hota hai), isliye JWT risk High, tick risk turant exploitable.
- **Aur:** `env.js:46-55` — agar kisi ek env var ki validation fail ho (non-production), to **saare env ignore** karke pure defaults (default Mongo URI + default JWT secret) use ho jate hain, chupchap. Render pe `NODE_ENV` set na ho to yahi hoga.
- **Fix:** Production me defaults hata do (missing = crash), min length 32 + placeholder blacklist, partial-fallback hatao.

### S3 🔴 Telegram bot default me sab ke liye open + webhook forge ho sakta hai
- **Where:** `services/telegramService.js:24-27`, `routes/telegramRoutes.js:13-19`, `DEPLOYMENT.md §5`.
- **Kya:** `TELEGRAM_ALLOWED_CHAT_IDS` khali ho to `isChatAuthorized` **true** return karta hai → koi bhi bot ko message karke `/jobs`, `/run <id>`, `/pause`, `/resume` chala sakta hai (sab users ke jobs, global). Webhook secret optional hai (`if (env.TELEGRAM_WEBHOOK_SECRET)`), aur DEPLOYMENT.md `setWebhook` me `secret_token` batata hi nahi → attacker allowed chat-id ke saath fake update POST kar sakta hai.
- **Kyu:** "Pehle chalne do, baad me lock karo" wali default.
- **Fix:** Empty list = deny all; webhook secret mandatory; docs update.

### S4 🟠 Google ID token ka `aud` verify nahi
- **Where:** `routes/authRoutes.js:281-290`.
- **Kya:** `tokeninfo` se email verify hota hai par `aud === GOOGLE_CLIENT_ID` check nahi. Kisi bhi dusre app ke liye jari hua Google ID token (jisme victim ka email ho) yahan chal jayega → account takeover. 
- **Related:** Callback flow (`:198-264`) me `state` param nahi (login-CSRF), `email_verified` check nahi (`:223-226`), aur JWT URL query me bheja jata hai (`:259`) → history/referrer me leak.
- **Fix:** `aud` check, `state`, token ko URL ki jagah short-lived code / fragment.

### S5 🟠 Hardcoded admin identity + password
- **Where:** `seedAdmin.js:9-11,42`; `authRoutes.js:238,308`; `AGENTS.md`.
- **Kya:** Default admin password `javedkhan1234`, email `javedkhan7786king@gmail.com` repo me hai; script password console me print karta hai; agar user/email already exist kare to uska password + role admin **overwrite** kar deta hai. Google login me bhi ye email hardcoded auto-admin hai.
- **Fix:** Password env/argv se zaroori karo (default hatao), print mat karo, admin email env se lo.

### S6 🟠 Authorization gaps (IDOR / mass-assignment)
- **Team role:** `routes/teamRoutes.js:120-135` — `PUT /:id/role` pe ownership/admin check nahi, role validate nahi (update validators off). Koi bhi logged-in user kisi bhi member ka role badal sakta hai.
- **Mass assignment:** `notificationRoutes.js:99-103` (`req.body` seedha update → `userId` badal sakte ho), `jobRoutes.js:324-341` (`...data` → `createdBy`, `successCount`, etc. overwrite), `integrationRoutes.js:94-98` (`config` unvalidated).
- **Kyu:** `findOneAndUpdate(filter, req.body)` pattern; Zod import hai par use nahi (`jobRoutes.js:3`).

### S7 🟠 SSRF protection me gaps
- **DNS rebinding:** `utils/ssrf.js:110` `resolvedIp` return karta hai, par `httpExecutor.js:134` axios dobara DNS resolve karta hai (check-time vs use-time). README "prevents DNS rebinding" claim galat hai.
- **IPv6 ranges:** `ssrf.js:16-25` list me `uniqueLocal` (fc00::/7), `ipv4Mapped`, `6to4`, `teredo` nahi hain — AAAA record se internal address pass ho sakta hai **[VERIFY]**.
- **Notifications test:** `notificationRoutes.js:150-158` pehle URL check karta hai phir `axios.post` default redirects follow karta hai → redirect se internal host.
- **Fix:** Resolved IP ko pin karo (custom `lookup`/agent), IPv6 ranges add karo, har jagah `maxRedirects: 0` + manual validation.

### S8 🟠 Redirect pe credentials dusre host ko chale jate hain
- **Where:** `services/httpExecutor.js:181-190`.
- **Kya:** Redirect follow karte waqt original `headers` (Authorization / API keys) dobara bheje jate hain, host change hone par bhi.
- **Fix:** Cross-origin redirect pe sensitive headers drop karo.

### S9 🟡 Secrets plaintext me store aur wapas return
- **Where:** `models/Job.js:47` (`authToken`), `jobRoutes.js:80-83`, `schedulerService.js:331,399` (`requestDetails.headers`), `routes/executionRoutes.js:81`, client `data-store.ts:122,305-314`.
- **Kya:** Bearer token / Authorization header DB me plaintext, `GET /api/jobs` aur `GET /api/executions/:id` me wapas, aur client ke `localStorage` me cache. `Integration.config` bhi plaintext (Mixed). Form me jo mask (`••••`) check hai (`job-form.tsx:136`), backend wo mask kabhi bhejta hi nahi.
- **Fix:** At-rest encryption, `toJSON` me redact, executions me `sanitizeHeaders`.

### S10 🟡 Roles/scopes sirf naam ke hain
- `User.role` me `viewer` hai (`models/User.js:28`) par koi route role check nahi karta; `requireAdmin` (`middleware/auth.js:90`) kahin use nahi hota → viewer job create/delete/run kar sakta hai.
- API key `scopes` (`apiKeyRoutes.js:22-34`) store hote hain par kahin enforce nahi; API key se naye keys bhi ban sakte hain; keys expire nahi hoti. `GET /api/api-keys` `keyHash` bhi return karta hai (`:12`). Model me `scopes: [{ type, default }]` (`ApiKey.js:20-23`) galat shape hai (default element pe laga hai).

### S11 🟡 Tenant data leak
- `systemRoutes.js:58-107` `/system/stats` global counts + **kisi bhi user ke** last-success job ka naam.
- `telegramService.js:85` — job ka chat-id na ho to **admin ke chat me har user ke job failure (URL + error)** jata hai. `notificationSettings.telegramChatId` user-controlled hai → bot se kisi bhi chat me message bhej sakte ho; `notificationRoutes.js:143-146` (type `telegram`) se bhi.
- Telegram `/jobs /status /history /failed /run` sab global (T2).

### S12 🟡 Session / auth hardening
- JWT 7 din, revoke nahi hota; logout sirf cookie clear karta hai; password change se purane token valid rehte hain.
- DB down ho to `auth.js:77-79` token pe bharosa karke `role` (default `admin`) accept karta hai aur `status` check skip.
- `register` (`authRoutes.js:79-80`): `countDocuments()===0` race + open signup → fresh public deploy pe pehla visitor admin.
- Login timing se username enumeration; Google user ke liye `Math.random()` se password (`:231,301`) — crypto RNG use karo.

### S13 🟡 CORS misconfig
- `app.js:48` — non-production me **har origin** allowed (`credentials: true` ke saath); production me bhi localhost origins hamesha allowed.
- `DEPLOYMENT.md` `CLIENT_URL` "(or `*`)" bolta hai par code `*` samajhta hi nahi → production me sab browser POST/PUT block, aur error `errorHandler` ke through **500** ban jata hai. Same-origin Docker deploy me bhi real domain `CLIENT_URL` me na ho to POST block (CORS origin list me nahi).

### S14 🔵 Chhoti security baatein
- `internalRoutes.js:17` secret compare constant-time nahi; Bearer se bhi accept; limit 20 ticks/10s bahut loose.
- `errorHandler.js:29-34` production me bhi 500 pe `err.message` bahar jata hai.
- `config/logger.js:26` redact karte waqt secret ke pehle 4 chars log hote hain.
- `docker-compose.yml:9-10` Mongo port 27017 host pe published, auth nahi.

### S15 🔵 Telegram HTML injection / parse failure
- `telegramService.js:99-118,185,203,274` job name/URL/error `parse_mode: HTML` me escape kiye bina; `&`, `<` wale naam se message fail hota hai (`sendTelegramMessage` false return karta hai, alert chup-chap gayab) aur attacker apne job name me `<a href>` daal sakta hai. Error line me sirf `<>` strip hota hai (`:111`).

---

## 2. Scheduler / Execution Engine

### E1 🟠 Retries atomic nahi → duplicate execution
- **Where:** `schedulerService.js:234-266`, `routes/executionRoutes.js:88-112`.
- **Kya:** `processDueRetries` due retries `find` karta hai, `performExecution` baad me `status='running'` set karta hai — claim atomic nahi. In-process tick aur GitHub `/internal/tick` (ya overlapping ticks) ek hi retry do baar chala sakte hain; `attemptCount` double badhta hai. Manual retry route bhi kisi bhi execution (running/completed bhi) ko chala deta hai, `maxAttempts` ke upar tak.
- **Kyu:** Sirf scheduled occurrences pe unique-index claim hai; retries ke liye `findOneAndUpdate` claim nahi. ARCHITECTURE.md ka "never executes twice" claim sirf scheduled occurrences pe sahi hai.

### E2 🟠 Distributed lock sahi kaam nahi karta
- **Where:** `schedulerService.js:21-42, 424-433`, `routes/internalRoutes.js:32`.
- **Kya:** (a) Filter me `lockedBy: WORKER_ID` hai → same process hamesha apna lock dobara le leta hai, isliye `setInterval` ke overlapping ticks nahi rukte. (b) Lock TTL = tick interval (30s) jabki tick me jobs 120s tak chal sakte hain → lock beech me expire. (c) `releaseDistributedLock` kabhi call nahi hota. (d) `/internal/tick` koi lock leta hi nahi, jabki ARCHITECTURE.md §2A ulta bolta hai. (e) `rawResult: true` Mongoose 8 me removed/renamed hai **[VERIFY]**.

### E3 🟠 Crash pe runs lost ho jate hain
- **Where:** `schedulerService.js:69-100, 317-351`.
- **Kya:** `nextRunAt` execution se **pehle** aage badha di jati hai. Agar worker `Execution.create` aur `performExecution` ke beech mar jaye to execution `pending` me atak jata hai — `recoverStuckExecutions` sirf `status: 'running'` dekhta hai. Recovered running executions bhi sirf `failed` mark hote hain, retry queue me nahi jate (ARCHITECTURE.md "or queues for recovery" galat). `stuckThreshold` variable (`:71`) unused hai aur `STUCK_JOB_TIMEOUT_MS` ka koi asar nahi.

### E4 🟠 `misfirePolicy: 'run-all'` implement hi nahi
- `models/Job.js:192` aur README me promise hai; `processSchedulerTick` sirf `skip` handle karta hai (`:305`), baaki sab "run-once". Render free-tier sleep me (>5 min late) `skip` policy wale jobs silently drop ho jate hain.

### E5 🟡 `performExecution` me error handling nahi
- `schedulerService.js:107-229`: koi try/catch nahi. DB save ya notification error aaye to execution `running` me atka rehta hai jab tak lease expire na ho, phir "failed" mark hota hai jabki HTTP call successful thi. Notification (Telegram) `await` hota hai → slow Telegram se execution/tick late. Once-job complete hone ke baad job `status` `'paused'` ban jata hai (`:163`, `enabled` false hone se).

### E6 🟡 "0 retries" possible nahi + semantics confused
- `schedulerService.js:327`, `models/Job.js:257`, client `data-store.ts:109,302` — `maxAttempts || 10` / `maxRetries || 3` me `0` falsy hai, isliye retries disable nahi ho sakte. `maxRetries` (UI) vs `maxAttempts` (backend) ka matlab alag hai (3 "retries" = 3 total attempts). Network error pe non-idempotent POST bhi auto-retry hota hai (duplicate side effect).

### E7 🟡 Schedule validation holes (job save ho jata hai, chalta kabhi nahi)
- `jobRoutes.js:213-233`: custom ke alawa jo cron `buildCronExpression` banata hai usko validate nahi kiya jata. Galat time (`25:99`) ya `daysOfWeek: [99]` → cron-parser throw → `calculateNextRunAt` `null` (`utils/cronHelper.js:122-124`) → job "active" dikhta hai par kabhi run nahi hota, koi error nahi.
- `cronHelper.js:32` weekly me empty days = har din; `:40` empty custom cron = `* * * * *` (har minute!).
- `jobRoutes.js:304` (PUT) `data.customCron` truthy ho to `scheduleType: daily` bhi silently custom ban jata hai.

### E8 🟠 PUT partial update schedule/timezone tod deta hai
- **Where:** `jobRoutes.js:303-341`.
- **Kya:** Sirf `name` update bhejo to `scheduleType` undefined → `buildCronExpression('daily','00:00')` se purana schedule overwrite. `nextRunAt` `updateDoc` se compute hota hai jisme `timezone` nahi → default tz me. `enabled` na bheja ho to status `active` set ho jata hai jabki `enabled` false rehta hai (inconsistent). `findByIdAndUpdate` me `runValidators` nahi → `timeoutMs`, `maxAttempts`, `httpMethod` ke min/max/enum bypass.
- **Fix:** Pehle existing doc load karo, merge karo, validate (Zod), phir save.

### E9 🟡 One-time job enable karne par silent dead job
- `jobRoutes.js:427` — past `oneTimeRunAt` wale job ko enable karo to `nextRunAt = null` par `enabled = true`, status `active`.

### E10 🟡 Cleanup / retention nahi
- `Setting.retentionDays` kahin enforce nahi hota. Har execution me 64KB tak response body + logs hamesha store hote hain → Atlas M0 (512 MB) bhar jata hai. `DELETE /executions/purge` manual hai; `days=abc` → `Invalid Date` → 500 (`executionRoutes.js:137`), `days=0/negative` sab finished executions delete kar deta hai.

### E11 🟡 Long operations HTTP request ke andar
- `jobRoutes.js:392` (run-now) aur `executionRoutes.js:112` (retry) poora execution (120s tak) synchronously chalate hain. Client 15s pe abort (`api-client.ts:102-103`) → user ko "timed out" dikhta hai jabki job chal chuka hota hai; Render ka proxy limit bhi hai.
- **Fix:** 202 Accepted + background run + polling.

### E12 🟡 MongoDB initial connect fail → kabhi retry nahi
- `server.js:16-20` log karta hai "will retry in background", par `config/db.js` me koi retry loop nahi aur Mongoose initial connection failure ke baad khud retry nahi karta. App DB ke bina chalti rehti hai, `/api/ready` 503, scheduler har tick error. (`fix.md` ka "memory leak" claim galat hai; asli bug ulta hai.)

### E13 🔵 Double start
- `server.js:30-36` aur `worker.js:11-12` dono scheduler + Telegram polling start karte hain; dono processes chalao to polling 409 aur duplicate retries (E1). Webhook active ho to `getUpdates` 409 deta rehta hai (`telegramService.js:320-327` sirf 15s backoff).

### E14 🔵 Mongoose duplicate index warnings
- `unique: true` + `index: true` dono — `Execution.js:15-20`, `SystemLock.js:5-10`; `Job.js` me `enabled`/`nextRunAt` ka single + compound index.

### E15 🔵 Unbounded lists
- `limit`/`page` validate nahi (`jobRoutes.js:120-122`, `executionRoutes.js:38-40`, `auditRoutes.js:20-22`): `limit=1000000`, negative `page` → heavy query / Mongo error. `monitoringRoutes.js:24` admin ke liye saare jobs memory me load karta hai.

---

## 3. HTTP Executor

### H1 🟠 Redirect loop kabhi khatam nahi hota
- **Where:** `services/httpExecutor.js:99, 150, 181-190`.
- **Kya:** `redirectsFollowed` har recursive call me naya `0` hai aur kabhi increment nahi hota → `MAX_REDIRECTS = 5` kabhi trigger nahi hota. A→B→A redirect pe job apni timeout-budget (min 1s, `:186`) ke saath chalta hi rehta hai → tick atak jata hai, lease expire, duplicates (E2/E3).
- **Fix:** Redirect count parameter me pass karo aur badhao.

### H2 🟠 Response size limit nahi → OOM
- **Where:** `httpExecutor.js:134-143`.
- **Kya:** `maxContentLength` / `maxBodyLength` set nahi — poora response RAM me aata hai, uske baad hi 64KB truncate hota hai (`sanitize.js`). Bada response Render (512MB) ko OOM kar sakta hai. Axios `timeout` socket-idle based hai, total duration nahi (slow-drip response) **[VERIFY]**.

### H3 🟡 Job fields jo store hote hain par kaam nahi karte
- **Body Content-Type:** `Job.body` String hai (`Job.js:55`), isliye `typeof body === 'object'` branch (`httpExecutor.js:126`) kabhi nahi chalti; JSON body ke saath `Content-Type: application/json` header na ho to axios `x-www-form-urlencoded` bhejta hai.
- **Dead fields:** `queryParams` (`Job.js:59`), `responseValidation.jsonPath/expectedValue` (`:68-72`), `notifyEmail`, `notifyWebhook`, `hasBody` — executor/scheduler kahin use nahi karta. `authMode: basic/header` sirf bearer handle hota hai (`jobRoutes.js:80`).
- **Aur:** `expectedStatusCodes: []` ho to har request fail.

---

## 4. Telegram Bot (extra)

### T1 🟡 `/pause` aur `/resume` state inconsistent
- `telegramService.js:238` sirf `enabled:false` set karta hai (`status` aur `nextRunAt` purane rehte hain); `:257-260` resume `status` nahi badalta → dashboard "paused" dikhata hai jabki job enabled hai.

### T2 🟡 Commands tenant-scoped nahi
- `/jobs /next /status /history /failed` (`:164-296`) aur `/run /pause /resume` global hain — kisi bhi user ka job ID dekh/chala sakte hain.

### T3 🟡 Error handling / lost commands
- `/pause` aur `/resume` me try/catch nahi: galat ObjectId → CastError, user ko koi reply nahi. Polling loop (`:312-317`) me ek update fail ho to batch ke baaki updates skip ho jate hain jabki `lastUpdateId` aage badh chuka hota hai → commands lost.

### T4 🟡 `/run` polling block karta hai
- `:224` `await runJobNowCallback` poora job (120s tak) chalne tak polling loop band rehta hai.

### T5 🔵 Notification gaps
- `'retry'` event ka koi message nahi (`:98-108`); `User.telegramChatId` / `telegramNotificationsEnabled` profile fields dispatch me use hi nahi hote; message 4096 chars se bada ho to chunk nahi hota.

---

## 5. Notifications / Integrations / Team / Monitoring (mostly decorative backend)

### N1 🟠 Fake data DB me seed hota hai
- `teamRoutes.js:8-42` — har naye user ke liye "Alex Rivera / Priya Sharma / Marcus Chen @acme.dev" real DB me bante hain (isi wajah se audit filter me fake names dikhte the).
- `notificationRoutes.js:22-48` — "Primary PagerDuty Hook", Slack URL `…/T00/B00/XXXXX` enabled channel ke taur par seed.
- `integrationRoutes.js:8-44` — Slack/PagerDuty/GitHub/Webhook `connected: true` seed, jabki inme se koi bhi integration implement nahi hai.

### N2 🟠 Notification channels ka koi dispatcher nahi
- Sirf Telegram ka `dispatchExecutionNotification` hai. Email/Webhook/Slack/Discord/PagerDuty channels aur Integrations save ho jate hain par kabhi use nahi hote. `POST /channels/:id/test` (`notificationRoutes.js:154-165`) webhook fail ho ya type `email` ho, hamesha "successfully queued" bolta hai.

### N3 🟠 Client ↔ server route mismatch
- Client `DELETE /notifications/:id` aur `POST /notifications/:id/test` (`api-client.ts:378-388`) call karta hai; backend me sirf `/notifications/channels/:id` (`notificationRoutes.js:97-127`) hai → **404**. `data-store.ts:543-547` error swallow karta hai → channel sirf local me delete hota hai aur sync ke baad wapas aa jata hai.
- UI me `pagerduty` type (`notifications.tsx:35,225`) hai par backend enum me nahi (`NotificationChannel.js:7`) → save fail, local-only fake channel.
- `api-client.ts:322-327` `jobs.validateCron` → `/jobs/validate-cron` backend me exist nahi karta.
- `api-client.ts:191-200` `auth.google({email})` backend ke `credential/idToken` se match nahi karta (dead/broken method).
- Integrations: `data-store.ts:754-766` demo-data se IDs leta hai, backend se sync hi nahi karta; toggle demo-ID ke saath backend call → CastError, swallow.

### N4 🟡 Monitoring fake numbers
- `monitoringRoutes.js:9-14` hardcoded "Frankfurt/Oregon/Mumbai/Tokyo — operational — 99.98% uptime" runner clusters; p95 fallback `142ms` (`:34,38`); `never_run` jobs ko "healthy" gina jata hai (`:41`).

---

## 6. Frontend (client)

### C1 🟠 Errors chhupa ke "fake success"
- **Where:** `lib/data-store.ts` `saveJob` (:332-345), `addChannel` (:503), `addApiKey` (:590), `inviteMember` (:672), `deleteJob` (:405-409), `revokeApiKey` (:621-626), `removeMember` (:703-707); `components/jobs/job-form.tsx:144-148`.
- **Kya:** Backend fail ho to bhi local save + success toast ("saved directly to MongoDB database!"). Job sirf `localStorage` me rehta hai aur agle `syncWithBackend` pe gayab. **`revokeApiKey` backend fail ho to key UI me revoked dikhti hai par server pe valid rehti hai** (security impact).
- **Run Now fake:** `data-store.ts:468-469`, `routes/app/jobs/$jobId.tsx` (`handleRunNow` catch), `components/tables/jobs-table.tsx` (`handleRunNow` catch) — backend fail ho to **random latency ke saath fake "200 OK" execution** record hoti hai.

### C2 🟠 Galat job dikhana / us par action
- `routes/app/jobs/$jobId.tsx` (≈:42-44) `DataStore.getJob(jobId) || DataStore.getJobs()[0]` — invalid/purani ID par **pehla job** dikhta hai, "Job Not Found" screen kabhi nahi aati, aur Run/Toggle usi dusre job par chalte hain. SSR pe localStorage empty hone se hydration mismatch bhi (C12).

### C3 🟡 Backend data ko galat normalize
- `normalizeBackendExecution` (`data-store.ts:127-153`): `pending`/`running` → "failed"; `responseStatus` null → `200`; duration default `120`; failed pe fabricated error text.
- `normalizeBackendJob` (`:83`): once-jobs (no cron) ko `"0 * * * *"` dikhata hai — edit+save karne par one-time job hourly ban jata hai; `retrying` status → `active`, `lastStatus: retrying` → `null`.

### C4 🟡 UI sirf "custom cron" bhejta hai
- `data-store.ts:295-297` hamesha `scheduleType: "custom"` bhejta hai → daily/weekly/monthly/once (README ke features) UI se use hi nahi hote; `oneTimeRunAt` kabhi nahi jata.

### C5 🟡 `syncWithBackend` fragile + slow
- `data-store.ts:157-272`: 7 requests serial, ek hi try/catch — ek endpoint fail (429/500) to baaki sync band. Jobs limit 100, executions 50 (no pagination). Har page mount pe call hota hai; Render cold-start pe bahut slow.

### C6 🟡 localStorage ko DB ki tarah use
- Jobs (authToken/headers ke saath), executions, keys, team sab `localStorage` me. `signOut` (`auth.tsx:742-757`) sirf token + session hatata hai, `aapnacronjob_jobs/executions/keys/team/audit…` nahi → shared browser pe agla user purana data dekhta hai. Cross-tab sync nahi; `JSON.parse` unchecked.

### C7 🟡 Expired token ke baad UI "signed-in" atka rehta hai
- `auth.tsx:615-644`: `apiClient.auth.me()` 401 pe **throw** karta hai (`api-client.ts:116-119`), isliye "token invalid → cleanup" wali `else` branch kabhi chalti hi nahi. `catch` me cached user ke saath state `signed-in` rehti hai jabki har API call 401 deti hai.

### C8 🟡 "Test Ping" fake + dangerous default
- `job-form.tsx:75-95`: browser se `fetch(no-cors).catch(() => null)` karke **hamesha** success toast. Backend ka `/jobs/test-request` hai par client use nahi karta.
- `job-form.tsx:38-55`: default URL `https://api.acme.dev/sync`, method POST, JSON body **pre-filled value** (placeholder nahi) → bina badle save kiya to roz third-party domain pe POST.

### C9 🔵 API client
- `api-client.ts:93` har request pe `Content-Type: application/json` (GET pe bhi) → har GET pe CORS preflight.
- `:24` env na ho to `hostname:5000` fallback — Vercel pe galat host.
- `getApiBaseUrl` localStorage override (`aapnacronjob_api_url`) XSS se token redirect karne me kaam aa sakta hai.

### C10 🔵 Settings / channels local-only
- `toggleChannel` (`data-store.ts:521-528`) backend call karta hi nahi; `twoFactor`, `enforceSso`, `timezone` sirf local; `DEFAULT_SETTINGS.twoFactor: true` (`:43`) — naya user "2FA enabled" dekhta hai.

### C11 🔵 Calendar
- `routes/app/calendar.tsx` `getNextRuns(j.cron, { fromDate })` me `timeZone` pass nahi hota → browser tz use hota hai, job tz nahi → din/time galat ho sakte hain; paused jobs bhi dikhte hain; jis din koi run nahi, wahan "next runs" dusre dino ke dikha dete hain (fallback).

### C12 🟡 Hydration mismatch
- 6 jagah `useState(() => DataStore.get…())` (`$jobId.tsx:45`, `history.tsx:21`, `billing.tsx:21-22`, `integrations.tsx:21`, `index.tsx:42`); SSR pe `localStorage` empty → server HTML ≠ client HTML. `hooks/use-hydrated.ts` bana hai par kahin use nahi hota.

### C13 🔵 TypeScript route typing
- `components/tables/jobs-table.tsx:424` aur `components/navigation/command-palette.tsx:131` — `navigate({ to: \`/app/jobs/${job.id}\` })` TanStack typed routes me TS2322 deta hai (runtime chalta hai) **[VERIFY with `tsc --noEmit`]**. `tsconfig` bahut strict hai (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), isliye aur bhi type errors ho sakte hain.

### C14 🔵 Misc
- Google callback ke baad initial user ka email fake `${username}@apnascheduler.local` (`auth.tsx:576-581`) jab tak `/me` na aaye.
- Password `trim()` hota hai signIn/signUp me (spaces wale passwords change ho jate hain).
- 39 jagah `acme.dev` placeholders, 13 `console.*`, naming mixed: Apna / Aapna / Cronivo.

---

## 7. Fake / Demo Features jo real dikhte hain

| ID | Sev | Kya | Where |
|---|---|---|---|
| U1 | 🟠 | **Fake 2FA**: koi bhi 6 digits accept, `Math.random()` backup codes, "2FA activated" toast; backend me 2FA hai hi nahi | `routes/app/settings/security.tsx` (handleVerify2FA) |
| U2 | 🟡 | **Fake SAML SSO enforce** switch — backend rule nahi | `security.tsx` (handleSaveSAML) |
| U3 | 🟠 | **Forgot password fake**: backend endpoint nahi, koi bhi token/password "Password updated successfully"; locked-out user recover nahi kar sakta | `routes/forgot-password.tsx:24-45` |
| U4 | 🟡 | **Contact form** sirf `localStorage` me save + fake `TICK-xxxxxx` ID | `routes/contact.tsx:30-50` |
| U5 | 🟡 | **Billing**: static invoices (`INV-2026-009…`), "Visa ending in 4242", downloadable fake receipts "AapnaCronJob Inc." | `routes/app/billing.tsx:34-51` |
| U6 | 🔵 | **Status page**: live health sirf banner ke liye; services list `demoStatusServices` static | `routes/status.tsx:94` |
| U7 | 🔵 | **Team invite**: email jati nahi, `TeamMember` ≠ `User`, invited banda login nahi kar sakta | `teamRoutes.js:51-89` |

---

## 8. Build / Deploy / Docs / Config

### D1 🟠 Docker image me frontend serve nahi hoga (very likely)
- `Dockerfile:12,26` `client/dist` copy karta hai. Client TanStack Start + nitro hai (`client/vite.config.ts` comment: nitro build, default target cloudflare) → output `.output/` me aata hai, aur SSR build me `index.html` hota hi nahi; `server/src/app.js:96-118` `index.html` bhejta hai. Matlab README ka "docker-compose up → platform on :5000" frontend ke liye kaam nahi karega **[VERIFY: `cd client && npm run build && ls`]**.

### D2 🟠 DEPLOYMENT.md frontend config galat
- Vercel steps: "Framework Preset: Vite, Output: `dist`, env `VITE_API_BASE_URL`" — code `VITE_API_URL` padhta hai (`api-client.ts:17`, `client/.env.example`). Docs follow karo to API URL set nahi hoga → fallback `vercel.app:5000/api` → backend unreachable.
- `CLIENT_URL=*` unsupported (S13). `GOOGLE_*` env vars aur `TELEGRAM_WEBHOOK_SECRET` guide me hain hi nahi → Google button pe raw JSON error (`authRoutes.js:181-183`).

### D3 🟠 Self-pinger: docs ke khilaf + kaam bhi nahi karta
- `DEPLOYMENT.md` bolta hai "self-ping mat karo", par `server.js:36` default me chalata hai (`selfPingerService.js:9`). Default target `http://127.0.0.1:PORT/api/health` (`:20-26`) — Render ke liye loopback traffic "inbound" nahi gina jata, to keep-alive ka purpose fail. Config change pe har baar naya initial `setTimeout` bhi bana jata hai jo clear nahi hota (`:97-101`).
- **Fix:** Feature hata do ya sirf external public URL + auth ke saath rakho; GitHub Action/UptimeRobot hi asli keep-alive hai.

### D4 🟡 Docs stale / contradictory
- README: "React 18, React Router v6, Axios, 10 pages", folder name `"aapna Cron  jjob"`; asli stack React 19 + TanStack Start + fetch. `client/README.md` aur `client/roadmap.md` ("Demo-mode frontend. No real backend") purane. ARCHITECTURE.md ke claims (lock, stuck monitor, no-duplicates) E1-E3 se match nahi karte.

### D5 🟡 docker-compose / Dockerfile
- Placeholder secrets valid-looking (S2); Mongo port exposed + no auth; `version: '3.8'` obsolete; container root user, `HEALTHCHECK` nahi; client me `bun.lock` + `package-lock.json` dono (drift ka risk, `npm ci` pe fail ho sakta hai).

### D6 🟡 Bleeding-edge pinned deps
- `vite 8.1.5`, `nitro 3.0.260603-beta`, `rolldown` override, `@tanstack/react-start 1.168.60` — beta/pinned combos; reproducible build aur upgrades mushkil. Lovable-specific plugin (`@lovable.dev/vite-tanstack-config`) aur `lovable-error-reporting.ts` coupling.

### D7 🔵 GitHub Actions backup trigger
- `.github/workflows/scheduler-cron.yml`: `*/10` schedule 5–20+ min late ho sakta hai; public repo me 60 din inactivity pe scheduled workflows band ho jate hain; `curl --max-time 120` vs Render cold start + tick duration; `cat response.json` job summary logs me print karta hai.

### D8 🔵 Repo hygiene
- `AGENTS.md` me do personal GitHub accounts ka mirror/dual-push policy (drift ka risk); personal email code me hardcoded (S5).

---

## 9. Tests

| ID | Sev | Kya |
|---|---|---|
| Q1 | 🟡 | `server/tests/ssrf.test.js:45-49` live DNS (`httpbin.org`) chahta hai → offline/CI sandbox me fail. |
| Q2 | 🟡 | `security-integration.test.js:40-56` regex test **vacuous**: DB disconnected me `GET /api/jobs` pehle hi empty return kar deta hai (`jobRoutes.js:93-99`), regex path chalta hi nahi. |
| Q3 | 🔵 | `enhanced.test.js` isliye pass hota hai kyunki DB-down me auth fallback token pe bharosa karta hai (S12). |
| Q4 | 🟡 | Koi test nahi: tick claim/retry race, redirect loop, partial PUT, team/telegram authz, client data-store, hydration. Client me sirf routing + cron utils tests. |

---

## 10. `fix.md` ka item-by-item audit (52 items)

**Legend:** ✅ Already fixed · ⚠️ Partially / form badal gaya · ❌ Abhi bhi valid · 🚫 Is repo me nahi (kisi aur project ka) · ➖ Galat/exaggerated claim

### Category 1 — Crashes / Build
| # | fix.md item | Status | Note |
|---|---|---|---|
| 1 | `toggleJob` await nahi | ✅ | `await` ab hai (`$jobId.tsx`, `jobs-table.tsx`). |
| 2 | `apiClient.integrations` undefined | ✅ | Ab hai; par nayi problem: demo IDs (N3). |
| 3 | Job detail crash on invalid route | ⚠️ | Null-guard hai, par ab **pehla job** dikhata hai (C2) — zyada bura. |
| 4 | `<Link to={\`/app/jobs/${id}\`}>` | ⚠️ | Link wale fix hue; 2 `navigate` jagah bachi (C13). |
| 5 | Notifications `pagerduty` TS error | ✅ | Type update; par backend enum mismatch (N3). |
| 6 | `member.removed` TS error | ✅ | Type me hai. |
| 7 | Static files path mismatch | ❌ | Ab 3 paths check hote hain par Docker/SSR output phir bhi mismatch (D1). |
| 8 | Telegram polling crash-loop | ⚠️ | 409 pe 15s backoff hai (crash loop nahi), par double start + duplicates (E13). |
| 9 | Head-of-line blocking | ⚠️ | Ab `Promise.allSettled` concurrent hai; par tick slowest job tak block + lock TTL (E2). |
| 10 | `cron-parser` browser `node:fs` | ➖ | Verify nahi hua **[VERIFY]**; client me `cron-parser` v5 use ho raha hai. |

### Category 2 — Security
| # | Item | Status | Note |
|---|---|---|---|
| 11 | `/auth/google` bypass | ✅ | Token verify hota hai; par `aud` missing (S4). |
| 12 | Jobs IDOR | ✅ | `createdBy` scoping hai; par team/telegram/stats IDOR (S6, S11). |
| 13 | API key secret lost | ✅ | Modal me `secretKey` dikhta hai. |
| 14 | Tick endpoint rate limit | ✅ | `tickLimiter` hai (loose, S14). |
| 15 | SSRF redirect/DNS rebinding | ❌ | S7, S8. |
| 16 | Seed admin plaintext/default | ❌ | Aur bura: S5. |

### Category 3 — Frontend
| # | Item | Status | Note |
|---|---|---|---|
| 17 | Job form body/authToken drop | ✅ | Ab `savedJob` me hain (par backend sirf bearer, H3). |
| 18 | Fake endpoint test | ❌ | Ab real `fetch` hai par hamesha success toast (C8). |
| 19 | Calendar dead buttons | ✅ | Handlers hain. |
| 20 | Calendar 31 days | ✅ | `daysInMonth` compute hota hai. |
| 21 | Calendar day filter | ⚠️ | Filter hai; fallback unrelated runs dikhata hai (C11). |
| 22 | Toast `undefined` paused | ✅ | `await` se fix. |
| 23 | Audit actor names hardcoded | ✅ | Ab dynamic; par backend fake team seed (N1). |
| 24 | Settings local-only | ⚠️ | name/email/timeout/retention backend pe jate hain; 2FA/SSO/timezone local (C10). |
| 25 | Fake MFA | ❌ | U1. |
| 26 | Fake SAML | ❌ | U2. |
| 27 | Fake contact form | ❌ | U4. |
| 28 | Fake forgot password | ❌ | U3. |
| 29 | Static mock invoices | ❌ | U5. |
| 30 | Status page disconnected | ⚠️ | Live health banner hai, services static (U6). |
| 31 | Prettier CRLF 17,700 errors | ✅ | `endOfLine: "auto"` set hai (`eslint.config.js`) **[VERIFY with `npm run lint`]**. |

### Category 4 — Backend
| # | Item | Status | Note |
|---|---|---|---|
| 32 | `services/cronjobSync.js` hardcoded ObjectId | 🚫 | File repo me hai hi nahi. |
| 33 | Pause/resume next-run | ⚠️ | Asli issue: silent `null` nextRunAt (E7, E9) + Telegram state (T1). |
| 34 | Telegram `/resume` tz drift | ➖ | `calculateNextRunAt(job)` job ka tz use karta hai; asli bug status inconsistency (T1). |
| 35 | DB retry memory leak | ➖ | Aisa recursion/listener leak nahi; asli bug: retry hi nahi hota (E12). |
| 36 | Audit log user ref drift | ➖ | Audit me `username` string stored hai, populate nahi. |
| 37 | Monitoring cache race | ➖ | Heavy aggregate nahi; asli: fake data + sab jobs memory me (N4, E15). |
| 38 | ReDoS in search | ✅ | `escapeRegex` hai. |
| 39 | Self-pinger infinite loop | ⚠️ | Loop nahi, par unauthenticated + SSRF + useless (S1, D3). |
| 40 | Webhook HMAC on execution callback | 🚫 | Aisa callback endpoint hai hi nahi. |

### Category 5 — "Video Publishing Engine" (items 41-52)
**🚫 Sab 12 items is repo me nahi hain** (`publisher.js`, `youtube.js`, `facebook.js`, `instagram.js`, `blob.js`, `queueService.js`, `categoryService.js`, `github.js`, `database.js`, `videoService.js`): isme se koi file `ApnaCronJob` me exist nahi karti. Ye kisi dusre project ke issues `fix.md` me mix ho gaye hain — is file ko clean karo ya alag repo me le jao.

---

## 11. Recommended Fix Order

**Phase 1 — Aaj (security, ~1 din):** S1, S3, S5, S2 (+env fallback), S4, S6 (team role), S8, S11 (Telegram fallback chat).
**Phase 2 — Correctness (2-3 din):** H1 (redirect counter), H2 (maxContentLength), E8 (PUT merge + validators), E1/E2/E3 (atomic retry claim, lock TTL/release, pending recovery), E7 (cron validation), E12 (DB reconnect).
**Phase 3 — Frontend honesty (2 din):** C1 (errors surface karo, fake fallback hatao), C2, C3, C7, C6 (logout pe storage clear), C8; U1-U5 ko "coming soon" label karo ya hatao; N1 (seed data hatao), N3 (route mismatch).
**Phase 4 — Deploy/Docs:** D1 (Dockerfile build-output verify), D2, D3, D4, D5; fix.md se Category 5 hatao.
**Phase 5 — Tests:** Q1-Q4 (scheduler race, executor redirect loop, authz, CI me offline-safe SSRF test).

---

## 12. Jo maine run karke confirm NAHI kiya ([VERIFY] list)

1. `cd client && npm ci && npm run build && ls` — `dist/` vs `.output/` aur `index.html` ka hona (D1).
2. `npx tsc --noEmit` (client) — TS errors (C13, strict flags).
3. `npm run lint` (client) — CRLF/prettier status.
4. `ipaddr.js` `range()` ka `uniqueLocal` / `ipv4Mapped` behavior aur AAAA-based SSRF bypass (S7).
5. Mongoose 8 me `rawResult` option ka behavior (E2).
6. Axios `timeout` semantics (idle vs total) aur memory use bade response pe (H2).
7. `cron-parser` browser warning (fix.md #10).
8. `npm test` (server + client) — Q1 jaisi network-dependent tests ka actual result.

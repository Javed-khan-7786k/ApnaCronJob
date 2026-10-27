📊 Total Issues Found: 52
🔴 Category 1: Fatal Runtime Crashes & Build Breakers (Jo Code Direct Todte Hain)
DataStore.toggleJob Promise State Mutation Crash

File: client/src/routes/app/jobs/$jobId.tsx (Line 99–102) & client/src/components/tables/jobs-table.tsx (Line 108–113)
Kya break ho raha hai: DataStore.toggleJob() ek async function hai jo Promise return karta hai, lekin ise await nahi kiya gaya (const updated = DataStore.toggleJob(...)). React state me Promise object chala jata hai. Re-render hone par jab code job.name ya updated.enabled read karta hai, to undefined error se screen blank ho sakti hai aur toast message hamesha Job schedule is now paused dikhata hai chahe enable kiya ho.
Undefined Integrations API Client Crash

File: client/src/lib/data-store.ts (Line 677)
Kya break ho raha hai: apiClient.integrations.toggle(id) call kiya gaya hai, jabki client/src/lib/api-client.ts me integrations object declare hi nahi hai. Frontend par Integrations page me Connect / Disconnect button dabate hi TypeError: Cannot read properties of undefined (reading 'toggle') crash hota hai.
Job Detail Page Crash on Invalid/Direct Route ($jobId.tsx)

File: client/src/routes/app/jobs/$jobId.tsx (Line 42–44, 69–95, 115)
Kya break ho raha hai: useState(() => DataStore.getJob(jobId) || DataStore.getJobs()[0]) me agar job match na ho ya list empty ho, to job undefined reh jata hai. Page ke upar koi null-guard nahi hai; direct job.name, job.url, job.id padhne par poora component crash ho jata hai (Cannot read properties of undefined).
TanStack Router Strict Route Type Mismatch

Files:
client/src/routes/app/monitoring.tsx (Line 149)
client/src/routes/app/calendar.tsx (Line 132, 154)
client/src/routes/app/index.tsx (Line 202)
client/src/routes/index.tsx (Line 281)
Kya break ho raha hai: TanStack Router me dynamic routes ke liye <Link to={/app/jobs/${job.id}}> string interpolation allow nahi hota. TypeScript error TS2322: Type '/app/jobs/${string}' is not assignable throw karta hai. Iska correct syntax <Link to="/app/jobs/$jobId" params={{ jobId: job.id }}> hona chahiye.
TypeScript Strict Type Error on Notifications

File: client/src/routes/app/notifications.tsx (Line 71) & client/src/types/index.ts (Line 86)
Kya break ho raha hai: NotificationChannel['type'] sirf "email" | "webhook" | "slack" | "discord" allow karta hai, lekin state me "pagerduty" added hai, jisse TypeScript compilation break ho rahi hai (TS2322).
TypeScript Strict Type Error in Audit Logs

File: client/src/lib/data-store.ts (Line 622) & client/src/types/index.ts (Line 53)
Kya break ho raha hai: AuditEntry['kind'] union type me "member.removed" missing hai. removeMember run hone par compile-time error throw hota hai.
Production Serve Static Files Path Mismatch

File: server/src/app.js (Line 98–101)
Kya break ho raha hai: Backend Express server client/dist folder dhundta hai, jabki TanStack Start / Vite production bundle .output/public me build karta hai. Docker ya standalone server me frontend serve nahi hoga (404 Not Found dega).
Telegram Polling Conflict Crash Loop

File: server/src/server.js (Line 33) & server/src/worker.js (Line 12)
Kya break ho raha hai: Agar server.js aur worker.js dono chal rahe hon ya cloud par multiple instances scale ho jayein, to dono same Telegram bot token par getUpdates polling shuru kar dete hain. Telegram 409 Conflict: terminated by other getUpdates request return karta hai aur dono processes crash-loop me fas jate hain.
Head-of-Line Blocking in Scheduler Tick Engine

File: server/src/services/schedulerService.js (Line 293–360)
Kya break ho raha hai: processSchedulerTick loop me await performExecution(job, execution) sequentially execute hota hai. Agar 20 jobs due hain aur har job ka timeout 30s hai, to tick loop 10 minute tak block ho jayega. Distributed leader lock (TTL 25s) expire ho jayega, dusra worker tick le lega aur duplicate jobs execute hone lagenge.
Browser Crash on cron-parser Node.js Import

File: client/vite.config.ts & build bundle
Kya break ho raha hai: Vite build warning aati hai: Module "node:fs" has been externalized for browser compatibility by cron-parser. Agar browser me file parsing method call hua to browser console me fatal crash hoga.
🔒 Category 2: Security & Authentication Vulnerabilities
Critical Authentication Bypass / Account Takeover via POST /api/auth/google

File: server/src/routes/authRoutes.js (Line 267–287)
Khatra: POST /api/auth/google endpoint body me { email } accept karta hai bina kisi Google OAuth ID token verification ke. Koi bhi attacker kisi bhi user ya admin ka email bhej kar turant valid JWT admin token generate kar sakta hai.
Insecure Direct Object Reference (IDOR) on Cron Jobs

File: server/src/routes/jobRoutes.js (Line 80–119, 245–265)
Khatra: Job.find(query), Job.findById(id) me userId: req.user._id check nahi hota. Ek logged-in user doosre kisi bhi company ya user ke cron jobs dekh sakta hai, edit kar sakta hai, aur delete kar sakta hai.
API Keys Secret Permanently Lost on Generation

File: client/src/routes/app/api-keys.tsx (Line 63–75) & client/src/lib/data-store.ts (Line 504–515)
Khatra: Backend se aaya hua full secret key (res.data.secretKey) discard ho jata hai aur UI modal bina key dikhaye close ho jata hai. User ko key kabhi dikhti hi nahi, wo sirf prefix (crn_live_****) copy kar sakta hai.
Lack of Rate Limiting on Internal Tick Trigger

File: server/src/routes/internalRoutes.js
Khatra: Agar tick secret leak ho jaye to attacker rapid loop chala kar saare cron jobs ko infinite times trigger kar sakta hai.
SSRF Redirect Bypass Risk

File: server/src/services/httpExecutor.js (Line 164–178)
Khatra: HTTP redirect me agar DNS rebinding attack use kiya jaye to validation pass hone ke baad private IP resolve ho sakti hai.
Plaintext Password in Memory During Seed Admin

File: server/src/seedAdmin.js
Khatra: Hardcoded fallback admin credentials development environment me easily expose ho sakte hain.
📱 Category 3: Frontend UI, State & Logic Glitches
Data Loss: Custom HTTP Body & Auth Token Drop

File: client/src/components/jobs/job-form.tsx (Line 53, 57, 101–128)
Kya break ho raha hai: Job form me user jo JSON Body (body) ya custom Auth Token (authToken) likhta hai, use savedJob object me add hi nahi kiya gaya. Form save hone par body backend tak kabhi nahi pahunchti aur drop ho jati hai.
Fake Endpoint Testing Simulation

File: client/src/components/jobs/job-form.tsx (Line 77–88)
Kya break ho raha hai: "Test Request" button koi real HTTP call nahi karta. Wo sirf 600ms ka setTimeout chala kar fake 200 OK (${latency}ms) ka toast message dikha deta hai, chahe URL exist hi na karta ho.
Broken Calendar Month Controls (Dead Buttons)

File: client/src/routes/app/calendar.tsx (Line 67–72)
Kya break ho raha hai: Previous (ChevronLeft) aur Next (ChevronRight) buttons par koi onClick handler nahi laga. User previous ya next month par click kare to kuch nahi hota.
Hardcoded Calendar Days (31 Days Glitch)

File: client/src/routes/app/calendar.tsx (Line 36–37)
Kya break ho raha hai: const daysInMonth = 31 hardcoded hai. February, April, June, September, November sabhi me 31 din render hote hain.
Calendar Day Selection Does Not Filter Runs

File: client/src/routes/app/calendar.tsx (Line 40–48)
Kya break ho raha hai: Day 1 par click karein ya Day 28 par, runsForDay filter nahi hota; hamesha same static 3 runs render hote hain.
Toast Glitch in Jobs Table: Job "undefined" paused

File: client/src/components/tables/jobs-table.tsx (Line 108–113)
Kya break ho raha hai: Job toggle karne par updated.name aur updated.enabled undefined aate hain, jisse toast me Job "undefined" paused message show hota hai.
Audit Log Filter Names Hardcoded to Fake Developers

File: client/src/routes/app/audit-logs.tsx (Line 35)
Kya break ho raha hai: Actor filter pills me ["all", "Alex Rivera", "Priya Sharma", "Marcus Chen", "You", "System"] hardcoded hain. Real registered users ke naam filter me kabhi show nahi honge.
Settings Not Saved to Backend (Local-Only Storage)

File: client/src/routes/app/settings/index.tsx (Line 166–174)
Kya break ho raha hai: Workspace name, support email, aur default timeout sirf browser ke localStorage me save hote hain. Browser clear ya device switch karte hi settings reset ho jati hain.
Fake Two-Factor Authentication (MFA) Switch

File: client/src/routes/app/settings/security.tsx (Line 82–89)
Kya break ho raha hai: 2FA ka toggle sirf ek boolean state store karta hai. Backend me koi TOTP QR code ya OTP verification flow nahi hai. Enable hone ke baad bhi login bina 2FA ke ho jata hai.
Fake SAML SSO Enforcement Switch

File: client/src/routes/app/settings/security.tsx (Line 101–108)
Kya break ho raha hai: "Enforce SAML SSO" switch par backend authentication rule nahi laga hai.
Fake Contact Form Submission

File: client/src/routes/contact.tsx (Line 34–43)
Kya break ho raha hai: Contact form submit karne par backend ya email par koi message dispatch nahi hota, sirf dummy setTimeout toast aata hai.
Fake Forgot Password Recovery

File: client/src/routes/forgot-password.tsx (Line 24–29)
Kya break ho raha hai: Password reset link generate karne ka koi backend endpoint nahi hai; form submit hone par dummy toast aata hai aur koi email nahi jati.
Hardcoded Static Mock Invoices in Billing

File: client/src/routes/app/billing.tsx (Line 19–23)
Kya break ho raha hai: Invoices (INV-2026-009, etc.) static array hain. Koi Stripe/Razorpay payment gateway hooked nahi hai.
Public Status Page Disconnected from Backend

File: client/src/routes/status.tsx (Line 5)
Kya break ho raha hai: /status page real /api/health ko call karne ki jagah demoStatusServices mock array render karta hai. Server down hone par bhi status page "All Systems Operational" dikhata rahega.
17,700+ Prettier CRLF Line-Ending Warnings on Windows

File: client/eslint.config.js & entire client directory
Kya break ho raha hai: Windows par git checkout CRLF format me file write karta hai, jisse npm run lint 17,694 errors fek kar fail ho jata hai.
⚙️ Category 4: Backend API, Scheduling & Worker Flaws
Hardcoded MongoDB ObjectId in DB Fallback

File: services/cronjobSync.js (Line 362)
Kya break ho raha hai: Direct MongoDB Atlas sync fallback me createdBy: new mongoose.Types.ObjectId('6ae02694be1b0211ad47a7c5') hardcoded hai. Agar ye user exist nahi karta to sync jobs UI me kisi ko dikhenge nahi.
Missing Next Run Recalculation on Manual Pause

File: server/src/routes/jobRoutes.js (Line 300–325)
Kya break ho raha hai: Job pause karne par nextRunAt ko null set kar diya jata hai, lekin resume karne par agar cron invalid ho to job permanent stuck ho sakti hai.
Telegram /resume Command Timezone Drift

File: server/src/services/telegramService.js (Line 257–260)
Kya break ho raha hai: /resume command chalane par calculateNextRunAt(job) call hota hai, lekin job ka saved IANA timezone pass na hone par server ke default system timezone se drift ho sakta hai.
Database Connection Retry Memory Leak

File: server/src/config/db.js
Kya break ho raha hai: Agar MongoDB initial connection fail ho jaye to infinite recursive retry me error event listeners multiply hote rehte hain.
Audit Log User Reference Drift

File: server/src/routes/auditRoutes.js
Kya break ho raha hai: Agar koi user delete ho jaye to audit log me user: null aane par UI mapping crash ho sakti hai.
Monitoring Metrics Cache Race Condition

File: server/src/routes/monitoringRoutes.js
Kya break ho raha hai: High frequency hits me telemetry calculations DB par heavy aggregate query trigger karte hain bina Redis caching ke.
Unsafe Regex in Job Search Query (ReDoS Vulnerability)

File: server/src/routes/jobRoutes.js (Line 86–90)
Kya break ho raha hai: search query parameter ko bina escape kiye direct $regex me pass kiya gaya hai ({ $regex: search, $options: 'i' }). Special characters (.*.*.*.*) bhej kar CPU 100% kiya ja sakta hai.
Self-Pinger Infinite Loop on Same Host

File: server/src/services/selfPingerService.js
Kya break ho raha hai: Agar self-pinger target URL galat set ho kar server ke internal endpoint ko recursive trigger kare to socket exhaustion ho sakti hai.
Missing Webhook Signature Validation on Execution Callback

File: server/src/routes/executionRoutes.js
Kya break ho raha hai: External runners se status updates receive karte waqt HMAC verification missing hai.
🎬 Category 5: Video Publishing & Automation Engine (push video) Glitches
Missing isScheduled Variable YouTube Upload Crash

File: services/publisher.js (Line 120–128)
Status: Variable ka naam isExplicitlyScheduled tha jabki return me isScheduled use ho raha tha. (Hal hi me line 120 par assign kiya gaya, par edge-cases me check zaroori hai).
Excessive YouTube API Quota Consumption via search.list

File: services/youtube.js (Line 479)
Kya break ho raha hai: Duplicate video verification ke liye YouTube.search.list call hota hai jo 100 units per request consume karta hai. Din me sirf 100 videos check hone par poora 10,000 units ka daily quota khatam ho jayega aur subsequent saare uploads quotaExceeded error se fail ho jayenge. (Iski jagah videos.list(part: 'snippet', id: ...) 1 unit me hota hai).
Facebook Reels Minimum 20-Minute Scheduling Policy Rejection

File: services/facebook.js (Line 142–146)
Kya break ho raha hai: Meta Graph API rule ke mutabiq scheduled reel ka time current time se minimum 20 minutes aur maximum 75 days aage hona chahiye. Agar scheduled time 15 minute baad ka ho to Meta API OAuthException (100): Schedule time must be between 20 minutes and 75 days throw karta hai.
Instagram 3-Minute Container Polling Hang

File: services/instagram.js (Line 50–78)
Kya break ho raha hai: waitForContainer function har 5 second me 36 baar poll karta hai (total 180 seconds). Single thread event loop me ye worker queue ko 3 minute tak idle rakh sakta hai.
Telegram HTML Entity Parse Error on Video Titles

File: services/telegram.js (Line 29) & services/queueService.js (Line 407)
Kya break ho raha hai: Agar video title me < ya > ya & jaise characters hon (jaise: Surah Rahman <Part 1> & Dua), to Telegram HTML parse mode fail ho jata hai. Plaintext fallback to hai par primary notification fail ho jati hai.
Vercel Blob Large Video RAM Out-Of-Memory Crash

File: services/blob.js & services/publisher.js (Line 240)
Kya break ho raha hai: Download ke waqt agar stream pipe ki jagah buffer accumulation use ho to Render free tier (512MB RAM) par 1GB+ ki high bitrate video process hone par server direct crash (OOM Kill) ho jata hai.
Shared Cache Unlink Race Condition

File: services/youtube.js (Line 585–589) & services/publisher.js (Line 492)
Kya break ho raha hai: Agar multi-platform publishing chal rahi ho aur YouTube upload pehle khatam ho jaye, to temp file premature delete hone par Facebook/Instagram upload ENOENT: no such file or directory fek sakta hai.
Video "undefined" published in Queue Completion Logs

File: services/queueService.js (Line 401) & services/videoService.js
Kya break ho raha hai: Jab queue se sabhi platforms successfully publish ho jate hain, to checkAndCompleteVideo call hota hai jisme title missing hone par console me Video "undefined" published across all target platforms print hota hai.
Git Auto-Push Failure in Cloud Container

File: services/github.js (Line 147–178)
Kya break ho raha hai: Render/Railway container me .git folder na hone ya git credentials na hone par auto-sync 10s wait karke warning emit karta hai.
Queue Logical Key Date Boundary Collision

File: services/queueService.js (Line 36–49)
Kya break ho raha hai: logicalKey me UTC date string (slotDate = new Date(scheduledAt).toISOString().split('T')[0]) use hota hai. Agar koi schedule IST raat 12:30 AM (UTC 7:00 PM previous day) par ho to date boundary mismatch ki wajah se same day duplicate enqueue ho sakta hai.
Stale Lease Recovery False Positive on Slow Uploads

File: services/database.js & services/queueService.js
Kya break ho raha hai: Agar 4K long video upload 15 minute se zyada le le, to worker lease recovery engine use expired samajh kar retry queue me wapas daal deta hai, jisse duplicate upload shuru ho sakta hai.
Category Cascade Delete Orphan Videos

File: services/categoryService.js
Kya break ho raha hai: Jab koi category delete ki jati hai, to us category se linked videos ka category tag reset nahi hota, jisse queue filter me wo videos unhandled reh jati hain.
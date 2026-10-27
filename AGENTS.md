# Multi-Repository Deployment & Agent Synchronization Policy

## 🌐 Dual GitHub Repositories
This project is mirrored across two production repositories. Any automated agent, assistant, or developer working on this codebase **MUST ALWAYS** push changes to both repositories simultaneously to prevent state drift.

1. **Repository 1 (Primary)**:
   - URL: `https://github.com/Javed-khan-7786k/ApnaCronJob`
   - Git Remote: `origin`
2. **Repository 2 (Mirror / Secondary)**:
   - URL: `https://github.com/Jaavedkhan-hue/ApnaCronJob`
   - Git Remote: `second`

---

## 🚀 Mandatory Dual-Push Command
Whenever a commit or release is pushed to GitHub, execute:

```bash
# Push to Repository 1
git push origin main

# Push to Repository 2
git push second main
```

Or configure `origin` to push to both URLs automatically:
```bash
git remote set-url --add --push origin https://github.com/Javed-khan-7786k/ApnaCronJob.git
git remote set-url --add --push origin https://github.com/Jaavedkhan-hue/ApnaCronJob.git
```

---

## 🔒 Security & Code Hygiene Rules
1. **Zero Secret Leaks**:
   - Never commit `.env`, `.env.*`, API tokens, JWT secrets, OAuth client secrets, or private keys.
   - All environment variables must remain in local uncommitted files or deployment platform secret stores.
2. **No Build Artifacts or Dependencies**:
   - `node_modules/` must NEVER be committed.
   - Build output directories (`.output/`, `dist/`, `.wrangler/`, `.tanstack/`) must remain excluded via `.gitignore`.
3. **No Scratch/Temporary Scripts**:
   - One-off migration or debug scripts should not be committed to source control.

---

## 🧪 Pre-Push Verification Checklist
Before pushing any code to the dual repositories, ensure:
1. Client TypeScript verification: `cd client && npx tsc --noEmit` (0 errors)
2. Client ESLint check: `cd client && npm run lint` (0 errors)
3. Client Unit Tests: `cd client && npm test` (All tests passing)
4. Client Production Build: `cd client && npm run build` (Successful build)
5. Server Test Suite: `cd server && npm test` (All tests passing)

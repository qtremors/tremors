# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.2.3
> **Last Updated:** 2026-02-18
> **Audit Scope:** Full codebase — Frontend, Backend, Database, Documentation

---

## 🔴 Critical Security

- [ ] **Resume Upload Auth Bypass**: `api/admin/resume/route.ts` POST checks `request.headers.get("cookie")?.includes("admin_session")` — this only checks if the cookie **name** appears in the header string, not whether the session token is valid. Must use `verifyAdminCookie()` like all other admin routes.
- [ ] **CSP `unsafe-inline` / `unsafe-eval`**: `next.config.ts` allows `'unsafe-inline'` for scripts and `'unsafe-eval'`, which weakens CSP significantly and enables XSS vectors. Investigate if Next.js 16 has nonce support to remove these.
- [ ] **CSRF Origin Bypass**: In `csrf.ts`, the check `origin.includes(host)` (line 51) is bypassable — an attacker at `evil.com?host=localhost:3000` or `localhost:3000.evil.com` would pass. Should use strict `URL` parsing and exact host comparison.
- [ ] **Newspaper Generate Missing CSRF**: `api/newspaper/generate/route.ts` POST does not call `validateCsrf()`, unlike every other mutating admin endpoint. Add CSRF validation.
- [ ] **Auth Secret Fallback Weakness**: In `auth.ts`, `getSigningSecret()` falls back to deriving from `ADMIN_SECRET + "tremors-auth-v1-stable"`. If `ADMIN_SECRET` is well-known (e.g., never changed from `"your_secret_command"`), the derived signing secret is predictable and session tokens can be forged.
- [ ] **Legacy Auth Route Returns 200 for Invalid Credentials**: `api/auth/route.ts` line 251 returns `NextResponse.json({ success: false, error: "Invalid credentials" })` **without a status code** (defaults to 200). Must return 401.

---

## 🟠 High Priority — Bugs & Logic Issues

- [ ] **Database Typing**: Migrate `Repo.topics` from JSON string to `JSONB` for better querying and type safety.
- [ ] **Auth Secret Incorporation**: Update `lib/auth.ts` to incorporate provided short secrets into derived keys (if < 32 chars, hash `short_secret + stable_salt` rather than ignoring it).
- [ ] **Admin Safety**: Check `res.ok` before parsing JSON in `AdminContext.tsx` to prevent state corruption on non-200 responses.
- [ ] **SettingsContext Uses Wrong HTTP Method**: `SettingsContext.tsx` line 56 sends `POST` to `/api/admin/settings`, but that route only handles `GET` and `PATCH`. The update silently fails (405). Must use `PATCH`.
- [ ] **Duplicate Rate Limiting**: Both `middleware.ts` and `api/auth/route.ts` implement independent in-memory rate limiters with different algorithms, configs, and fingerprinting. The auth route limiter is redundant since middleware already rate-limits `/api/auth`. Consolidate.
- [ ] **Inconsistent Client IP Fingerprinting**: `middleware.ts` uses `anon-${ua.slice(0, 30)}` as fallback, while `api/auth/route.ts` uses `anon-${(ua + lang).slice(0, 50)}`. Same client gets different keys, defeating rate limit coordination.
- [ ] **Rate Limit Key Collision in Middleware**: `pathname.split("/").slice(0, 3).join("/")` maps `/api/auth`, `/api/auth/check`, and `/api/auth/logout` all to the key `/api/auth`. A visitor checking their auth status via GET `/api/auth/check` consumes the rate limit for login attempts (POST `/api/auth`).
- [ ] **Unused `twentyFourHoursAgo`**: `api/newspaper/generate/route.ts` line 58 creates `twentyFourHoursAgo` but never uses it after the weekly context refactor. Dead code.
- [ ] **`stats/commits` Unbounded Parallelism**: `api/stats/commits/route.ts` fires `Promise.allSettled` for ALL repos simultaneously. With many repos, this can hit GitHub API rate limits instantly. Needs batching like `github.ts` does for commits.
- [ ] **Inconsistent GitHub Auth Token Format**: `github.ts` uses `Bearer ${token}` while `stats/commits/route.ts` uses `token ${token}`. Both work, but inconsistency is confusing and the `token` prefix is deprecated by GitHub.

---

## 🟡 Medium Priority — Code Quality & Maintainability

- [ ] **Type Safety**: Replace `any` with `Repo` type in `ProjectsGrid.tsx` lines 39, 48.
- [ ] **Hardcoded Version**: Replace "v2.0" with `APP_VERSION` in `TerminalWelcome.tsx`.
- [ ] **Unused `ADMIN_CACHE_KEY` Constant**: `AdminContext.tsx` line 21 defines `ADMIN_CACHE_KEY = "admin_status_checked"` but it's never used anywhere. Dead code from a removed feature.
- [ ] **Empty `lib/agent/` Directory**: `src/lib/agent/` exists but is empty — vestigial from a removed feature. Delete it.
- [ ] **`data.ts` Always Fetches User from GitHub**: On the DB-cache path (line 171), `getUser(GITHUB_USERNAME)` is called every page load via `getGitHubData()`. This GitHub API call has no caching and serves data that rarely changes. Should be cached in DB or use `revalidate`.
- [ ] **`data.ts` Duplicated `GITHUB_USERNAME`**: Both `data.ts` and `api/admin/refresh/route.ts` independently define `const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "qtremors"`. Use the centralized `GITHUB_CONFIG.username` from `config/site.ts` instead.
- [ ] **Duplicated `GITHUB_USERNAME` in `stats/commits`**: Same pattern — `stats/commits/route.ts` line 11 defines its own `GITHUB_USERNAME`. Third duplicate.
- [ ] **`getRecentCommits` Limit Mismatch**: `data.ts` line 220 calls `getRecentCommits(repos, 10)` in the fallback path but `api/admin/refresh/route.ts` line 50 calls it with `50`. `DATA_LIMITS.maxCommitsRefresh` (50) exists in config but isn't used consistently.
- [ ] **`mergeActivityWithCache` Potential Duplicates**: `data.ts` line 124 pushes cached activity items alongside commit-derived items without deduplication. If a commit also exists as a cached activity item, it appears twice.
- [ ] **Prisma Seed Scripts Coupled to Env**: `prisma/seed-newspaper.ts` and cleanup scripts load `.env` via `dotenv` but are run as part of `vercel-build`. If env vars aren't available at that stage, the seed silently generates fallback content.

---

## 🔵 Low Priority — Cleanup & Quick Fixes

- [ ] **CSS Cleanup**: Remove redundant `flex` (keep `inline-flex`) in `ProjectsTable.tsx`.
- [ ] **Markdown Lint**: Fix list indentation in `CHANGELOG.md` (e.g., lines 87, 103 missing `---` separators).
- [ ] **`formatProjectTitle` Not Used in All Paths**: `lib/utils.ts` exports it but some components still do their own title formatting inline.
- [ ] **Newspaper RSS `description` Truncation**: `api/news/rss/route.ts` line 60 uses `substring(0, 200)` and appends `...` — not ideal for non-English or short body content where 200 chars is too much or too little.
- [ ] **`useFetch` Infinite Re-fetch Risk**: `useFetch.ts` includes `toast` in the `useCallback` dependency array for `fetchData`. If `toast` identity changes (common with context providers), it triggers re-fetches. Should use a ref instead.

---

## 🟣 Security & Middleware

- [ ] **Replace UA-Based Fingerprint**: Middleware fallback `anon-${ua.slice(0, 30)}` groups all users with the same browser into one rate-limit bucket. Replace with hashed anonymous ID (SHA-256 + salt + IP-like hints).
- [ ] **Rate Limit Key Collision**: Use exact routes from config for rate limit keys instead of path prefix slicing.
- [ ] **CSP Review**: Audit whether `unsafe-inline` and `unsafe-eval` in `next.config.ts` can be replaced with nonces now that Next.js 16 supports `experimental.sri`.
- [ ] **`img-src https:` Too Permissive**: CSP allows images from any HTTPS origin. Could be tightened to specific domains (`github.com`, `avatars.githubusercontent.com`, blob storage domain).
- [ ] **`connect-src` Missing Blob Storage**: If Vercel Blob is used for resume uploads, its domain should be in `connect-src`.

---

## 🔍 Active Investigations & Logic

- [ ] **Relative Time Sync**: Audit `ProjectCard`/`SpotlightSection` `timeAgo` calculation for hydration mismatches — uses `Date.now()` which differs between SSR and client.
- [ ] **Test Refactor**: Use structured helper/timestamp in `auth.test.ts` instead of manual manipulation.
- [ ] **Border Conflicts**: Resolve `TechnicalProficiencies.tsx` border overlaps in `lg` layout.

---

## 🎨 UI/UX & Accessibility

- [ ] **Loading States**: Add skeleton loaders to `ProjectsGrid` (beyond the basic 4-card pulse animation).
- [ ] **Accessibility**: Add `aria-live` blocks to terminal output.
- [ ] **Keyboard Navigation**: Audit modals for focus trapping.
- [ ] **Drag-and-Drop Accessibility**: `ProjectsGrid` drag reorder has no keyboard alternative or screen reader support.

---

## 📖 Documentation Issues

- [ ] **README `Templates/` Reference**: README line 99 references `Templates/` directory which doesn't exist in the project root.
- [ ] **DEVELOPMENT.md `DIRECT_URL` Mismatch**: `.env.example` calls it `DIRECT_URL` (line 19) but the Prisma schema uses `DATABASE_URL_UNPOOLED` (line 8). These may be different env var names for the same thing — confusing.
- [ ] **DEVELOPMENT.md Test Table Incomplete**: Lists `api/*.test.ts` generically but there are 14 specific test files. Could list key ones.
- [ ] **DEVELOPMENT.md Missing `NEXT_PUBLIC_URL`**: `csrf.ts` checks `process.env.NEXT_PUBLIC_URL` but this isn't documented in `.env.example` or `DEVELOPMENT.md`. Only `NEXT_PUBLIC_SITE_URL` is documented.
- [ ] **.env.example `ADMIN_SECRET` Default Value**: Shows `your_secret_command` as example, matching the config fallback in `site.ts`. A warning should note this must be changed.
- [ ] **Hardcoded Personal Info**: `site.ts` contains `singhamankumar207@gmail.com` and LinkedIn URL — these are not env-configurable, which limits reusability despite the project being structured as configurable.
- [ ] **CHANGELOG Missing Separator**: Between `[2.1.5]` and `[2.1.0]` (lines 86-103) there is no `---` separator unlike other versions.
- [ ] **CHANGELOG Links Not Working**: Version headers like `[2.2.3]` are not linked to any comparison URL or tag.

---

## ❓ Questionable / Confusing Patterns

- [ ] **`ErrorBoundary` as Provider**: `layout.tsx` line 76 wraps `ErrorBoundary` in `ProviderComposer`. Error boundaries are not providers — they don't provide context. This works but is semantically misleading.
- [ ] **Settings GET is Public But Exposes Admin Data**: `api/admin/settings/route.ts` GET returns `lastRefresh`, `resumeSummary`, `resumeAbout` without any auth check. These are admin-level data (when edits were last made, custom content) leaking to any visitor.
- [ ] **Newspaper `bodyContent` Stored as JSON String**: `NewspaperEdition.bodyContent` is a `String` containing a JSON array. Every read/write requires `JSON.parse`/`JSON.stringify`. This is error-prone (6+ parse sites). Should be JSONB or handled by a utility function everywhere.
- [ ] **`addRandomSuffix: false` in Resume Upload**: `api/admin/resume/route.ts` line 79 uploads to Vercel Blob with the exact original filename. A re-upload of a different file with the same name will overwrite without versioning. Potential data loss.
- [ ] **Holiday Detection Logic**: `api/newspaper/generate/route.ts` lines 160-164 has hardcoded holiday checks including a broad `Diwali/Festive Season` check for Oct 20-31 and Nov 20-31 — Diwali dates vary yearly and this range is inaccurate.

---

## 📋 Backlog

- [ ] **SEO**: Implement dynamic meta tags for editions and projects.
- [ ] **Unit Tests**: Full coverage for `useFetch`, `SettingsContext`, and `useTerminalAdmin`.
- [ ] **Terminal Extensions**: Games (Snake/Tetris) and RSS feed metadata.

---

## 🏗️ Technical Notes
- **Dates**: Use `formatIST` from `lib/date` for server/client consistency.
- **Auth**: `verifyAdminCookie()` for APIs, `AdminContext` for client components.
- **Fetching**: `useFetch<T>(url)` for reads, `fetch`/`useApiMutation` for mutations.
- **Providers**: Use `ProviderComposer` for nested providers.
- **Config**: Use `GITHUB_CONFIG.username` from `config/site.ts` — do not hardcode `GITHUB_USERNAME` in individual files.

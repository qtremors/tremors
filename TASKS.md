# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.3.1
> **Last Updated:** 2026-02-25

---

## A. Correctness & Reliability
- **[Architecture] Missing Route Error Boundaries:** The application uses a custom `<ErrorBoundary>` component inside `layout.tsx`. While this catches client-side render errors, Next.js App Router strongly recommends using `error.tsx` and `global-error.tsx` files to properly catch server-component errors and integrate with the router's recovery features. There are currently no `error.tsx` files in the `src/app` directory.
- **[Config] Env Vars Confusion:** `.env.example` has `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_URL` which can break CSRF. Document both clearly or consolidate, noting that CSRF requires exact origin matching.
- **[Logic Flow] Holiday Detection:** In `api/newspaper/generate/route.ts`, Diwali lookup is guarded by `day >= 20 && day <= 31`, invalidating dates like Nov 8. The day guard should be removed.
- **[Type Safety] Generate Route Types:** The `generateWithGemini` return type mistakenly types `bodyContent` as `string` instead of `string[]`.
- **[Data Fetching] Invalid Dummy URL:** In `lib/data.ts`, the fallback dummy user has a malformed `html_url: "https://github/{username}"` missing `.com`.
- **[Client Bundle] Config Usage:** In `config/site.ts`, `CONTACT_LINKS` uses the server-only `process.env.GITHUB_USERNAME` which will be undefined on client bundles. Use a `NEXT_PUBLIC_` env var instead.
- **[Data Integrity] Refresh Route Stores Topics as String Instead of JSON:** In `api/admin/refresh/route.ts`, repos are upserted with `topics: JSON.stringify(repo.topics)`. Since the Prisma schema defines `topics` as `Json`, this double-serializes an already-valid array into a string like `"[\"a\",\"b\"]"`, requiring `parseTopics()` to handle both arrays and strings. Store topics as the raw array directly.
- **[Data Integrity] Newspaper Edition Deactivation Not Transactional:** In `api/newspaper/generate/route.ts`, the two-step deactivate-then-create flow is not wrapped in a `$transaction`. A failure between steps could leave all today's editions deactivated with no active edition.

## B. Security
- **[Risk] Memory Leak in Rate Limiter:** `middleware.ts` uses an in-memory `Map` for rate limiting with a probabilistic cleanup mechanism (`Math.random() < 0.01`). While acceptable for low-traffic single instances, under sustained automated requests it could lead to memory leaks. A TTL-based store (like Redis) or a deterministic `setInterval` cleanup is recommended for production.
- **[Rate Limiting] Sub-route Bypass:** `middleware.ts` rate-limit key uses exact `pathname`, giving each sub-path a separate bucket. It should group all `/api/auth/*` requests into the same bucket.
- **[CSP] Hydration Failure / Nonces:** *(deferred — requires RSC nonce architecture)* The CSP in `next.config.ts` removing `unsafe-inline` breaks Next.js RSC hydration. Need to implement per-request nonce propagation in middleware and interpolate it into the CSP header.
- **[Auth] Fallback Secret Warning:** `lib/auth.ts` generates a random in-memory fallback secret silently when default secrets are used. This causes silent session invalidation on server restart and needs explicit warning logs.
- **[Security] GET Requests Skip Rate Limiting Entirely:** `middleware.ts` exempts all `GET`/`HEAD`/`OPTIONS` from rate limiting (except `/api/auth`). Public GET endpoints like `/api/stats/commits` and `/api/newspaper/editions` make expensive DB + GitHub API calls and are vulnerable to DoS without any rate protection.
- **[Security] Logout Does Not Verify Session:** In `api/auth/logout/route.ts`, the `POST` handler deletes the cookie without checking if the user is actually authenticated first. While not a critical risk for cookie deletion, it's inconsistent with all other admin endpoints and could be used to clear legitimate sessions via CSRF if the CSRF check is bypassed.

## C. Performance & Resource Efficiency
- **[Inefficiency] Database Query Waterfall:** In `api/newspaper/generate/route.ts`, `allRepos` and `recentCommits` are fetched sequentially before a `Promise.all` block that fetches weekly stats. Moving all 5 database queries into a single `Promise.all` will significantly reduce the total request duration.
- **[Optimization] Next/Image Component:** `ProjectCard.tsx` uses standard HTML `<img>` tags. Since Next.js is installed (`v16.1.6`), refactoring to `next/image` will provide automatic WebP conversion, optimized sizing, and better Cumulative Layout Shift (CLS) prevention. 
- **[Inefficiency] Repeated Postgres Cache Bypass Hack:** The `{ id: { gte: 0 } }` / `{ id: { gte: "" } }` workaround for Postgres cached plans after a JSONB migration appears in 5 separate queries across `lib/data.ts`, `api/newspaper/generate/route.ts`, and `api/newspaper/editions/route.ts`. This is fragile tech debt. Run `DISCARD ALL` or reconnect Prisma once, then remove all these hacks. The underlying Postgres plan cache should have long since refreshed.
- **[Inefficiency] Stats Commits N+1 GitHub Calls:** `/api/stats/commits` fetches commit count for every repo individually via GitHub API pagination trick, even with batching. For a portfolio with 20+ repos, this generates 20+ external API calls per request. Consider caching the total count in the database during admin refresh instead.

## D. Architecture & Design Quality
- **[Tech Debt] Global Prisma Query Hack:** In `lib/data.ts`, `prisma.repo.findMany({ where: { id: { gte: 0 } } })` is used with a comment explaining it bypasses Postgres cached plans for a JSONB migration. This is a fragile database workaround. The core database index cache should be regenerated or a more robust Prisma querying strategy should be adopted.
- **[Type Safety] Client Value Import:** In `ProjectsGrid.tsx`, `Repo` from `@prisma/client` is imported as a value. Change to `import type { Repo }` to avoid bundling server code.
- **[Type Safety] JSONB Type Casting:** In `ProjectsGrid.tsx`, the `topics` field is manually cast `(r.topics as string[])` because Prisma's `JsonValue` type is too broad. Implementing a Zod schema or a custom Prisma Result extension would guarantee runtime and build-time type safety.
- **[Testing] Leaked Timers:** In `auth.test.ts`, `vi.useFakeTimers()` can leak if an assertion fails before `vi.useRealTimers()`. Wrap in `try/finally` or use `afterEach`.
- **[Architecture] Duplicate Auth Header Helpers:** `getHeaders()` in `lib/github.ts` and `getAuthHeaders()` in `api/stats/commits/route.ts` are duplicated utility functions that build the same GitHub API headers. Consolidate into a single shared helper in `lib/github.ts`.
- **[Architecture] Duplicate `GITHUB_USERNAME` Resolution:** `api/stats/commits/route.ts` resolves `GITHUB_USERNAME` from `process.env` directly at the module level, while all other routes use `GITHUB_CONFIG.username` from `config/site.ts`. This creates a maintenance risk if the env var name changes.
- **[Architecture] Dead `lib/agent` Directory:** `lib/agent` is an empty directory that was referenced in changelog v2.2.6 as a "Vestigial Directory Cleanup" but the directory still exists. Delete it to avoid confusion.

## E. Maintainability & Code Quality
- **[Code Quality] `useApiMutation` Hook Not Used:** The `useApiMutation` hook in `hooks/useFetch.ts` is exported but never imported anywhere. Components like `ProjectsGrid.tsx` still use raw `fetch()` for mutations. Either adopt the hook project-wide or remove the dead code.

## F. Documentation Quality
- **[Doc Mismatch] README Version Badge vs Package.json:** The README badges show `Next.js-16.0` but `package.json` pins `^16.1.6`. The badge should reflect the actual installed range.
- **[Doc Mismatch] DEVELOPMENT.md Test Count:** `DEVELOPMENT.md` states "111 passing tests" but `CHANGELOG.md` v2.2.0 references "106 tests" and there are now 14 test files with additional tests added since. The count should be verified and updated.
- **[Doc Gap] `DEVELOPMENT.md` Missing `ADMIN_PASSWORD` Clarification:** `.env.example` lists `ADMIN_PASSWORD` which is not covered in the Environment Variables table of `DEVELOPMENT.md`. Either document it or remove it from `.env.example`.
- **[Doc Mismatch] Project Structure Lists `.agents/` but Directory Not Present:** `DEVELOPMENT.md` line 67 shows `.agents/` in the project structure tree, but the actual root directory does not contain this directory. Remove or update the documentation.

## G. Configuration & Infrastructure
- **[Config] Version Mismatch across Files:** `package.json` says `2.3.0`, `CHANGELOG.md` lists `[2.3.1]` as the latest entry, and `TASKS.md` + `DEVELOPMENT.md` say `2.3.0`. Synchronize the version across all files. If `2.3.1` was released, `package.json` and other docs should reflect it.
- **[Config] `eslint-config-next` Version Pinned at `16.0.10`:** The `next` package is `^16.1.6` but `eslint-config-next` is pinned to `16.0.10`. This version mismatch could cause lint rule drift. Update to match the `next` version range.

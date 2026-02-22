# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.3.0
> **Last Updated:** 2026-02-22

---

## A. Correctness & Reliability
- **[Bug] CSP Blocking Repo Images:** In `next.config.ts`, the Content Security Policy `img-src` directive does not include `https://opengraph.githubassets.com`. However, this domain is explicitly used in `ProjectCard.tsx` for GitHub fallback images, causing them to be blocked by the browser in production.
- **[Architecture] Missing Route Error Boundaries:** The application uses a custom `<ErrorBoundary>` component inside `layout.tsx`. While this catches client-side render errors, Next.js App Router strongly recommends using `error.tsx` and `global-error.tsx` files to properly catch server-component errors and integrate with the router's recovery features. There are currently no `error.tsx` files in the `src/app` directory.
- **[Config] Env Vars Confusion:** `.env.example` has `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_URL` which can break CSRF. Document both clearly or consolidate, noting that CSRF requires exact origin matching.
- **[Logic Flow] Holiday Detection:** In `api/newspaper/generate/route.ts`, Diwali lookup is guarded by `day >= 20 && day <= 31`, invalidating dates like Nov 8. The day guard should be removed.
- **[Type Safety] Generate Route Types:** The `generateWithGemini` return type mistakenly types `bodyContent` as `string` instead of `string[]`.
- **[Data Fetching] Invalid Dummy URL:** In `lib/data.ts`, the fallback dummy user has a malformed `html_url: "https://github/{username}"` missing `.com`.
- **[Client Bundle] Config Usage:** In `config/site.ts`, `CONTACT_LINKS` uses the server-only `process.env.GITHUB_USERNAME` which will be undefined on client bundles. Use a `NEXT_PUBLIC_` env var instead.

## B. Security
- **[Risk] Memory Leak in Rate Limiter:** `middleware.ts` uses an in-memory `Map` for rate limiting with a probabilistic cleanup mechanism (`Math.random() < 0.01`). While acceptable for low-traffic single instances, under sustained automated requests it could lead to memory leaks. A TTL-based store (like Redis) or a deterministic `setInterval` cleanup is recommended for production.
- **[Rate Limiting] Sub-route Bypass:** `middleware.ts` rate-limit key uses exact `pathname`, giving each sub-path a separate bucket. It should group all `/api/auth/*` requests into the same bucket.
- **[CSP] Hydration Failure / Nonces:** The CSP in `next.config.ts` removing `unsafe-inline` breaks Next.js RSC hydration. Need to implement per-request nonce propagation in middleware and interpolate it into the CSP header.
- **[Auth] Fallback Secret Warning:** `lib/auth.ts` generates a random in-memory fallback secret silently when default secrets are used. This causes silent session invalidation on server restart and needs explicit warning logs.

## C. Performance & Resource Efficiency
- **[Inefficiency] Database Query Waterfall:** In `api/newspaper/generate/route.ts`, `allRepos` and `recentCommits` are fetched sequentially before a `Promise.all` block that fetches weekly stats. Moving all 5 database queries into a single `Promise.all` will significantly reduce the total request duration.
- **[Optimization] Next/Image Component:** `ProjectCard.tsx` uses standard HTML `<img>` tags. Since Next.js is installed (`v16.1.6`), refactoring to `next/image` will provide automatic WebP conversion, optimized sizing, and better Cumulative Layout Shift (CLS) prevention. 

## D. Architecture & Design Quality
- **[Tech Debt] Global Prisma Query Hack:** In `lib/data.ts`, `prisma.repo.findMany({ where: { id: { gte: 0 } } })` is used with a comment explaining it bypasses Postgres cached plans for a JSONB migration. This is a fragile database workaround. The core database index cache should be regenerated or a more robust Prisma querying strategy should be adopted.
- **[Type Safety] Client Value Import:** In `ProjectsGrid.tsx`, `Repo` from `@prisma/client` is imported as a value. Change to `import type { Repo }` to avoid bundling server code.
- **[Type Safety] JSONB Type Casting:** In `ProjectsGrid.tsx`, the `topics` field is manually cast `(r.topics as string[])` because Prisma's `JsonValue` type is too broad. Implementing a Zod schema or a custom Prisma Result extension would guarantee runtime and build-time type safety.
- **[Testing] Leaked Timers:** In `auth.test.ts`, `vi.useFakeTimers()` can leak if an assertion fails before `vi.useRealTimers()`. Wrap in `try/finally` or use `afterEach`.

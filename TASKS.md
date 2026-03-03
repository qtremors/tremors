# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.3.3
> **Last Updated:** 2026-03-03

---

## A. Correctness & Reliability
- **[Architecture] Missing Route Error Boundaries:** The application uses a custom `<ErrorBoundary>` component inside `layout.tsx`. While this catches client-side render errors, Next.js App Router strongly recommends using `error.tsx` and `global-error.tsx` files to properly catch server-component errors and integrate with the router's recovery features. There are currently no `error.tsx` files in the `src/app` directory.
- **[Config] Env Vars Confusion:** `.env.example` has `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_URL` which can break CSRF. Document both clearly or consolidate, noting that CSRF requires exact origin matching.

## B. Security
- **[CSP] Hydration Failure / Nonces:** *(deferred — requires RSC nonce architecture)* The CSP in `next.config.ts` removing `unsafe-inline` breaks Next.js RSC hydration. Need to implement per-request nonce propagation in middleware and interpolate it into the CSP header.

## C. Performance & Resource Efficiency
- **[Optimization] Next/Image Component:** `ProjectCard.tsx` uses standard HTML `<img>` tags. Since Next.js is installed (`v16.1.6`), refactoring to `next/image` will provide automatic WebP conversion, optimized sizing, and better Cumulative Layout Shift (CLS) prevention. 
- **[Inefficiency] Stats Commits N+1 GitHub Calls:** `/api/stats/commits` fetches commit count for every repo individually via GitHub API pagination trick, even with batching. For a portfolio with 20+ repos, this generates 20+ external API calls per request. Consider caching the total count in the database during admin refresh instead.

## D. Architecture & Design Quality
- **[Type Safety] JSONB Type Casting:** In `ProjectsGrid.tsx`, the `topics` field is manually cast `(r.topics as string[])` because Prisma's `JsonValue` type is too broad. Implementing a Zod schema or a custom Prisma Result extension would guarantee runtime and build-time type safety.

## G. Configuration & Infrastructure
- **[Config] `eslint-config-next` Version Pinned at `16.0.10`:** The `next` package is `^16.1.6` but `eslint-config-next` is pinned to `16.0.10`. This version mismatch could cause lint rule drift. Update to match the `next` version range.

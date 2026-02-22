# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.3.0
> **Last Updated:** 2026-02-22

---

### A. Correctness & Reliability
- **[Bug] CSP Blocking Repo Images:** In `next.config.ts`, the Content Security Policy `img-src` directive does not include `https://opengraph.githubassets.com`. However, this domain is explicitly used in `ProjectCard.tsx` for GitHub fallback images, causing them to be blocked by the browser in production.
- **[Architecture] Missing Route Error Boundaries:** The application uses a custom `<ErrorBoundary>` component inside `layout.tsx`. While this catches client-side render errors, Next.js App Router strongly recommends using `error.tsx` and `global-error.tsx` files to properly catch server-component errors and integrate with the router's recovery features. There are currently no `error.tsx` files in the `src/app` directory.

### B. Security
- **[Risk] Memory Leak in Rate Limiter:** `middleware.ts` uses an in-memory `Map` for rate limiting with a probabilistic cleanup mechanism (`Math.random() < 0.01`). While acceptable for low-traffic single instances, under sustained automated requests it could lead to memory leaks. A TTL-based store (like Redis) or a deterministic `setInterval` cleanup is recommended for production.

### C. Performance & Resource Efficiency
- **[Inefficiency] Database Query Waterfall:** In `api/newspaper/generate/route.ts`, `allRepos` and `recentCommits` are fetched sequentially before a `Promise.all` block that fetches weekly stats. Moving all 5 database queries into a single `Promise.all` will significantly reduce the total request duration.
- **[Optimization] Next/Image Component:** `ProjectCard.tsx` uses standard HTML `<img>` tags. Since Next.js is installed (`v16.1.6`), refactoring to `next/image` will provide automatic WebP conversion, optimized sizing, and better Cumulative Layout Shift (CLS) prevention. 

### D. Architecture & Design Quality
- **[Tech Debt] Global Prisma Query Hack:** In `lib/data.ts`, `prisma.repo.findMany({ where: { id: { gte: 0 } } })` is used with a comment explaining it bypasses Postgres cached plans for a JSONB migration. This is a fragile database workaround. The core database index cache should be regenerated or a more robust Prisma querying strategy should be adopted.
- **[Type Safety] JSONB Type Casting:** In `ProjectsGrid.tsx`, the `topics` field is manually cast `(r.topics as string[])` because Prisma's `JsonValue` type is too broad. Implementing a Zod schema or a custom Prisma Result extension would guarantee runtime and build-time type safety.

# Tremors Portfolio Changelog

> **Project:** Tremors Portfolio  
> **Version:** 2.2.5  
> **Last Updated:** 2026-02-21

---

## [2.2.5] - 2026-02-21

### Changed
- **Database Typing**: Migrated `Repo.topics` from JSON string to `JSONB` (`Json`) native type for improved Prisma type safety.
- **Rate Limiting**: Removed redundant rate limiter from `api/auth/route.ts` and consolidated everything into `middleware.ts` using exact route paths.
- **GitHub Auth Token**: Standardized GitHub API requests in `stats/commits` to use the `Bearer` token format instead of the deprecated `token` format.

### Fixed
- **Auth Safety**: `AdminContext` now strictly validates `res.ok` before attempting to parse JSON.
- **Settings API**: Switched `SettingsContext` API call from `POST` to `PATCH` to fix the silent 405 Method Not Allowed error.
- **Auth Secrets**: Strengthened derived signing secret generation in `lib/auth.ts` to properly incorporate short fallback secrets.
- **Client IP Fingerprinting**: Fixed inconsistent fallback IP generation between `middleware.ts` and `api/auth/route.ts` by coordinating `user-agent` and `accept-language` parsing.
- **API Perf**: Bounded parallelism in `/api/stats/commits` to a max concurrency of 5 to prevent hitting GitHub's secondary rate limits on large portfolios.

### Removed
- **Dead Code**: Removed the unused `twentyFourHoursAgo` variable from the newspaper generation route.

---

## [2.2.4] - 2026-02-21

### Security
- **Resume Upload Auth**: Enforced `verifyAdminCookie()` for Vercel Blob PDF uploads.
- **CSP**: Removed `unsafe-eval` from script-src in production environments.
- **CSRF**: Strengthened origin validation with strict URL parsing.
- **Newspaper Generation**: Added CSRF protection to the generate admin endpoint.
- **Auth Secret**: Prevented predictability of derived signing secrets when using default admin secrets.
- **Legacy Auth**: Fixed API route returning 200 OK for invalid credentials; now properly returns 401.

---

## [2.2.3] - 2026-02-17

### Added
- **Skye AI (Weekly Context)**: Expanded Newspaper AI memory from 24 hours to a full 7-day window.
- **Headline Awareness**: Added a "Memory" check that fetches the last 5 active headlines to prevent repetitive storytelling and jokes.
- **Temporal Grouping**: Refactored the context builder to group activity by day (IST), allowing the AI to understand the chronological flow of work.

### Changed
- **Content Granularity**: Increased the daily commit detail limit to 15 messages (was 5) to capture more nuance on highly active days.

---

## [2.2.2] - 2026-02-17

### Fixed
- **Session Stability**: Resolved a critical regression causing auto-logout after 10-15s by throttling visibility-change auth re-checks in `AdminContext`.
- **Auth Compatibility**: Restored UTF-8 buffer comparison in `verifyPassword` to ensure stability for legacy hashes.
- **Secret Jitter**: Stabilized auth signing secret derivation by removing environment-jittery variables (`DATABASE_URL`, `NODE_ENV`).
- **Standardized API**: Ensured all auth endpoints return consistent `success` and `sessionInfo` properties.
- **Rate Limiting**: Relaxed admin login thresholds to 10 attempts per 5-minute window for better developer ergonomics.

### Security
- **Dependency Audit**: Resolved all high and moderate vulnerabilities by upgrading `next` and `undici` via `npm audit fix --force`.

### Testing
- **Auth Coverage**: Expanded `auth.test.ts` to include robust session token verification, expiry, and signature validation.

---

## [2.2.1] - 2026-01-14 (Hotfix)

### Fixed
- **Admin GitHub Link**: Fixed `html_url` not being returned by `/api/admin/repos`, causing project title links to be non-clickable for admin users.
- **SpotlightSection**: Restored center logo placeholder with "Last Active" repo display from old version.
- **MoreProjectsSection**: Restored "Show More/Less" buttons with "X of Y" counter display.
- **ProjectCard Title**: Removed `onClick` handler that was blocking GitHub link navigation in edit mode.
- **Topic Badge Overflow**: Added `max-w-[120px] truncate` to prevent long topic names from overflowing card boundaries.

---

## [2.2.0] - 2026-01-14

### Added
- **Batch Reordering API**: Implemented `/api/admin/repos/reorder` endpoint to replace N+1 PATCH calls with a single batch operation.
- **Settings Context**: Created `SettingsProvider` to manage global site preferences (`showProjectImages`, `projectViewMode`).
- **useFetch Hook**: Standardized data fetching across components, replacing manual `useEffect` fetch logic.
- **IST Date Utilities**: Centralized timezone handling in `lib/date.ts` with `formatIST` helper.
- **ProviderComposer**: New utility component to flatten nested provider trees in `layout.tsx`.
- **Database Indexes**: Added indexes on `Repo.featured` and `Repo.hidden` for optimized filtering.
- **Rate Limiting Middleware**: Centralized rate limiting in `middleware.ts` with configurable limits per route pattern.

### Changed
- **Component Decomposition**: Split monolithic components for better maintainability:
  - `ProjectsGrid.tsx` → `GridControls`, `SpotlightSection`, `MoreProjectsSection`
  - `TerminalPage.tsx` → `TerminalWelcome`, `TerminalHistory`, `MobileKeyboardHelpers`
  - `NewspaperPage.tsx` → `NewspaperHeader`, `ActivityTicker`, `EditionArticle`, `NewspaperStats`, `ProjectsTable`
- **Terminal Admin**: Consolidated redundant state logic into `useTerminalAdmin` hook.
- **Masthead Styling**: Standardized font sizes and spacing in `NewspaperPage` header.
- **Provider Nesting**: Refactored `layout.tsx` to use `ProviderComposer` pattern instead of 7-level deep nesting.
- **Code Centralization**: Moved `formatProjectTitle` utility from 3 files to shared `lib/utils.ts`.

### Fixed
- **Session Validation**: Strengthened `/api/newspaper/active` to properly validate session tokens, not just cookie existence.
- **CSRF Protection**: Added `validateCsrf` helper to sensitive POST/PATCH endpoints.
- **Rate Limit Memory Leak**: Fixed potential memory leak in `auth.ts` where expired entries weren't purged before limit check.
- **Timezone Inconsistency**: Fixed newspaper generation and display dates that previously used system time, causing streak calculation bugs.
- **Project Card Mapping**: Added missing fields (`imageSource`, `customDescription`) in repository mapping logic.
- **Personality Modal**: Renamed confusing "Confirm Assignment" button to "Back to Desk".
- **Dead Code Cleanup**: Removed obsolete manual `localStorage` and unused variable comments.
- **Stale Tests**: Removed 5 test cases for deleted commands (`fortune`, `cowsay`, `sl`, `date`, `neofetch`). All 106 tests now pass.
- **State Sync Bug**: Fixed `ProjectsGrid.tsx` effect that could overwrite local edits when `adminData` refreshed during editing.

### Security
- **AUTH_SECRET**: Re-configured to require defined value in production environments.

---

## [2.1.5] - 2026-01-13
 
### Added
- **AI Personalities**: Introduced "Skye", the AI News Agent with 4 distinct personas (Tabloid, Senior Dev, Scholar, Hacker).
- **Personality Manager**: New UI modal to switch between AI personalities dynamically.
- **Context Engine V2**: 
    - **Hybrid Memory**: Combines historical portfolio data (Dormant, Featured, Oldest) with real-time daily activity.
    - **Time Awareness**: Enforced GMT+5:30 (IST) for accurate "Daily Update" tracking and "Vibe" checks.
- **Admin Refresh**: Improved GitHub sync logic to transactionally update Repos, Commits, and Activity events.

### Changed
- **Newspaper UI**: Added dynamic "Personality" button to the masthead (Admin only).
- **Prompt Logic**: Removed opinionated "forced" narratives; the AI now relies purely on raw data and the selected persona.

### Fixed
- **Timezone Sync**: Fixed discrepancy where "Today's Commits" often missed late-night activity due to UTC drift.

## [2.1.0] - 2026-01-13

### Added
- **Premium Mobile Navigation**: Staggered link animations, backdrop blur, and page-aware theme mapping (Paper/News/Default).
- **Terminal Touch Helpers**: Added virtual buttons (UP, DOWN, TAB, CLS) for mobile terminal ergonomics.
- **Mobile Action Bar**: Dedicated sticky bar for Resume page with theme-aware PDF download and section jump menu.

### Changed
- **Mobile-First Layout**: Hero section now prioritizes animations over text on small screens.
- **Skills Section**: Reduced fade gradients on mobile for better visibility of active skills.
- **Project Cards**: Switched to `aspect-video` on mobile for better content fitting.
- **Identity Styling**: Standardized header identity text to use global theme behavior for better readability.

### Fixed
- **Resume Layout**: Restored desktop button structure and fixed hover color inversion (Token Sync).
- **Theming**: Resolved several theme-awareness regressions in Newspaper and Paper modes across different device types.
- **Overflow Issues**: Applied global `overflow-x-hidden` to prevent accidental horizontal scrolling on mobile.

## [2.0.1] - 2025-12-30

### Fixed
- **Robust Error Handling**: Added `try/catch/finally` to Newspaper and Resume fetchers.
- **React Safety**: Fixed stale closures in Terminal admin components via `useCallback`.
- **Navigation**: Enabled smooth scrolling and fixed broken footer section anchors.
- **Maintainability**: Refactored Footer and ContactLinks to data-driven patterns.

---

## [2.0.0] - 2025-12-30

### Added
- **Admin Resume Editing**: Edit intro/about sections with contentEditable.
- **Terminal Autocomplete**: Visual suggestions with Tab cycling.
- **Inline TUI Components**: Theme/font selectors in terminal flow.
- **Font Preloading**: Fira Code and JetBrains Mono via next/font.
- **Accessibility**: Aria-labels on header buttons.
- **Resume PDF Upload**: Upload via Vercel Blob.
- **Archive Modal**: Infinite scroll, month navigation.

### Changed
- **Terminal Commands**: Removed gimmicks (fortune, cowsay, sl, figlet, glitch, neofetch).
- **Mono Fonts Only**: All terminal fonts monospace.
- **Help Command**: Organized by categories.
- **Theme Colors**: Official sources (Dracula, Tokyo Night, Rosé Pine).

### Fixed
- Dead code cleanup (legacy TUI, unused imports).
- Debug console.logs removed from API routes.
- Type safety improvements.

---

## Previous Versions

### [1.7.x] - Admin Features
- Project edit modal, drag-and-drop reordering, global image toggle.

### [1.6.x] - Newspaper Mode
- Gemini AI content, edition variants, RSS feed.

### [1.5.x] - Nexus Mode
- Space station, blackhole video, wormhole portal.

### [1.0.x-1.4.x] - Core Features
- Multi-mode portfolio, GitHub integration, admin authentication.

### [0.x.x] - Foundation
- Next.js 16 setup, terminal system, theme switching, Prisma schema.

---

# Tremors Portfolio Changelog

> **Project:** Tremors Portfolio  
> **Version:** 2.1.5  
> **Last Updated:** 2026-01-13

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

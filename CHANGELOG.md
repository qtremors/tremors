# Tremors Portfolio Changelog

> **Project:** Tremors Portfolio  
> **Version:** 2.0.1  
> **Last Updated:** 2025-12-30

---

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

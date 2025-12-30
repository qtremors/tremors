# Changelog

All notable changes to Tremors Portfolio are documented here.

---

## [2.0.1] - 2025-12-30

### 💎 PR Review Refinements
- **Robust Error Handling**: Added `try/catch/finally` to Newspaper and Resume fetchers.
- **React Safety**: Fixed stale closures in Terminal admin components via `useCallback`.
- **Navigation**: Enabled smooth scrolling and fixed broken footer section anchors.
- **Maintainability**: Refactored Footer and ContactLinks to data-driven patterns.

---

## [2.0.0] - 2025-12-30

### 🚀 Major Release

Consolidates v1.9.x improvements into a stable major release with terminal enhancements, admin features, and code cleanup.

### Includes
- v1.9.6: Terminal autocomplete, inline TUI components
- v1.9.5: Resume PDF upload, archive modal, AI locations
- v1.9.1: Resume page improvements, configurable content
- v1.9.0: UI polish - hero text, footer, dotted bg
- v1.8.5: Rich newspaper context + fix mode names
- v1.8.0: Admin panel improvements, validation fixes

### Added
- **Admin Resume Editing** - Edit intro/about sections with contentEditable
- **Terminal Autocomplete** - Visual suggestions with Tab cycling
- **Inline TUI Components** - Theme/font selectors in terminal flow
- **Font Preloading** - Fira Code and JetBrains Mono via next/font
- **Accessibility** - Aria-labels on header buttons
- **Resume PDF Upload** - Upload via Vercel Blob
- **Archive Modal** - Infinite scroll, month navigation

### Changed
- **Terminal Commands** - Removed gimmicks (fortune, cowsay, sl, figlet, glitch, neofetch)
- **Mono Fonts Only** - All terminal fonts monospace
- **Help Command** - Organized by categories
- **Theme Colors** - Official sources (Dracula, Tokyo Night, Rosé Pine)

### Fixed
- Dead code cleanup (legacy TUI, unused imports)
- Debug console.logs removed from API routes
- Type safety improvements

---

## Previous Versions

### v1.7.x - Admin Features
Project edit modal, drag-and-drop reordering, global image toggle

### v1.6.x - Newspaper Mode
Gemini AI content, edition variants, RSS feed

### v1.5.x - Nexus Mode
Space station, blackhole video, wormhole portal

### v1.0.x-v1.4.x - Core Features
Multi-mode portfolio, GitHub integration, admin authentication

### v0.x.x - Foundation
Next.js 16 setup, terminal system, theme switching, Prisma schema

---

> For detailed older changelogs, see git history.

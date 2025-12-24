# Changelog

All notable changes to the Tremors Portfolio project are documented in this file.

---

## [1.7.0] - 2025-12-24

### Changed
- **Route Renames** - Cleaner, shorter URLs:
  - `/paper` → `/resume` (folder and all references)
  - `/newspaper` → `/news` (folder and all references)
- **Transparent UI** - Glassmorphism effect across components:
  - Hero code block, project cards, activity cards now use transparent backgrounds with `backdrop-blur`
  - Footer made transparent to blend with page instead of separate block
- **Page Titles** - Updated metadata: "Paper Mode" → "Resume", "Newspaper Mode" → "News"

### Added
- **ModeErrorBoundary** on Resume page - Consistent error handling across all modes
- **CSP media-src** - Added `media-src 'self' blob:` for Nexus video support

### Fixed
- **ProjectsGrid useEffect** - Added missing `toast` dependency to prevent stale closures
- **Header accessibility** - Added `alt="Tremors logo"` to logo images
- **Header consistency** - Mobile now uses same alien.svg logo as desktop

### Refactored
- **ProjectEditModal** - Extracted from ProjectsGrid into dedicated component (reduced ~80 lines)

### Documentation
- Updated README version reference to v1.7.0
- Added CHANGELOG links for v1.0.0 - v1.7.0
- Cleaned up TASKS.md with resolved issues summary

---

## [1.6.0] - 2025-12-23

### Added
- **Scroll-Triggered Nav Buttons** - Hero section buttons (Projects, News, Resume) animate into the navbar when scrolled out of view
  - Uses Framer Motion `layoutId` for smooth position animation
  - Navbar buttons appear with subtle blur backdrop
  - Early trigger at 50px before buttons leave viewport
- **Projects View Toggle** - Admin can switch between Grid and List view layouts
  - Toggle visible only in edit mode
  - View preference persisted in database (`projectViewMode` setting)
  - List view shows horizontal cards with thumbnail on left, content on right
- **NavButtonsContext** - New React context for sharing button visibility state between HeroSection and Header

### Changed
- **Hero Section Buttons** - Refactored to use Framer Motion components with `layoutId` for smooth transitions
- **Header Component** - Now displays animated nav buttons in center when in "default" mode and buttons are scrolled
- **ProjectCard Component** - Added `size="list"` variant for horizontal layout
- **Loading Skeleton** - Updated hero skeleton to match new layout with three navigation buttons
- **Settings API** - Extended to handle `projectViewMode` field

### Technical
- `NavButtonsContext.tsx` - New context provider for `showInHeader` state
- `schema.prisma` - Added `projectViewMode` field to Settings model
- `layout.tsx` - Wrapped app with `NavButtonsProvider`
- `HeroSection.tsx` - Added intersection observer for scroll detection
- `ProjectCard.tsx` - Added list view layout with horizontal card design

---

## [1.5.3] - 2025-12-23

### Added
- **Project Card Images** - Projects now display preview images with 3 source options:
  - GitHub OpenGraph (auto-fetched)
  - Custom URL (from `/public` or external)
  - None (disable image)
- **Global Image Toggle** - Admin can toggle all project images on/off
- **Scheduled Auto-Refresh** - Cron job refreshes GitHub data at 12AM IST
- **Settings API** - New `/api/admin/settings` endpoint for showProjectImages persistence
- **Cron API** - New `/api/cron/refresh` endpoint for scheduled updates
- **New Tests** - `settings.test.ts` with 8 tests for Settings API

### Fixed
- **Activity Refresh Bug** - Removed Next.js ISR caching (`revalidate`) from GitHub API calls
  - Data now only updates when admin clicks refresh or cron runs
  - Changed all fetch calls to `cache: "no-store"`
- **Global Toggle Persistence** - Settings now save/load from database, not local state

### Changed
- **Image Display** - Uses 2:1 aspect ratio with `object-contain` (no cropping)
- **Admin Edit Modal** - Added image source dropdown and custom URL input

### Technical
- `vercel.json` - Cron schedule: `30 18 * * *` (12AM IST)
- `route.ts` (cron) - Secured with CRON_SECRET env variable
- `route.ts` (settings) - GET/PATCH for showProjectImages, availableForWork
- `github.ts` - All fetch calls use `cache: "no-store"`

---

## [1.5.2] - 2025-12-23

### Added
- **Skip Link for Accessibility** - Keyboard/screen reader users can now skip to main content
- **Contact Form Modal** - Footer "Send a Message" button opens contact form with mailto fallback
- **Project Name Editor** - Admin can edit custom names/descriptions via pencil icon in edit mode
- **Reset Button** - Project editor allows resetting to original GitHub data
- **New Tests** - 14 new tests added (89 total):
  - `github.test.ts` - Tests for LANGUAGE_COLORS constant
  - `activity.test.ts` - Tests for event conversion utilities
- **Shared Activity Utility** - Created `src/lib/activity.ts` for event-to-activity conversion
- **useTerminalAdmin Hook** - Extracted admin auth logic from TerminalPage for better modularity
- **ModeErrorBoundary for Nexus** - Added error boundary with purple theme to Nexus mode

### Changed
- **Footer Overhaul** - Removed "Mode" suffix, removed "Built with Next.js", added contact button
- **Theme Improvements** - Added inverted accent CSS variables for buttons and cards
  - `--btn-bg`, `--btn-text`, `--btn-hover` for theme-aware buttons
  - `--card-bg`, `--card-border`, `--card-text` for subtle card contrast
- **Project Card Titles** - Auto-formatted from kebab-case to Title Case
- **View Projects Button** - Uses cyan accent with proper contrast
- **Test File Organization** - Consolidated all 11 test files in `src/__tests__/`
- **Nexus Image Alt Text** - Improved for better accessibility
- **README Clone URL** - Fixed incorrect GitHub URL

### Removed
- **git_commits.txt** - Removed dev artifact from repository

### Technical
- `ContactModal.tsx` - New component for contact form
- `activity.ts` - Shared `eventToActivityItem()` and `eventToDbActivity()` functions
- `useTerminalAdmin.ts` - Hook for terminal admin authentication flow
- `formatProjectTitle()` - Utility for converting repo names to readable titles
- Removed ~60 lines of duplicate code from `data.ts` and `refresh/route.ts`

---

## [1.5.1] - 2025-12-22

### Changed
- **Database Migration** - Switched from SQLite to Neon PostgreSQL for both local and production
  - Added `directUrl` support in Prisma schema for connection pooling
  - Increased transaction timeout to 30s for cloud database operations
- **Skills Section Update** - Reorganized into 5 categories:
  - Frontend: HTML, CSS, Tailwind, JavaScript, TypeScript, React
  - Backend: Python, Django, FastAPI, SQLite, Prisma, PostgreSQL
  - Data: NumPy, Pandas, Matplotlib, Plotly, BeautifulSoup, Streamlit
  - AI/ML: TensorFlow, scikit-learn, OpenCV, Gemini API
  - Tools: Git, GitHub, VS Code, Jupyter, Docker, Linux, Windows

### Fixed
- **GitHub Refresh** - Deleted repos are now properly removed from database on refresh
  - Previously only upserted repos, now deletes repos not in GitHub response
- **Transaction Timeout** - Added `maxWait: 10s` and `timeout: 30s` for cloud DB operations

---

## [1.5.0] - 2025-12-22

### Added
- **Nexus Mode** (`/nexus`) - Interactive space-themed landing page
  - Central space station with deployable spaceship links (Paper, Terminal, Newspaper)
  - Multi-layered backgrounds: blackhole video, moon surface, starfield
  - tsParticles with particle absorber effect
  - Voyager probe animation via CSS offset-path
  - Wormhole portal linking to external portfolio (`qtremors.github.io`)
  - Framer Motion animations for smooth spaceship enter/exit
- **Blackhole Portal Icon** - Added to navbar with glow effect and rotation animation on hover
- **Keyboard Shortcut** - `Ctrl + Alt + X` to navigate to Nexus mode

### Changed
- **Navbar** - Made fully transparent across all pages
- **Footer** - Added Nexus link with Rocket icon
- **Resume Link** - Now points to external portfolio resume

### Technical
- `StarsBackground` - Interactive particle system with absorber plugin
- `BlackholeBackground` - Looping video background
- `PlanetBackground` - Moon surface with parallax effect
- `Voyager` - CSS offset-path animation
- `Hero` - Space station with spaceship deployment using `router.push`

---

## [1.0.0] - 2025-12-22 🚀

**First Public Release on Vercel!**

### Added
- **Custom Hooks** - Created `useAdminAuth`, `useFetch`, and `useApiMutation` hooks in `src/hooks/`
- **Mode Error Boundaries** - `ModeErrorBoundary` component with mode-specific styling
- **Newspaper Sub-Components** - Extracted `NewspaperMasthead`, `NewspaperTicker`, `NewspaperArchive`
- **Test Coverage** - Added 4 new test files (75 total tests):
  - `api-auth.test.ts` - API authentication tests
  - `terminal-commands.test.ts` - Command execution tests
  - `drag-drop.test.ts` - Drag-drop reordering tests
  - `newspaper-edition.test.ts` - Edition loading tests

### Fixed
- **Error Handling** - All catch blocks now use toast notifications consistently
- **Drag-Drop Feedback** - Enhanced visual feedback with scale, rotate, shadow, ring effects
- **Mobile Footer** - Larger touch targets on mobile devices
- **Newspaper Skeleton** - Proper skeleton UI for AI-generated headlines
- **Archive Dropdown** - Click-outside detection to close dropdown
- **Type Imports** - Fixed duplicate type re-exports from `github.ts`

### Changed
- **Branding** - Replaced "Aman Singh" with "Tremors" throughout codebase
- **Documentation** - Cleaned up README, AGENTS.md, TASKS.md
- **DATA_LIMITS** - Centralized magic numbers in `site.ts` config

### Removed
- Duplicate CSS marquee keyframes
- Dead code comments in `commands.ts`

---

## [0.9.6] - 2025-12-21

### Changed
- **Repository Restructuring** - Next.js app moved to `/app` subfolder
- **Documentation** - Moved `CHANGELOG.md`, `AGENTS.md`, `TASKS.md` to repository root
- **README** - Merged redirect notice with full portfolio documentation
- **Package name** - Renamed from `app` to `tremors-portfolio`

### Added
- **Root `.gitignore`** - Comprehensive ignore rules for the monorepo structure
- **Simplified app README** - Points to main docs at root

### Fixed
- **Git history cleanup** - Removed incorrectly tracked database files
- **Environment files** - Ensured `.env` and `.env.local` are ignored, `.env.example` is tracked

---

## [0.9.5] - 2025-12-21

### Changed
- **Component Refactoring** - ProjectsGrid split into ProjectCard sub-component (560→280 lines)

### Added
- **Expanded Test Coverage** - ProjectCard.test.ts, csrf.test.ts (31 tests total)

---

## [0.9.4] - 2025-12-21

### Fixed
- **Rate limit memory leak** - added periodic cleanup of expired IP records
- **Resize event listener leak** - proper cleanup in HeroSection useEffect
- **SessionStorage cache** - now clears on logout/session expiry
- **IP fallback** - improved rate limit isolation for unknown IPs
- **Empty catch blocks** - added clarifying comments
- **Auth secret fallback** - improved key derivation with multiple env vars
- **API caching** - added Cache-Control headers to stats endpoint

### Changed
- **Floating particles performance** - visibility-based pause, reduced particle count/density
- **Activity caching** - new Activity model, cached in database on refresh

---

## [0.9.3] - 2025-12-21

### Added
- **AI Newspaper Content System**
  - Gemini API integration (`gemini-flash-lite-latest` model)
  - `NewspaperEdition` database model with variant support
  - `/api/newspaper/generate` - GET active, POST generate new (admin)
  - `/api/newspaper/editions` - list all for archive dropdown
  - `/api/newspaper/active` - set edition as today's active (admin)
  - Archive dropdown with collapsible date folders
  - Admin-only Fallback folder with red styling
  - "Use" button to set any variant as active
  - Fallback content when AI unavailable
  - `prisma/seed-newspaper.ts` - seed fallback editions

---

## [0.9.2] - 2025-12-21

### Added
- **Newspaper Mode Redesign**
  - Editorial masthead with date and tagline
  - Activity ticker with icons and seamless infinite loop (40s)
  - Two-column text layout with drop cap
  - Stats block (Public Repos, Total Commits from GitHub API)
  - Projects data table with Topics column and Live links
  - Horizontal skills layout by category
  - Theme toggle (Light/Dark Edition) in masthead
  - Fixed back button (top left, shifts down for admin navbar)
- **Live Commit Counter API** (`/api/stats/commits`)
  - Fetches exact commit count from all repos using Link header trick
  - Parallel fetching with `Promise.allSettled`
  - Shows loading spinner then exact total

---

## [0.9.1] - 2025-12-21

### Added
- **Activity Show More** - progressive reveal of 10 items at a time with fade animation
- **Projects Show More/Less** - expandable project grid

---

## [0.9.0] - 2025-12-21

### Added
- **Commit Caching** - commits stored in database, no GitHub API on page load
- **Automated Testing** - Vitest framework with 21 tests (auth, sanitize, utils)
- **Admin Editable Availability** - click code block in edit mode to toggle True/False
- **Content-Matching Skeleton Loaders** - for Default, Paper, Newspaper, Terminal modes

---

## [0.8.8] - 2025-12-21

### Changed
- **UI Polish** - admin edit mode improvements
- **Edit Mode Button** - now shows checkmark (green) when active, pencil when inactive
- **Mobile Edit Button** - consistent green color and Check icon

---

## [0.8.7] - 2025-12-20

### Changed
- **DefaultPage Refactoring** - extracted into section components (A-002)
- **Reusable Components**
  - `ContactLinks.tsx` - 3 variants (default, paper, icons-only)
  - `SkillsList.tsx` - 4 variants (default, grouped, pills, inline)

---

## [0.8.6] - 2025-12-20

### Changed
- Updated CHANGELOG, AGENTS, README with session changes

---

## [0.8.5] - 2025-12-20

### Added
- **CSRF Protection** (`src/lib/csrf.ts`) - origin/referer validation for APIs
- **Input Sanitization** (`src/lib/sanitize.ts`) - XSS prevention for terminal

---

## [0.8.4] - 2025-12-20

### Fixed
- **Hydration error** - nested anchor tags in project cards resolved

---

## [0.8.3] - 2025-12-20

### Changed
- TASKS.md updated - all core tasks marked complete

---

## [0.8.2] - 2025-12-20

### Changed
- **Simplified Admin UI** - removed AdminPanel modal, replaced with Edit/Refresh buttons in navbar
- Admin context uses `editMode` instead of `showAdminPanel`

### Removed
- `AdminPanel.tsx` component (replaced with inline navbar controls)

---

## [0.8.1] - 2025-12-20

### Changed
- **Type Consolidation** - all types now centralized in `src/types/index.ts`
- **Type Imports** - `commands.ts` and `github.ts` now import types from `@/types`

### Removed
- Duplicate `GitHubCommit` interface from `github.ts`

---

## [0.8.0] - 2025-12-20

### Added
- **Global Toast Notification System** - success/error/info/warning toasts
- **Error Boundaries** - graceful error handling across the app

---

## [0.7.7] - 2025-12-20

### Changed
- TASKS.md cleanup and reorganization

---

## [0.7.6] - 2025-12-20

### Changed
- **Theme toggle icon** - now shows target state (Sun in dark mode, Moon in light)
- Demo/homepage link added to project cards

---

## [0.7.5] - 2025-12-20

### Fixed
- **MatrixRain performance** - animation pauses when tab is hidden (P-005)

---

## [0.7.4] - 2025-12-20

### Added
- UX improvements and accessibility enhancements
- **Project Card Enhancements**
  - Featured project title highlights cyan on card hover
  - Website link with icon on featured cards
  - Tech topics displayed on all card types

---

## [0.7.3] - 2025-12-20

### Changed
- **Cached admin status check** - reduced API calls (B-004)

---

## [0.7.2] - 2025-12-20

### Added
- `/shortcuts` command for keyboard shortcut discovery

### Changed
- Cleanup of unused code

---

## [0.7.1] - 2025-12-20

### Fixed
- Centralized topics parsing
- Popup blocker handling improvements

---

## [0.7.0] - 2025-12-20

### Added
- **Font TUI Selector** - `/font` now opens modal like `/theme`

### Removed
- Unused `ModeSwitcher.tsx` component
- Unused public assets
- Unused contract animation CSS

---

## [0.6.4] - 2025-12-20

### Changed
- Documentation cleanup and improvements

---

## [0.6.3] - 2025-12-20

### Fixed
- Config values and database consistency
- DefaultPage social links now use CONTACT_LINKS from config

---

## [0.6.2] - 2025-12-20

### Added
- **Secure Admin Authentication System**
  - HMAC-signed session tokens (cryptographically secure)
  - PBKDF2 password hashing with 100,000 iterations
  - Rate limiting (5 attempts per 15 minutes)
  - Timing-safe password comparison (`crypto.timingSafeEqual()`)
  - Admin model in database for storing hashed passwords
  - First-time setup TUI for creating admin account

### Security
- Fixed insecure base64 session tokens (now HMAC-signed)
- Removed plain text password from environment variables

---

## [0.6.1] - 2025-12-20

### Added
- Cookie-based admin authentication

### Fixed
- Various bug fixes for admin functionality

---

## [0.6.0] - 2025-12-20

### Added
- **Admin CMS Features**
  - Inline admin controls on project cards
  - Keyboard shortcuts for modes (Ctrl+`, Ctrl+Alt+P, Ctrl+Alt+N)
  - Session persistence across page navigations
  - Admin Panel for repository management

---

## [0.5.1] - 2025-12-18

### Added
- **MatrixRain Component** - screensaver effect for terminal mode
- Updated terminal and CSS styles

---

## [0.5.0] - 2025-12-18

### Added
- Comprehensive TASKS.md with 67 findings from deep code review

---

## [0.4.0] - 2025-12-17

### Added
- **Terminal Enhancements**
  - Theme and font persistence in localStorage
  - Command history navigation (↑/↓ arrows)
  - Tab autocomplete for commands
- **Fun Commands**
  - `/cmatrix` - Matrix screensaver toggle
  - `/sl` - Steam locomotive ASCII art
  - `/figlet` - ASCII art text
- **Visual Effects** (placeholders)
  - `/crt` - CRT scanline effect
  - `/glitch` - Glitch effect on ASCII logo
- **Utilities**
  - `/export` - Copy session to clipboard
  - `/repo` - Open repository in browser

---

## [0.3.2] - 2025-12-17

### Fixed
- CommandItem uses colors prop correctly (instead of undefined theme)

---

## [0.3.1] - 2025-12-17

### Added
- **TUI Theme Selector**
  - Arrow key navigation (↑/↓)
  - Three themes: Dracula, Tokyo Night, Rosé Pine
  - Enter to select, Esc to cancel
  - All UI elements use dynamic theme colors

---

## [0.3.0] - 2025-12-17

### Added
- **Terminal Commands**
  - `/commands` - Show all available commands
  - `/theme` dark|light|rosepine - Change terminal colors
  - `/font` mono|sans|serif - Change terminal font
  - `/screensaver` - Toggle matrix effect
  - `/neofetch` - System info display
  - `/fortune` - Random developer quotes
  - `/cowsay` - ASCII cow art
  - `/date` - Current time
  - `/history` - Command history
  - `echo` - Echo text
- Dynamic theming applies to all UI elements

---

## [0.2.2] - 2025-12-17

### Changed
- **Real Terminal UX**
  - ASCII logo always visible at top of scrollable area
  - Output lines grow below, pushing content naturally
  - Input area fixed at bottom like real terminal
  - Smart error shake: ASCII shakes if visible, input if scrolled

---

## [0.2.1] - 2025-12-17

### Changed
- Terminal UI polish
- Removed input outline
- Added error shake animation

---

## [0.2.0] - 2025-12-17

### Changed
- **Terminal UI Refinement**
  - Cleaner input design
  - Minimal status bar
  - Floating ASCII logo

---

## [0.1.2] - 2025-12-17

### Fixed
- Replaced remaining emojis with Lucide icons in Newspaper contact section

---

## [0.1.1] - 2025-12-17

### Changed
- **Paper Mode Styling**
  - Inverted colors (light background #fafafa, dark text)
  - Blue accents
- Replaced all emojis with Lucide icons throughout app

---

## [0.1.0] - 2025-12-17

### Added
- **Multi-Mode Portfolio**
  - **Default Mode**: Modern card-based layout with animated hero
  - **Paper Mode**: Document/resume style with sidebar TOC
  - **Newspaper Mode**: Editorial layout with masthead and columns
  - **Terminal Mode**: Interactive CLI with admin access
- Fullscreen sub-pages with themed back navigation
- **GitHub Integration**
  - Repository fetching and caching
  - User stats display
  - Activity feed
- **Theming**
  - Dark/light mode support
  - CSS variables for customization
  - Theme toggle in header

---

## [0.0.0] - 2025-12-17

### Added
- Initial project setup with Create Next App
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 integration
- Prisma ORM setup with SQLite

---

[Unreleased]: https://github.com/qtremors/tremors/compare/v1.7.0...HEAD
[1.7.0]: https://github.com/qtremors/tremors/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/qtremors/tremors/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/qtremors/tremors/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/qtremors/tremors/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/qtremors/tremors/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/qtremors/tremors/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/qtremors/tremors/compare/v0.9.6...v1.0.0
[0.9.6]: https://github.com/qtremors/tremors/compare/v0.9.5...v0.9.6
[0.9.5]: https://github.com/qtremors/tremors/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/qtremors/tremors/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/qtremors/tremors/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/qtremors/tremors/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/qtremors/tremors/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/qtremors/tremors/compare/v0.8.8...v0.9.0
[0.8.8]: https://github.com/qtremors/tremors/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/qtremors/tremors/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/qtremors/tremors/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/qtremors/tremors/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/qtremors/tremors/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/qtremors/tremors/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/qtremors/tremors/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/qtremors/tremors/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/qtremors/tremors/compare/v0.7.7...v0.8.0
[0.7.7]: https://github.com/qtremors/tremors/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/qtremors/tremors/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/qtremors/tremors/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/qtremors/tremors/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/qtremors/tremors/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/qtremors/tremors/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/qtremors/tremors/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/qtremors/tremors/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/qtremors/tremors/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/qtremors/tremors/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/qtremors/tremors/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/qtremors/tremors/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/qtremors/tremors/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/qtremors/tremors/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/qtremors/tremors/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/qtremors/tremors/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/qtremors/tremors/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/qtremors/tremors/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/qtremors/tremors/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/qtremors/tremors/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/qtremors/tremors/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/qtremors/tremors/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/qtremors/tremors/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/qtremors/tremors/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/qtremors/tremors/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/qtremors/tremors/releases/tag/v0.0.0


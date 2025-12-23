# TASKS.md - Tremors Portfolio

> **Last Updated**: December 23, 2025  
> **Version**: 1.5.3 | **Status**: 🔍 Deep Review Completed

---

## 📊 Project Health Summary

| Area | Status | Notes |
|------|--------|-------|
| Security | ✅ Excellent | HMAC sessions, PBKDF2, CSRF, CSP, XSS prevention, rate limiting |
| Architecture | ✅ Solid | Modular components, custom hooks, clear separation |
| Testing | ✅ Good | 12 test files, 97 tests |
| Documentation | ✅ Comprehensive | AGENTS.md, README.md, CHANGELOG.md |
| Performance | ✅ Good | DB caching, optimized images, proper timeouts |
| UI/UX | ✅ Polished | Multi-mode, responsive, accessible (skip links) |

---

## 🐛 Issues Found (December 23, 2025 Deep Review)

### High Priority

#### H-001: Package.json Version Mismatch
- **File**: `app/package.json` (line 3)
- **Issue**: Version shows `1.5.0` but CHANGELOG latest is `1.5.3`
- **Impact**: Misleading version in build metadata
- **Fix**: Update `"version": "1.5.0"` to `"version": "1.5.3"`

#### H-002: Header currentMode Type Missing "nexus"
- **File**: `src/components/Header.tsx` (line 17-18)
- **Issue**: `HeaderProps.currentMode` type is `"default" | "paper" | "newspaper" | "terminal"` but should include `"nexus"`
- **Impact**: TypeScript type mismatch when rendering Nexus page
- **Fix**: Add `"nexus"` to the union type

---

### Medium Priority

#### M-001: ProjectsGrid Missing `toast` in useEffect Dependencies
- **File**: `src/components/ProjectsGrid.tsx` (line 85)
- **Issue**: `useEffect` that calls `toast.error()` doesn't include `toast` in deps array
- **Impact**: ESLint warning, potential stale closure (though unlikely here)
- **Fix**: Add `toast` to dependency array or wrap in useCallback

#### M-002: Prisma Scripts in Git Repository
- **File**: `prisma/clean-editions.ts`, `prisma/delete-empty-today.ts`
- **Issue**: Development utility scripts are tracked in git and visible in production
- **Impact**: Exposes internal tooling; clutters codebase
- **Fix**: Either add to `.gitignore` or move to a `scripts/` folder at root

#### M-003: Inconsistent Logo Between Desktop and Mobile Header
- **File**: `src/components/Header.tsx` (lines 57-58, 122)
- **Issue**: Desktop uses `/alien.svg` image, mobile uses `Terminal` Lucide icon
- **Impact**: Inconsistent branding across breakpoints
- **Fix**: Use same logo on both breakpoints

#### M-004: CONTACT_LINKS Uses Emoji Icons Instead of Lucide
- **File**: `src/config/site.ts` (lines 19-44)
- **Issue**: Contact links use emoji icons (`📧`, `🐙`, `💼`, `📄`) while rest of app uses Lucide
- **Impact**: Inconsistent icon system; emojis render differently across platforms
- **Note**: Footer already uses `socialIcons` map with Lucide icons - this is only used in terminal

#### M-005: Missing Error Boundary on Paper Mode
- **File**: `src/app/paper/`
- **Issue**: No `ModeErrorBoundary` wrapper on Paper mode page (Nexus, Newspaper have them)
- **Impact**: Unhandled errors crash the entire app
- **Fix**: Add `<ModeErrorBoundary mode="paper">` wrapper

---

### Low Priority

#### L-001: Missing Alt Text on Logo Images
- **File**: `src/components/Header.tsx` (line 58)
- **Issue**: `<img src="/alien.svg" alt="">` has empty alt text
- **Impact**: Screen readers skip image; accessibility issue
- **Fix**: Add meaningful alt text like `alt="Tremors logo"`

#### L-002: Hardcoded External URLs
- **Files**: `Header.tsx` (line 94), various components
- **Issue**: External portfolio URL `https://qtremors.github.io` hardcoded in multiple places
- **Impact**: Difficult to update if URL changes
- **Fix**: Add to `CONTACT_LINKS` config and reference from there

#### L-003: Unused `SectionConfig` Type
- **File**: `src/types/index.ts` (lines 145-150)
- **Issue**: `SectionConfig` interface is defined but `SECTIONS` in site.ts isn't consuming it in components
- **Impact**: Dead code/unused type
- **Note**: Likely intended for future section reordering feature

#### L-004: Missing `media-src` in CSP
- **File**: `app/next.config.ts` (line 12-22)
- **Issue**: Content-Security-Policy missing `media-src` directive (needed for Nexus blackhole video)
- **Impact**: Video may be blocked in strict CSP environments
- **Fix**: Add `media-src 'self' blob:` to CSP headers

#### L-005: Cron Schedule Comment Could Be Clearer
- **File**: `app/vercel.json` (line 5)
- **Issue**: Schedule `"30 18 * * *"` (18:30 UTC = 12:00 AM IST) lacks documenting comment
- **Impact**: May confuse future developers about timezone
- **Fix**: Add comment in AGENTS.md or README explaining the schedule

#### L-006: No Loading State for Nexus Mode
- **File**: `src/app/nexus/page.tsx`
- **Issue**: Unlike Paper/Newspaper, Nexus has no `loading.tsx` skeleton
- **Impact**: Flash of unstyled content on slow connections
- **Note**: User previously confirmed this is intentional behavior

---

### Documentation Issues

#### D-001: AGENTS.md Mentions 12 Test Files but Lists 11
- **File**: `AGENTS.md` (line 120-131)
- **Issue**: Comment says "12 files, 97 tests" but file list shows 11 files
- **Impact**: Minor documentation inaccuracy
- **Fix**: Verify actual count and update

#### D-002: README Version Reference Outdated
- **File**: `README.md` (line 491)
- **Issue**: References "CHANGELOG.md (v0.0.0 - v0.9.5)" but changelog goes to v1.5.3
- **Impact**: Outdated documentation
- **Fix**: Update to reflect current version range

#### D-003: CHANGELOG Missing Link References for Recent Versions
- **File**: `CHANGELOG.md` (lines 603-645)
- **Issue**: Version comparison links at bottom stop at `[0.9.6]`, missing 1.0.0 through 1.5.3
- **Impact**: Incomplete changelog navigation
- **Fix**: Add remaining version comparison links

---

### Code Quality

#### Q-001: Large ProjectsGrid Component
- **File**: `src/components/ProjectsGrid.tsx` (534 lines)
- **Issue**: Component is large with many responsibilities (drag-drop, edit modal, visibility toggle)
- **Impact**: Hard to maintain; could benefit from further decomposition
- **Suggestion**: Extract edit modal into `ProjectEditModal.tsx`

#### Q-002: Duplicate Topics Parsing Logic Comment
- **File**: Multiple files reference "centralized utility"
- **Issue**: Topics parsing is well centralized in `utils.ts`, but comments are verbose
- **Impact**: None, just code cleanliness

---

## ✅ Resolved Issues (Previous Reviews)

All identified issues from previous comprehensive code reviews have been addressed:

### High Priority — Completed
- **D-004**: Fixed README clone URL (`github.io` → `github.com`)
- **DC-003**: Removed `git_commits.txt` dev artifact

### Medium Priority — Completed
- **B-001**: Added `ModeErrorBoundary` to Nexus mode with purple theme
- **A-003**: Created shared `activity.ts` utility (removed ~60 lines duplicate code)
- **T-003**: Consolidated all test files in `src/__tests__/` (moved 5 files)

### Low Priority — Completed
- **U-003**: Added skip link for keyboard/screen reader accessibility
- **U-004**: Improved Nexus image alt text for better accessibility
- **T-002**: Expanded test coverage (+14 tests: `github.test.ts`, `activity.test.ts`)
- **A-002**: Created `useTerminalAdmin` hook for better modularity

---

## 🔮 Future Improvements

Low priority items that can be addressed later:

### Performance
- **P-001**: PostgreSQL-based rate limiting for serverless environments
  - Current in-memory rate limiting works but doesn't persist across Vercel invocations
  - Not critical for personal portfolio (admin secret + PBKDF2 provide adequate protection)

### Features
- **F-001**: Section reordering via drag-drop on DefaultPage
  - `SECTIONS` config exists but isn't yet used for dynamic ordering
- **F-002**: Resume PDF upload via admin panel
  - Currently points to external URL

---

## 📁 Project Structure

```text
app/src/
├── __tests__/       # 12 test files (97 tests)
├── app/             # Next.js pages
├── components/      # 14 reusable components
├── config/          # Site configuration
├── hooks/           # 3 custom hooks (4 exports)
├── lib/             # 8 utility files
└── types/           # TypeScript types
```

See `AGENTS.md` for complete project knowledge.

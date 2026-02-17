# Tremors Implementation Tasks

> **Project:** Tremors  
> **Version:** 2.2.3
> **Last Updated:** 2026-02-17

---

## ⚡ Quick Fixes
*Low effort, high impact changes that can be addressed immediately.*

- [ ] **Auth Status**: Change "Invalid credentials" response from 200 to 401 in `api/auth/route.ts`.
- [ ] **Type Safety**: Replace `any` with `Repo` type in `ProjectsGrid.tsx`.
- [ ] **Hardcoded Version**: Replace "v2.0" with `APP_VERSION` in `TerminalWelcome.tsx`.
- [ ] **Cleanup**: Delete unused `twentyFourHoursAgo` constant in `newspaper/generate/route.ts`.
- [ ] **Unused Parameter**: Remove `idx` from map callback in `SpotlightSection.tsx`.
- [ ] **CSS Cleanup**: Remove redundant `flex` (keep `inline-flex`) in `ProjectsTable.tsx`.
- [ ] **Markdown Lint**: Fix list indentation in `CHANGELOG.md`.

---

## 🔴 High Priority
*Critical security or architectural tasks.*

- [ ] **Database Typing**: Migrate `Repo.topics` from JSON string to `JSONB` for better querying.
- [ ] **Auth Secret Incorporation**: Update `lib/auth.ts` to incorporate provided short secrets into derived keys.
- [ ] **Admin Safety**: Check `res.ok` before parsing JSON in `AdminContext.tsx` to prevent state corruption.
- [ ] **Security (Middleware)**:
    - [ ] Replace UA-based fallback with hashed anonymous ID (SHA-256 + salt).
    - [ ] Fix Key Collision: Use exact routes from config for rate limit keys.

---

## 🔍 Active Investigations & Logic
*Bugs or improvements identified in recent reviews.*

- [ ] **Relative Time Sync**: Audit `ProjectCard` for hydration mismatches.
- [ ] **Test Refactor**: Use structured helper/timestamp in `auth.test.ts` instead of manual manipulation.
- [ ] **Border Conflicts**: Resolve `TechnicalProficiencies.tsx` border overlaps in `lg` layout.
- [ ] **Security**: Review `unsafe-inline`/`unsafe-eval` in `next.config.ts`.

---

## 🎨 UI/UX & Accessibility
*Enhancing the user experience and ensuring inclusivity.*

- [ ] **Loading States**: Add skeleton loaders to `ProjectsGrid`.
- [ ] **Accessibility**: Add `aria-live` blocks to terminal output.
- [ ] **Keyboard Navigation**: Audit modals for focus trapping.

---

## 📋 Backlog
*Future work and enhancements.*

- [ ] **SEO**: Implement dynamic meta tags for editions and projects.
- [ ] **Unit Tests**: Full coverage for `useFetch`, `SettingsContext`, and `useTerminalAdmin`.
- [ ] **Terminal Extensions**: Games (Snake/Tetris) and RSS feed metadata.

---

## 🏗️ Technical Notes
- **Dates**: Use `formatIST` from `lib/date` for server/client consistency.
- **Auth**: `verifyAdminCookie()` for APIs, `AdminContext` for client components.
- **Fetching**: `useFetch<T>(url)` for reads, `fetch`/`useApiMutation` for mutations.
- **Providers**: Use `ProviderComposer` for nested providers.


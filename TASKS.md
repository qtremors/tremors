# Tremors Implementation Tasks & Codebase Review

> **Project:** Tremors  
> **Version:** 2.2.0
> **Last Updated:** 2026-01-14

---

## 🔍 Current Findings

### 🛡️ Security
- [x] **API Rate Limiting Middleware**: Created centralized middleware at `middleware.ts`.
- [ ] **CSP Hardening**: Review `unsafe-inline`/`unsafe-eval` in `next.config.ts` (required by Next.js).

### 🏗️ Architecture
- [ ] **Database Typing**: Migrate `Repo.topics` from JSON string to `JSONB`.

### 🧪 Logic & Bugs
- [ ] **Relative Time Sync**: Audit `ProjectCard` relative time for hydration mismatches.

### 🎨 UI/UX
- [ ] **Loading States**: Add skeleton loaders to `ProjectsGrid`.
- [ ] **Accessibility**: Terminal output needs `aria-live` blocks.
- [ ] **Keyboard Navigation**: Audit modals for focus trapping.

---

## 📋 Backlog

### High Priority
- [ ] JSONB migration for `topics`

### Medium Priority
- [ ] SEO: Dynamic meta tags for editions/projects
- [ ] Unit tests for `useFetch`, `SettingsContext`, `useTerminalAdmin`

### Low Priority
- [ ] Terminal games (Snake/Tetris)
- [ ] RSS feed metadata extensions

---

## 🏗️ Technical Notes

- **Dates**: Use `formatIST` from `lib/date` for server/client consistency.
- **Auth**: `verifyAdminCookie()` for APIs, `AdminContext` for client components.
- **Fetching**: `useFetch<T>(url)` for reads, `fetch`/`useApiMutation` for mutations.
- **Providers**: Use `ProviderComposer` for nested providers.

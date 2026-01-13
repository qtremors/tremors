# Tremors Portfolio - Tasks

> **Project:** Tremors Portfolio  
> **Version:** 2.1.0  
> **Last Updated:** 2026-01-13

---

## ✅ Completed (v2.1)
- [x] **Mobile UX**: Implement premium hamburger menu with staggered animations.
- [x] **Theme Sync**: Page-aware mobile navigation (Paper/News/Default).
- [x] **Terminal**: Add virtual touch-friendly controls for mobile.
- [x] **Layout**: Restore desktop resume button and fix hover inversion.

---

## 🚧 In Progress

- [ ] **Database Optimization**: Migrating `Repo.topics` to `JSONB`.

---

## 📋 To Do

### High Priority
- [ ] **SEO**: Enhance meta tags for specific viewer modes.

### Medium Priority
- [ ] None currently.

---

## 🐛 Bug Fixes

<!-- Known bugs to fix -->

- [ ] None currently.

---

## 💡 Ideas / Future

- [ ] **Enhance Newspaper**: Add more AI personalities for generating news.
- [ ] **Terminal Games**: Add simple TUI games like Snake or Tetris.

---

## 🏗️ Architecture Notes

- **Auth**: Custom PBKDF2 implementation with HMAC-signed session tokens.
- **Database**: Prisma with NeonDB (Serverless Postgres).
- **Rendering**: Next.js App Router with React Server Components by default.

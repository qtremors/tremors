# Tremors Portfolio - Tasks

> **Project:** Tremors Portfolio  
> **Version:** 2.0.2  
> **Last Updated:** 2026-01-13

---

## ✅ Completed (v2.0)

<!-- Archived to CHANGELOG -->

---

## 🚧 In Progress

<!-- Currently being worked on -->

---

## 📋 To Do

### High Priority
- [ ] **Consistency**: Align `CHANGELOG.md` version (2.0.1) with `TASKS.md` (2.0.2).
- [ ] **Database**: Migrate `Repo.topics` and `NewspaperEdition.bodyContent` to native `JSONB` type in Postgres schema for better query performance.

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

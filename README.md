# Project Tremors

<div align="center">

![Tremors Banner](https://raw.githubusercontent.com/qtremors/tremors/main/app/public/hero-bg.jpg)

**Modern Full-Stack Portfolio & Technical Showcase**

[Live Demo](https://tremors.live) • [Report Bug](https://github.com/qtremors/tremors/issues) • [Request Feature](https://github.com/qtremors/tremors/issues)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)

</div>

---

## 🚀 Overview

Project Tremors is a high-performance, feature-rich portfolio application built with **Next.js 16**, **TypeScript**, and **Prisma**. It features multiple interactive viewing modes, real-time AI content generation, and a fully integrated terminal system.

Designed for developers, it serves as both a personal branding tool and a technical playground for experimenting with modern web technologies.

---

## ✨ Core Features

### 🖥️ Multi-Mode Interface
- **Default Mode**: Premium, modern grid layout with glassmorphism and smooth animations.
- **Terminal Mode**: Fully functional command-line interface with custom commands, autocomplete, and inline TUI components.
- **Resume Mode**: Professional paper-style resume with dynamic database-driven content and PDF export.
- **News Mode**: AI-generated newspaper (`The Daily Tremor`) using Gemini AI to summarize GitHub activity and news.
- **Nexus Mode**: Immersive 3D/Video-based experimental interface.

### 🛠️ Admin Dashboard
- **Secure Authentication**: Robust session management with CSRF protection and rate limiting.
- **Content Management**: Manage projects, featured repositories, and personal settings directly through the UI.
- **Dynamic Resume**: Edit intro and about sections in real-time with `contentEditable` and database persistence.
- **Repository Control**: Toggle visibility, featured status, and custom metadata for GitHub projects.

### 🤖 AI Integration
- **GitHub Summarizer**: Automatically generates newspaper headlines and articles based on recent git commits.
- **Fallback Content**: Graceful degradation to high-quality fallback content when AI services are unavailable.

---

## ⌨️ Terminal Commands

The terminal is a powerful core component. Here are the available commands:

| Command | Category | Description |
|---------|----------|-------------|
| `help` | System | List all available commands |
| `clear` | System | Clear the terminal screen |
| `history` | System | View command history |
| `theme` | UI | Switch between premium color schemes |
| `font` | UI | Change terminal font (Fira Code, JetBrains Mono, etc.) |
| `crt` | Effects | Toggle retro CRT scanline effect |
| `ls` | Projects | List all public repositories |
| `open [repo]` | Projects | Open a specific project page |
| `whoami` | About | View personal identification and bio |
| `social` | About | Display social media and contact links |
| `login` | Admin | Access the administrative dashboard |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router), React, Tailwind CSS |
| **Backend** | Next.js API Routes (Edge & Node.js) |
| **Database** | PostgreSQL (Production) / SQLite (Dev) via Prisma ORM |
| **AI** | Google Gemini Generative AI |
| **Animation** | Framer Motion, tsParticles |
| **Fonts** | Inter, JetBrains Mono, Playfair Display, Source Serif 4 |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 📄 Related Files

| File | Description |
|------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Project history and v2.0.1 details |
| [AGENTS.md](AGENTS.md) | Technical documentation for AI assistants |
| [TASKS.md](TASKS.md) | Bug tracking and improvement backlog |
| [app/.env.example](app/.env.example) | Environment variable template |

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Prisma](https://prisma.io) - Database ORM
- [Lucide](https://lucide.dev) - Icon library
- [Shields.io](https://shields.io) - Skill badges

---

<div align="center">

**Built with ❤️ by [Tremors](https://github.com/qtremors)**

</div>
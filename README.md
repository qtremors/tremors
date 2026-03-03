<p align="center">
  <img src="app/public/alien.svg" alt="Tremors Logo" width="120"/>
</p>

<h1 align="center"><a href="https://tremors.vercel.app">Tremors</a></h1>

<p align="center">
  A multi-mode portfolio website with GitHub integration, AI-generated content, and interactive terminal.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Personal Portfolio** 🎯 This is my personal portfolio website.

## Live Website 

**➡️ [https://tremors.vercel.app](https://tremors.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎭 **Multiple Viewing Modes** | Choose between Modern Cards, Terminal CLI, AI Newspaper, Professional Resume, or Nexus Space Landing. |
| 🔗 **GitHub Integration** | Automatically syncs repositories, stars, forks, and activity history. |
| 📰 **AI Integration** | "Skye" News Agent with 4 personalities (`Tabloid`, `Senior`, `Scholar`, `Hacker`) generates daily content based on real activity. |
| 💻 **Interactive Terminal** | Fully functional CLI with 30+ commands (`/terminal`), autocomplete, and file system navigation. |
| 🔐 **Secret Admin Mode** | CMS-style controls to manage project visibility, feature flags, and content editing. |
| 🎨 **Theming & Effects** | Multiple color schemes (Dracula, Tokyo Night), CRT scanlines, and glitch effects. |
| 📱 **Mobile-First UX** | Premium staggered navigation, touch-friendly terminal helpers, and adaptive layouts. |

---

## 🚀 Quick Start

```bash
# Clone and navigate
git clone https://github.com/qtremors/tremors.git
cd tremors/app

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Update .env.local with your credentials (GITHUB_TOKEN, DATABASE_URL, etc.)

# Run the project
npm run dev
```

Visit **http://localhost:3000**

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | `≥ 18` | [nodejs.org](https://nodejs.org/) |
| npm | `≥ 9` | Included with Node.js |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_USERNAME` | Yes | Your GitHub profile to sync |
| `ADMIN_SECRET` | Yes | Secret command for terminal admin login |
| `DATABASE_URL` | Yes | Postgres connection string (pooled) |
| `GITHUB_TOKEN` | No | GitHub PAT for higher API rate limits |
| `AUTH_SECRET` | No | Signing key for sessions (auto-generated) |
| `GEMINI_API_KEY` | No | Google AI key for News feature |

Full details in [DEVELOPMENT.md → Environment Variables](DEVELOPMENT.md#environment-variables)

---

## 🎮 Demo

### Test Credentials
| Type | Value |
|------|-------|
| **Admin Secret** | Configured in `.env.local` (default: `your_secret_command`) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | PostgreSQL, Prisma ORM 6 |
| **AI** | Google Gemini Flash |
| **Tools** | TypeScript 5, Vitest, ESLint |

---

## 📁 Project Structure

```
tremors/
├── app/                      # Next.js Application
│   ├── src/                  # Source code
│   │   ├── app/              # App Router pages & API
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities & db client
│   │   └── ...
│   ├── prisma/               # Database schema & seeds
│   ├── public/               # Static assets
│   └── ...

├── DEVELOPMENT.md            # Developer documentation
├── CHANGELOG.md              # Version history
├── LICENSE.md                # License terms
└── README.md
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, setup, API reference |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [TASKS.md](TASKS.md) | Implementation tasks and known issues |
| [LICENSE.md](LICENSE.md) | License terms and attribution |

---

## 📄 License

**Tremors Source License (TSL v1.0)** — Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

Web Version: [github.com/qtremors/license](https://github.com/qtremors/license)

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
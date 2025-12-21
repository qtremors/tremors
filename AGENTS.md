# AGENTS.md - Project Context for AI Agents

> **Purpose**: This document provides comprehensive context for AI coding assistants working on this project.

---

## 📋 Project Overview

**Name**: Tremors Portfolio Website
**Type**: Personal Portfolio / Developer Showcase
**Owner**: Aman Singh (@qtremors)
**Tech Stack**: Next.js 16 + React 19 + TypeScript + Prisma + Tailwind CSS 4

### What This Project Does

A personal portfolio website with multiple viewing modes:
1. **Default Mode** (`/`) - Modern card-based layout with GitHub data
2. **Terminal Mode** (`/terminal`) - Interactive CLI-style interface with commands
3. **Paper Mode** (`/paper`) - Document/resume-style layout with sidebar TOC
4. **Newspaper Mode** (`/newspaper`) - Editorial magazine-style layout

### Key Features

- **GitHub Integration**: Fetches repos, activity, and user data from GitHub API
- **Admin System**: Secret admin login via terminal for content management
- **Database Caching**: SQLite/Postgres for caching GitHub data with overrides
- **Theme Support**: Dark/light mode toggle with CSS variables
- **Terminal Commands**: 30+ CLI commands for navigation and fun

---

## 🗂️ Project Structure

```
tremors/                         # Repository root
├── .gitignore                   # Root gitignore for monorepo
├── README.md                    # Full project documentation
├── CHANGELOG.md                 # Version history (v0.0.0 - v0.9.6)
├── AGENTS.md                    # This file - AI agent context
├── TASKS.md                     # Bug tracking
├── index.html                   # GitHub Pages redirect (legacy)
├── tui.html                     # Terminal redirect (legacy)
│
└── app/                         # Next.js Portfolio Application
    ├── prisma/
    │   ├── schema.prisma        # Database schema (Repo, Settings, Admin)
    │   └── dev.db               # SQLite database file (gitignored)
    ├── public/                  # Static assets
    ├── src/
    │   ├── app/                 # Next.js App Router
    │   │   ├── api/             # API routes
    │   │   │   ├── admin/       # Admin-only endpoints
    │   │   │   │   ├── refresh/ # Sync repos from GitHub
    │   │   │   │   └── repos/   # CRUD for repo settings
    │   │   │   └── auth/        # Authentication endpoints
    │   │   │       ├── check/   # Verify admin session
    │   │   │       ├── logout/  # Clear session
    │   │   │       └── route.ts # Login endpoint
    │   │   ├── newspaper/       # Newspaper mode page
    │   │   ├── paper/           # Paper mode page
    │   │   ├── terminal/        # Terminal mode page
    │   │   │   ├── components/  # Terminal-specific components
    │   │   │   └── lib/         # Commands, themes, types
    │   │   ├── DefaultPage.tsx  # Main page component
    │   │   ├── globals.css      # Global styles + CSS variables
    │   │   ├── layout.tsx       # Root layout with providers
    │   │   └── page.tsx         # Home page entry
    │   ├── components/          # Shared components
    │   │   ├── AdminContext.tsx # Admin state + editMode
    │   │   ├── ErrorBoundary.tsx# Graceful error handling
    │   │   ├── Header.tsx       # Navbar with Edit/Refresh buttons
    │   │   ├── ProjectsGrid.tsx # Project cards with inline admin controls
    │   │   ├── ThemeProvider.tsx# Theme state management
    │   │   └── ToastProvider.tsx# Global toast notifications
    │   ├── config/
    │   │   └── site.ts          # Personal info, links, skills
    │   ├── lib/
    │   │   ├── auth.ts          # Cookie-based auth utilities
    │   │   ├── csrf.ts          # CSRF protection utilities
    │   │   ├── data.ts          # Data fetching orchestration
    │   │   ├── db.ts            # Prisma client singleton
    │   │   ├── github.ts        # GitHub API utilities
    │   │   ├── sanitize.ts      # Input sanitization utilities
    │   │   └── utils.ts         # Shared utilities
    │   └── types/
    │       └── index.ts         # All shared TypeScript types
    ├── .env.example             # Environment template (tracked)
    ├── .env                     # Environment variables (gitignored)
    ├── .env.local               # Local overrides (gitignored)
    ├── .gitignore               # App-specific ignores
    ├── package.json             # Dependencies
    └── tsconfig.json            # TypeScript config
```

---

## 🔧 Technical Details

### Framework Versions

| Package | Version |
|---------|---------|
| Next.js | 16.0.10 |
| React | 19.2.1 |
| TypeScript | ^5 |
| Prisma | ^6.19.1 |
| Tailwind CSS | ^4 |

### Database Schema

```prisma
model Repo {
  id          Int      @id           // GitHub repo ID
  name        String
  fullName    String   @unique
  description String?
  htmlUrl     String
  homepage    String?
  stars       Int      @default(0)
  forks       Int      @default(0)
  language    String?
  topics      String   @default("[]") // JSON array as string
  pushedAt    DateTime
  createdAt   DateTime

  // Admin controls
  hidden      Boolean  @default(false)
  featured    Boolean  @default(false)
  order       Int      @default(0)

  // Custom overrides
  customName        String?
  customDescription String?

  updatedAt   DateTime @updatedAt
}

model Settings {
  id               String   @id @default("main")
  lastRefresh      DateTime @default(now())
  availableForWork Boolean  @default(true)
  updatedAt        DateTime @updatedAt
}

// Cached commit data from GitHub
model Commit {
  sha       String   @id
  message   String
  date      DateTime
  repoName  String
  repoUrl   String
  author    String
  createdAt DateTime @default(now())
}

// Admin account - single row, password stored hashed
model Admin {
  id            String   @id @default("main")
  passwordHash  String   // PBKDF2 hash with salt
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// AI-generated newspaper content - multiple variants per day allowed
model NewspaperEdition {
  id          String   @id @default(cuid())
  date        DateTime // Multiple editions can share same date (variants)
  headline    String   // Main dramatic headline
  subheadline String   // Secondary headline
  bodyContent String   // Multi-paragraph body (stored as JSON array)
  pullQuote   String   // Featured quote
  isActive    Boolean  @default(false) // Only one active per day
  isFallback  Boolean  @default(false) // True if seed data
  generatedBy String?  // "gemini-flash-lite-latest" or null
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Optional | GitHub PAT for higher rate limits |
| `GITHUB_USERNAME` | Required | GitHub username to fetch data for |
| `ADMIN_SECRET` | Required | Secret command to trigger admin login in terminal |
| `AUTH_SECRET` | Optional | HMAC signing key (auto-generated if not set) |
| `DATABASE_URL` | Required | Prisma database connection string |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI newspaper content |

> **Note**: Password is no longer stored in env variables. It's created on first use and stored hashed in the database.

### API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth` | POST | No | Authenticate admin user |
| `/api/auth/check` | GET | No | Check if session is admin |
| `/api/auth/logout` | POST | No | Clear admin session |
| `/api/admin/repos` | GET | Admin | List all repos with status |
| `/api/admin/repos` | PATCH | Admin | Update repo settings |
| `/api/admin/refresh` | POST | Admin | Sync repos and commits from GitHub |
| `/api/admin/availability` | GET | No | Get current availability status |
| `/api/admin/availability` | POST | Admin | Toggle availability status |
| `/api/stats/commits` | GET | No | Fetch total commits from all repos (GitHub API) |
| `/api/newspaper/generate` | GET | No | Get active edition for today |
| `/api/newspaper/generate` | POST | Admin | Generate new AI edition (Gemini) |
| `/api/newspaper/editions` | GET | No | List all editions for archive |
| `/api/newspaper/active` | POST | Admin | Set edition as active for today |

---

## 🔐 Authentication Flow

### First-Time Setup
1. User types secret `ADMIN_SECRET` value in terminal
2. No admin account exists → Setup TUI appears
3. User creates password (min 8 characters)
4. Password is hashed (PBKDF2) and stored in database
5. User is automatically logged in

### Subsequent Logins
1. User types secret `ADMIN_SECRET` value in terminal
2. Admin account exists → Password prompt appears
3. Server verifies password against stored hash
4. If valid, sets signed HttpOnly cookie
5. All subsequent requests include cookie

### Already Logged In
1. User types secret `ADMIN_SECRET` value in terminal
2. Session is valid → Admin Management TUI appears
3. Options: Change Password, Logout, Cancel

### Security Features
- **HMAC-signed session tokens** - Can't be forged
- **PBKDF2 password hashing** - 100,000 iterations
- **Rate limiting** - 5 attempts per 15 minutes
- **Timing-safe comparison** - Prevents timing attacks

### Cookie Format (Secure)
```javascript
// HMAC-signed token
const payload = { admin: true, timestamp: Date.now(), nonce: randomBytes(8) };
const data = base64(JSON.stringify(payload));
const signature = hmac('sha256', AUTH_SECRET, data);
const token = `${data}.${signature}`;
```

---

## 🎨 Styling System

### CSS Variables (Dark Theme)
```css
:root {
  --bg: #000000;
  --bg-secondary: #0a0a0a;
  --text: #ffffff;
  --text-muted: #666666;
  --accent: #ffffff;
  --accent-cyan: #22d3ee;
  --border: #222222;
  --success: #22c55e;
  --error: #ef4444;
}
```

### Theme Toggle
- Uses `data-theme` attribute on `<html>`
- Values: `"dark"` (default) or `"light"`
- Persisted in localStorage

### Font Stack
- **Sans**: Inter
- **Mono**: JetBrains Mono
- **Serif**: Source Serif 4
- **Display**: Playfair Display

---

## 💻 Terminal Commands

### Portfolio Commands
| Command | Description |
|---------|-------------|
| `/whoami` | Display profile info |
| `/projects`, `/ls` | List repositories |
| `/skills` | Show technical skills |
| `/contact` | Contact links |
| `/stats` | GitHub statistics |
| `/repo <name>` | Open repo in browser |

### Terminal Commands
| Command | Description |
|---------|-------------|
| `/theme` | Open theme selector |
| `/font <mono\|sans\|serif>` | Change font |
| `/screensaver`, `/cmatrix` | Toggle matrix rain |
| `/crt` | Toggle CRT scanline effect |
| `/glitch` | Toggle glitch effect |
| `/clear` | Clear terminal |
| `/history` | Show command history |
| `/export` | Copy session to clipboard |

### Fun Commands
| Command | Description |
|---------|-------------|
| `/neofetch` | System info display |
| `/fortune` | Random dev fortune |
| `/cowsay <text>` | ASCII cow says text |
| `/figlet <text>` | ASCII art text |
| `/sl` | Train animation |
| `/date` | Current date/time |
| `/echo <text>` | Echo text |

### Navigation
| Command | Description |
|---------|-------------|
| `exit`, `quit`, `q`, `:q` | Return to main page |

### Admin Commands (After Login)
| Command | Description |
|---------|-------------|
| `/list` | Show all repos with status |
| `/hide <repo>` | Hide a repository |
| `/show <repo>` | Unhide a repository |
| `/logout` | End admin session |

---

## 🧩 Component Relationships

```
layout.tsx
├── ThemeProvider          # Theme context
│   └── AdminProvider      # Admin state context
│       └── KeyboardShortcuts  # Global shortcuts
│           └── {children}

page.tsx (/)
├── Header                 # Navigation + mode switcher
└── DefaultPage           # Main content
    └── ProjectsGrid      # Repo cards with inline admin controls

terminal/page.tsx
└── TerminalPage          # Full terminal UI
    ├── AsciiLogo
    ├── CommandBlock[]    # Rendered output
    ├── TerminalInput     # Input field
    ├── StatusBar         # Bottom bar
    ├── TUISelector       # Theme picker popup
    └── MatrixRain        # Screensaver overlay

paper/page.tsx
└── PaperPage             # Document layout
    └── sidebar + sections

newspaper/page.tsx
└── NewspaperPage         # Editorial layout
```

---

## 📦 Data Flow

### Server-Side (Initial Load)
```
page.tsx
  └── getGitHubData()
        ├── prisma.repo.findMany()  # Try DB first
        │     └── (fallback) getRepos() from GitHub
        ├── getUser()               # Always from GitHub
        └── getActivity()           # Always from GitHub
```

### Client-Side (Admin Panel)
```
AdminPanel.tsx (onMount)
  └── fetch("/api/admin/repos")
        └── prisma.repo.findMany()

AdminPanel.tsx (onAction)
  └── fetch("/api/admin/repos", PATCH)
        └── prisma.repo.update()
```

---

## ⚙️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Initialize database
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

### Build
```bash
cd app
npm run build
npm start
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Database Options
- **Local/Dev**: SQLite (`file:./dev.db`)
- **Production**: PostgreSQL (update `DATABASE_URL` and `provider` in schema)

---

## ⚠️ Known Issues

1. ~~**Session tokens are not cryptographically signed**~~ - ✅ Fixed with HMAC signing
2. ~~**Rate limiting not implemented**~~ - ✅ Fixed with 5 attempts/15 min
3. ~~**CSRF protection not applied to API routes**~~ - ✅ Fixed
4. ~~**ModeSwitcher component unused**~~ - ✅ Removed
5. **Terminal hide/show uses localStorage** - Conflicts with DB
6. **LinkedIn/email are placeholders** - Use config values
7. **No resume.pdf file** - 404 on contact link (placeholder)

See `TASKS.md` for complete list of issues and improvements.

---

## 🎯 Key Patterns

### Adding a New Page Mode
1. Create folder under `src/app/<mode>/`
2. Add `page.tsx` (server component) that fetches data
3. Add `<Mode>Page.tsx` (client component) for UI
4. Add `loading.tsx` for loading state
5. Add to `modes` array in `Header.tsx`
6. Add keyboard shortcut in `KeyboardShortcuts.tsx`

### Adding a Terminal Command
1. Open `src/app/terminal/lib/commands.ts`
2. Add handler to `commands` object:
```typescript
mycommand: (args, ctx) => {
  const lines: TerminalLine[] = [];
  // Add output lines
  return { lines };
}
```
3. Command auto-registers with `/mycommand` alias

### Adding Admin Functionality
1. API route: Check `verifyAdminCookie()` first
2. Client: Use `useAdmin()` hook for `isAdmin` state
3. Client: Call admin APIs only when `isAdmin === true`

---

## 📌 Important Files to Know

| File | Purpose |
|------|---------|
| `src/config/site.ts` | Personal info, links, skills - edit for new user |
| `src/lib/data.ts` | Main data fetching logic |
| `src/lib/auth.ts` | Authentication utilities |
| `src/app/terminal/lib/commands.ts` | All terminal commands |
| `src/app/globals.css` | CSS variables and animations |
| `prisma/schema.prisma` | Database schema |

---

## 🤖 For AI Agents

### When Asked to Add Features
1. Check if similar pattern exists in codebase
2. Follow existing code style (TypeScript, components)
3. Use CSS variables for any new colors
4. Add to appropriate location based on structure above
5. Update TASKS.md if fixing an issue

### When Debugging
1. Check environment variables are set
2. Verify Prisma client is generated
3. Admin issues: Check cookie in browser dev tools
4. API issues: Check server logs for errors

### Code Style Notes
- Components use function declarations
- Hooks use `useState`, `useEffect`, `useRef`
- Client components marked with `"use client"`
- Server components are default (no directive)
- TypeScript strict mode enabled
- Path aliases use `@/` for `src/`


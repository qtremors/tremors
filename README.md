# Tremors Portfolio

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

**A multi-mode portfolio website with GitHub integration and secret admin controls**

[Live Site](https://tremors.vercel.app) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 📦 Repository Structure

This repository contains two sites:

| Folder | Description | Deployment |
|--------|-------------|------------|
| **Root** (`/`) | GitHub Pages redirect site (legacy) | [qtremors.github.io/tremors](https://qtremors.github.io/tremors/) |
| **`/app`** | Next.js 16 portfolio application | [Vercel](https://tremors.vercel.app) |

> **Note**: The root folder (`index.html`, `tui.html`) contains a simple redirect page that sends visitors from the old GitHub Pages URL to the new portfolio.

---

## ✨ Features

### 🎭 Multiple Viewing Modes

| Mode | Description | Path |
|------|-------------|------|
| **Default** | Modern card-based layout with animated hero | `/` |
| **Terminal** | Interactive CLI with 30+ commands | `/terminal` |
| **Resume** | Document/resume-style with sidebar TOC | `/resume` |
| **News** | Editorial magazine-style with AI-generated content + RSS | `/news` |
| **Nexus** | Interactive space environment with animated elements | `/nexus` |

### 🔗 GitHub Integration
- Fetches repositories, user profile, and activity from GitHub API
- Caches data in SQLite/PostgreSQL for fast loading
- Filters out forks and repos with `x` topic
- **Scheduled auto-refresh** at 12AM IST via cron

### 📰 AI Newspaper Mode
- Gemini AI generates hilarious tabloid-style headlines and articles
- Archive dropdown with collapsible date folders
- Multiple content variants per day
- Admin controls to set active edition
- Fallback content when AI is unavailable

### 🔐 Secret Admin Mode
- Hidden admin login via Terminal mode
- Edit mode toggle in navbar for inline project controls
- Toggle repository visibility and featured status
- Drag-and-drop reordering of projects
- Refresh button to sync from GitHub
- Regenerate AI newspaper content
- **Project card images** - GitHub preview, custom URL, or none
- **Global image toggle** - Show/hide all project images

### 🎨 Theming
- Dark and light mode support
- Premium black & white color scheme
- Three terminal color themes: Dracula, Tokyo Night, Rosé Pine
- Smooth theme transitions

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + `` | Toggle Terminal mode |
| `Ctrl + Alt + P` | Switch to Resume mode |
| `Ctrl + Alt + N` | Switch to News mode |
| `Ctrl + Alt + X` | Switch to Nexus mode |

### 🚀 Nexus Mode
An interactive space-themed landing page featuring:
- **Central Space Station** - Click to deploy animated spaceships linking to Paper, Terminal, and Newspaper modes
- **Multi-layered backgrounds** - Blackhole video, moon surface, and tsparticles starfield
- **Particle absorber** - Stars slowly consumed by the blackhole
- **Voyager animation** - Probe traversing the screen via CSS offset-path
- **Wormhole portal** - Links to external portfolio (`qtremors.github.io`)

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%">
      <strong>Default Mode</strong><br/>
      Modern card-based portfolio with animated code block hero
    </td>
    <td width="50%">
      <strong>Terminal Mode</strong><br/>
      Interactive CLI with theme switching and effects
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Resume Mode</strong><br/>
      Document layout with sidebar table of contents
    </td>
    <td width="50%">
      <strong>News Mode</strong><br/>
      Editorial style with ticker and multi-column layout
    </td>
  </tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, pnpm, or yarn
- GitHub account (for API access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/qtremors/tremors.git
   cd tremors/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   ```env
   # GitHub Personal Access Token (optional but recommended)
   GITHUB_TOKEN=your_token_here

   # Your GitHub username
   GITHUB_USERNAME=your_username

   # Secret command to access admin mode (keep secret!)
   # Password is created on first use in the terminal
   ADMIN_SECRET=your_secret_command_here

   # Database (SQLite for local development)
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🛠️ Configuration

### Personal Information

Edit `app/src/config/site.ts` to customize your portfolio:

```typescript
export const PERSONAL = {
  name: "Your Name",
  handle: "YourHandle",
  tagline: "Your Title",
  bio: "Your bio description",
  location: "Your Location",
  availableForWork: true,
};

export const CONTACT_LINKS = [
  { id: "email", label: "Email", url: "mailto:you@example.com", icon: "📧" },
  { id: "github", label: "GitHub", url: "https://github.com/you", icon: "🐙" },
  // Add more links...
];

export const SKILLS = [
  { id: "frontend", label: "Frontend", skills: ["HTML", "CSS", "Tailwind", "JavaScript", "TypeScript", "React"] },
  { id: "backend", label: "Backend", skills: ["Python", "Django", "FastAPI", "SQLite", "Prisma", "PostgreSQL"] },
  { id: "data", label: "Data", skills: ["NumPy", "Pandas", "Matplotlib", "Plotly", "BeautifulSoup", "Streamlit"] },
  { id: "ai-ml", label: "AI / ML", skills: ["TensorFlow", "scikit-learn", "OpenCV", "Gemini API"] },
  { id: "tools", label: "Tools", skills: ["Git", "GitHub", "VS Code", "Jupyter", "Docker", "Linux", "Windows"] },
];
```

### GitHub Configuration

```typescript
export const GITHUB_CONFIG = {
  username: process.env.GITHUB_USERNAME || "your-username",
  excludeTopic: "x",          // Repos with this topic are hidden
  featuredTopic: "portfolio", // Repos with this topic are featured
  maxFeatured: 6,
  maxActivity: 10,
};
```

---

## 📁 Project Structure

```
tremors/
├── index.html              # GitHub Pages redirect
├── tui.html                # Terminal redirect
├── README.md               # This file
├── CHANGELOG.md            # Version history
├── AGENTS.md               # AI agent context
├── TASKS.md                # Bug tracking
│
└── app/                    # Next.js Portfolio Application
    ├── prisma/
    │   ├── schema.prisma   # Database schema
    │   └── dev.db          # SQLite database (gitignored)
    ├── public/             # Static assets
    ├── src/
    │   ├── app/            # Next.js App Router
    │   │   ├── api/        # API routes
    │   │   ├── news/       # News mode (AI newspaper)
    │   │   ├── nexus/      # Nexus space mode
    │   │   ├── resume/     # Resume mode (paper layout)
    │   │   ├── terminal/   # Terminal mode
    │   │   └── ...
    │   ├── components/     # Shared React components
    │   ├── config/         # Site configuration
    │   ├── lib/            # Utilities
    │   └── types/          # TypeScript types
    ├── .env.example        # Environment template
    ├── package.json        # Dependencies
    └── tsconfig.json       # TypeScript config
```

---

## 🖥️ Terminal Commands

### Portfolio
| Command | Description |
|---------|-------------|
| `/whoami` | Display profile information |
| `/projects` | List all visible repositories |
| `/skills` | Show technical skills |
| `/contact` | Display contact links |
| `/stats` | GitHub statistics |
| `/repo <name>` | Open repository in browser |

### Customization
| Command | Description |
|---------|-------------|
| `/theme` | Open theme selector |
| `/font <mono\|sans\|serif>` | Change terminal font |
| `/screensaver` | Toggle matrix rain effect |
| `/crt` | Toggle CRT scanline effect |
| `/glitch` | Toggle ASCII art glitch |

### Fun
| Command | Description |
|---------|-------------|
| `/neofetch` | System info display |
| `/fortune` | Random developer fortune |
| `/cowsay <text>` | ASCII cow with message |
| `/figlet <text>` | ASCII art text |
| `/sl` | Steam locomotive |

### Navigation
| Command | Description |
|---------|-------------|
| `exit` | Return to main page |
| `/clear` | Clear terminal output |
| `/history` | Show command history |

### Admin (After Login)
| Command | Description |
|---------|-------------|
| `/list` | Show all repos with visibility status |
| `/hide <repo>` | Hide a repository |
| `/show <repo>` | Unhide a repository |
| `/logout` | End admin session |

---

## 🔧 Admin Mode

### First-Time Setup

1. Navigate to `/terminal`
2. Type your `ADMIN_SECRET` value (the secret command you set in `.env`)
3. A setup TUI appears - create your password (min 8 characters)
4. Your password is securely hashed and stored in the database
5. You're automatically logged in!

### Subsequent Logins

1. Navigate to `/terminal`
2. Type your `ADMIN_SECRET` value
3. Enter your password when prompted
4. Success message confirms admin access

### Admin Features

- **Edit Mode Button**: Pencil icon (✏️) toggles to checkmark (✓) when active
- **Toggle Visibility**: Hide/show repos from public view
- **Toggle Featured**: Mark repos as featured for prominence
- **Reorder Projects**: Drag and drop to change display order
- **Sync from GitHub**: Refresh button syncs repository data

---

## 🗄️ Database

### SQLite (Development)
Default configuration uses SQLite for local development:
```env
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Production)
For production on Vercel or similar:

#### Deployment Checklist

1. **Update Prisma Provider**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set Environment Variables**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   GITHUB_TOKEN="ghp_..."
   GITHUB_USERNAME="yourusername"
   AUTH_SECRET="random-32-char-string"
   GEMINI_API_KEY="..." (optional, for newspaper mode)
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed Initial Data** (optional)
   ```bash
   npx prisma db seed
   ```

6. **Test Build Locally**
   ```bash
   npm run build
   npm start
   ```

7. **Deploy to Vercel**
   - Push to GitHub
   - Import project in Vercel
   - Add environment variables
   - Deploy

---

## 📦 Deployment

### Vercel (Recommended)

1. Push repository to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set root directory to `app`
4. Set environment variables in Vercel dashboard
5. Deploy

### Environment Variables for Production

| Variable | Required | Notes |
|----------|----------|-------|
| `GITHUB_TOKEN` | Recommended | Increases API rate limit |
| `GITHUB_USERNAME` | Yes | Your GitHub username |
| `ADMIN_SECRET` | Yes | Secret command to trigger admin login |
| `AUTH_SECRET` | Recommended | HMAC signing key for sessions |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Yes* | Direct connection for Prisma migrations (*auto-set by Vercel+Neon) |
| `GEMINI_API_KEY` | Optional | For AI newspaper content |

> **Note**: No password in env vars! Password is created on first login and stored hashed in the database.

---

## 🔒 Security

The admin authentication system includes:

- ✅ **HMAC-signed session tokens** - Can't be forged without the secret key
- ✅ **PBKDF2 password hashing** - 100,000 iterations with unique salt
- ✅ **Rate limiting** - 5 login attempts per 15 minutes
- ✅ **Timing-safe comparison** - Prevents timing attacks
- ✅ **HttpOnly cookies** - Not accessible via JavaScript
- ✅ **No password in env vars** - Created and stored securely in database

---

## 🧪 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Testing

Tests are written using [Vitest](https://vitest.dev/) with React Testing Library.

**Test files location:** `src/__tests__/`

**What's tested:**
- `auth.test.ts` - Password hashing, timing-safe comparison, session tokens
- `csrf.test.ts` - Origin/referer validation, CSRF protection
- `sanitize.test.ts` - XSS prevention, input cleaning
- `utils.test.ts` - Topics parsing, utility functions
- `ProjectCard.test.tsx` - Component rendering

**Running tests:**
```bash
# Run once
npx vitest run

# Watch mode
npm test

# With coverage
npm run test:coverage
```

---

## 📊 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4, CSS Variables |
| **Database** | Prisma ORM, SQLite/PostgreSQL |
| **Animation** | Framer Motion, tsParticles |
| **Fonts** | Inter, JetBrains Mono, Playfair Display, Source Serif 4 |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 📄 Related Files

| File | Description |
|------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Complete version history (v0.0.0 - v1.8.5) |
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
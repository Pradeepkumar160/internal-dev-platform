<div align="center">

# 🚀 Internal Developer Platform (IDP)

**A production-ready self-hosted DevOps dashboard for teams.**  
Manage microservices, deployments, environment variables, live logs, and team access — all from one beautiful dark UI.

![Dashboard Preview](./references/dashboard-preview.png)

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![tRPC](https://img.shields.io/badge/tRPC-11-398CCB?style=flat&logo=trpc&logoColor=white)](https://trpc.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Deployment trends chart, service health overview, recent activity |
| 🚀 **Deployments** | Trigger deploys, track status history, rollback support |
| 📜 **Live Logs** | Real-time log streaming via WebSockets (Socket.IO) |
| 🔐 **Env Variables** | Per-service env var management with secret masking |
| 💚 **Service Health** | Uptime monitoring and health status for all services |
| 👥 **Team Management** | Role-based access control: Admin / Developer / Viewer |
| 🌙 **Dark Mode** | Beautiful dark UI out of the box |
| 🔑 **Auth** | JWT sessions + OAuth support + dev login for local use |

---

## 🛠 Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite 7 (dev server + bundler)
- Tailwind CSS 4 + shadcn/ui (Radix UI)
- tRPC client + TanStack Query
- Recharts, Framer Motion, Socket.IO client

**Backend**
- Node.js + Express
- tRPC server (type-safe API)
- Drizzle ORM + SQLite (better-sqlite3)
- Socket.IO (real-time logs)
- JWT (jose) for session auth

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ (22 recommended) | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `npm install -g pnpm` |

### 1. Clone the repo

```bash
git clone https://github.com/Pradeepkumar160/internal-dev-platform.git
cd internal-dev-platform
```

### 2. Set up environment

```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET`:

```bash
# Generate a secure secret (Linux/Mac/WSL):
openssl rand -hex 32

# Or use Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run the app

**Windows (PowerShell) — easiest:**
```powershell
# Allow the script (one-time):
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Start:
.\START-HERE.ps1
```

**Any platform (manual):**
```bash
pnpm dev
```

**App runs at → [http://localhost:5174](http://localhost:5174)**

> Click **"Enter Platform"** on the landing page — no account needed for local dev!

---

## 📁 Project Structure

```
internal-dev-platform/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/           # Dashboard, Deployments, Logs, EnvVars, Team, ServiceHealth
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # tRPC client, utilities
│   └── index.html
├── server/                  # Express + tRPC backend
│   ├── _core/               # Server bootstrap, auth middleware
│   ├── routers.ts           # All tRPC routes
│   ├── db.ts                # Database queries (Drizzle ORM)
│   └── storage.ts           # File/asset storage
├── shared/                  # Types & constants shared between client/server
├── drizzle/                 # DB migrations and schema
├── .env.example             # Environment variable template
├── START-HERE.ps1           # One-click Windows startup script
├── vite.config.ts
└── package.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ Yes | Secret key for signing JWT sessions. Use `openssl rand -hex 32` |
| `PORT` | No | Server port (default: `5174`) |
| `ALLOW_DEV_LOGIN` | No | Set `true` to enable dev-login in production (not recommended) |
| `VITE_OAUTH_PORTAL_URL` | No | OAuth provider URL (leave blank to use dev login) |
| `VITE_APP_ID` | No | App ID for OAuth |
| `OAUTH_SERVER_URL` | No | OAuth server URL |
| `OWNER_OPEN_ID` | No | Owner's OpenID for initial admin access |

---

## 🗄️ Database

The app uses **SQLite** via Drizzle ORM — zero external database setup required.

```bash
# Apply migrations (auto-runs on first start, or run manually):
pnpm db:push
```

The database file (`dev.db`) is created automatically in the project root.

---

## 🏗️ Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build frontend + bundle server for production |
| `pnpm start` | Run the production build |
| `pnpm test` | Run tests (Vitest) |
| `pnpm check` | TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Generate + apply DB migrations |

---

## 🚢 Production Deployment

1. **Build the app:**
   ```bash
   pnpm build
   ```

2. **Set production env vars** in `.env`:
   - Set a strong `JWT_SECRET`
   - Set `NODE_ENV=production`
   - Set `ALLOW_DEV_LOGIN=false`

3. **Start the server:**
   ```bash
   pnpm start
   ```

4. **Reverse proxy** (recommended): put Nginx or Caddy in front of port `5174`.

---

## 🔐 Authentication

- **Local dev**: Click "Enter Platform" → uses `devLogin` endpoint (no password needed)
- **Production**: Integrate your OAuth provider via `VITE_OAUTH_PORTAL_URL` + `OAUTH_SERVER_URL`
- Sessions are JWT tokens stored in HTTP-only cookies

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT © [Pradeepkumar160](https://github.com/Pradeepkumar160)

---

<div align="center">
⭐ If this project helped you, consider giving it a star!
</div>

# CuriousBees V2

<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<br />

**CuriousBees V2** is a centralized, digital Research Collaboration Platform designed specifically for modern university ecosystems. It integrates scholars, faculty supervisors, and institutional administrators into a unified, secure academic environment.

---

## 🏗️ Architecture & Tech Stack

CuriousBees employs a decoupled client-server monorepo architecture:
* **Frontend**: Next.js 15+ (App Router), Tailwind CSS, Zustand, React Query.
* **Backend API**: NestJS 11+, Prisma ORM, BullMQ.
* **Database**: PostgreSQL and Redis.
* **Authentication**: Firebase Authentication (Google SSO) & Local Development Mode Bypass.

For a detailed breakdown of the internal systems, data flows, and relational schemas, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📂 Folder Structure

```text
curiousbees-monorepo/
├── apps/
│   ├── web/                # Next.js Frontend Web Application (React)
│   └── api/                # NestJS Backend REST API (Express wrapper)
├── packages/
│   ├── types/              # Shared TypeScript definitions
│   ├── shared-utils/       # Shared utility functions (e.g. apiFetch)
│   ├── ui/                 # Reusable React components & Design tokens
│   ├── constants/          # Shared system constants (e.g. cookie names)
│   └── config/             # Shared ESLint/Prettier/TypeScript configs
├── docs/
│   ├── setup/              # OS-Specific setup guides (Windows, macOS, Linux)
├── scripts/                # Cross-platform utility and automation scripts
├── .nvmrc                  # Pinned node version specification
├── package.json            # Root workspace definitions & scripts
└── docker-compose.yml      # Local Postgres & Redis container orchestration
```

---

## 🚀 Development Setup (Bypass Mode)

Follow these steps to set up the project locally on any operating system without configuring Firebase.

### 1. Prerequisites
Ensure you have the following installed:
* **Node.js**: `v22.14.0` or higher (pin managed via `.nvmrc`)
* **npm**: `v10.x` or higher
* **Docker & Docker Compose**

### 2. Install Dependencies
Run from the root of the monorepo:
```bash
npm install
```

### 3. Spin Up Infrastructure
Launch the local PostgreSQL database and Redis queue server:
```bash
npm run docker:up
```

### 4. Configure Environment Variables
Copy the example templates in each workspace:
1. **Root**: Copy `.env.example` $\rightarrow$ `.env`
2. **Frontend App**: Copy `apps/web/.env.example` $\rightarrow$ `apps/web/.env.local`
3. **Backend App**: Copy `apps/api/.env.example` $\rightarrow$ `apps/api/.env`

*Ensure `DEVELOPMENT_MODE=true` is set on the backend and `NEXT_PUBLIC_DEVELOPMENT_MODE=true` is set on the frontend to bypass Firebase authentication and database synchronization checks.*

### 5. Build and Seed Database
Run the cross-platform setup script to compile Prisma bindings, push the database schema, and seed mock records:
```bash
npm run setup
```

### 6. Run Application
Start Next.js and NestJS concurrently:
```bash
npm run dev
```
* Frontend is available at: [http://localhost:3000](http://localhost:3000)
* API is available at: [http://localhost:4000](http://localhost:4000)
* API Health endpoint: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## ⚙️ Standard Scripts (Cross-Platform)

All monorepo scripts are standardized to run across Windows, macOS, and Linux:

* `npm run setup`: Sets up database schemas, compiles client types, and seeds data.
* `npm run dev`: Starts Next.js and NestJS concurrently.
* `npm run build`: Compiles all packages and builds applications in dependency order.
* `npm run lint`: Runs ESLint check across all modules.
* `npm run typecheck`: Runs tsc type validation globally.
* `npm run clean`: Cleans Node modules, distribution outputs, and Next.js caches.
* `npm run reset`: Completely cleans and reinstalls all dependencies, database, and seeds.

---

## 🔧 Troubleshooting

### Port Conflict (`EADDRINUSE`)
If port `3000` or `4000` is already in use:
* On **macOS/Linux**: `lsof -i :4000` then `kill -9 <PID>`
* On **Windows**: `netstat -ano | findstr 4000` then `taskkill /F /PID <PID>`

### CORS Blocks
If NestJS blocks client requests, ensure `DEVELOPMENT_MODE=true` is active in `apps/api/.env`. This enables wildcard local port origin matching so that shifted client instances (e.g. port `3001`) are allowed.

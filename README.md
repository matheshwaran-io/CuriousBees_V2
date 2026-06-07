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
* **Authentication**: Clerk Authentication & Local Development Mode Bypass.

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

## 🚀 5-Minute Quick Start (Development Bypass Mode)

Set up the entire project locally on any operating system (macOS/Windows/Linux) in under 5 minutes without configuring Clerk:

### 1. Prerequisites
* **Node.js**: `v22.x` or higher (managed via `.nvmrc`)
* **npm**: `v10.x` or higher
* **Docker & Docker Compose**

### 2. Install Monorepo Dependencies
From the root of the repository:
```bash
npm install --legacy-peer-deps
```

### 3. Setup Environment variables
Copy the consolidated global environment configuration template at the root:
```bash
cp .env.example .env
```
*(By default, this file has bypass settings active, enabling instant offline logins.)*

### 4. Run Environment & Database Setup
Compile shared packages, generate Prisma schema types, and validate typecheck compliance:
```bash
npm run setup
```

### 5. Spin Up Infrastructure
Launch the local PostgreSQL database and Redis queue server inside Docker:
```bash
npm run docker:up
```

### 6. Verify System Health (Diagnostics Doctor)
To verify your setup, ports, environment configuration, database, and Redis connectivity, run:
```bash
npm run doctor
```

### 7. Launch Development Servers
Start both the NestJS API and Next.js frontend concurrently:
```bash
npm run dev
```
* **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:4000](http://localhost:4000)
* **Interactive API Documentation (Swagger)**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **API Health check Dashboard**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## ⚙️ Standard Scripts (Cross-Platform)

All monorepo scripts are standardized to run across Windows, macOS, and Linux:

* `npm run setup`: Compiles shared packages, generates Prisma database client, and runs TypeScript checks.
* `npm run doctor`: Validates required environment variables and tests DB/Redis connectivity.
* `npm run dev`: Starts Next.js and NestJS concurrently.
* `npm run build`: Compiles all packages and builds applications in dependency order.
* `npm run lint`: Runs ESLint check across all modules.
* `npm run typecheck`: Runs tsc type validation globally.
* `npm run clean`: Cleans Node modules, distribution outputs, and Next.js caches.
* `npm run reset`: Completely cleans and reinstalls all dependencies, database, and seeds.
* `npm run health`: Runs a quick query script validating if NestJS is healthy.

---

## 🔧 Troubleshooting

### Port Conflict (`EADDRINUSE`)
If port `3000` or `4000` is already in use:
* On **macOS/Linux**: `lsof -i :4000` then `kill -9 <PID>`
* On **Windows**: `netstat -ano | findstr 4000` then `taskkill /F /PID <PID>`

### CORS Blocks
If NestJS blocks client requests, ensure `DEVELOPMENT_MODE=true` is active in `apps/api/.env`. This enables wildcard local port origin matching so that shifted client instances (e.g. port `3001`) are allowed.

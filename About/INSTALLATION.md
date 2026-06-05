# CuriousBees V2 — Installation & Setup Guide

Welcome to the **CuriousBees V2** monorepo. This guide outlines the steps required to set up, configure, and run the CuriousBees application locally.

---

## Repository Structure

CuriousBees is structured as a monorepo using **npm workspaces**:
* **`apps/web`**: Next.js frontend application (runs on `http://localhost:3000`).
* **`apps/api`**: NestJS backend REST API (runs on `http://localhost:4000`).
* **`packages/`**: Shared internal libraries:
  * `packages/types`: Shared TypeScript interfaces.
  * `packages/shared-utils`: Shared helper utilities.
  * `packages/constants`: Shared global constants.
  * `packages/ui`: Shared UI component design tokens.

---

## Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v18.x or v20.x recommended)
2. **npm** (v9.x or higher)
3. **Docker & Docker Compose** (for running PostgreSQL and Redis)
4. **Git**

---

## Quick Start (Local Development Mode)

To get the application up and running instantly **without configuring Firebase or Supabase**, follow these quick steps:

### 1. Install Dependencies
Run the following command at the **root** of the repository:
```bash
npm install
```
*Note: This command installs all dependencies for both apps and all package workspaces, setting up internal symlinks.*

### 2. Start Local PostgreSQL & Redis Database
Use Docker Compose to launch a local PostgreSQL database and Redis server (used by NestJS BullMQ queues):
```bash
npm run docker:up
```
This starts:
* **PostgreSQL** on `localhost:5432`
* **Redis** on `localhost:6379`

### 3. Setup Environment Variables

#### Root `.env`
Create a `.env` file at the **root** of the repository and add the following configuration:
```env
# APP CONFIG
NODE_ENV=development
PORT=4000

# DATABASE (Local Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/srm_curiousbees_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/srm_curiousbees_db?schema=public"

# REDIS CONFIG (Local Docker Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS ORIGINS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

#### API Environment (`apps/api/.env`)
Create a `.env` file in the `apps/api/` directory:
```env
# Enable development mode bypass
DEVELOPMENT_MODE=true
```

#### Web App Environment (`apps/web/.env.local`)
Create a `.env.local` file in the `apps/web/` directory:
```env
# API client target
NEXT_PUBLIC_API_URL=http://localhost:4000

# Enable development mode bypass
NEXT_PUBLIC_DEVELOPMENT_MODE=true
```

### 4. Database Setup & Seeding
Deploy database tables and populate mock data (such as departments and supervisors):
```bash
# Generate the Prisma client
npm run db:generate

# Deploy migrations to the local database
npm run db:migrate

# Seed mock supervisors, scholars, and departments
npm run db:seed
```

### 5. Start Development Servers
Start both the Next.js frontend and NestJS API server concurrently:
```bash
npm run dev
```
* **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000)
* **Backend API**: Running at [http://localhost:4000](http://localhost:4000)

---

## Local Development Bypass Mode

When `DEVELOPMENT_MODE=true` / `NEXT_PUBLIC_DEVELOPMENT_MODE=true` is enabled:
* **No Firebase or Google login is required**. You can access dashboard routes directly.
* **No Database User synchronizations occur** during authentication checks.
* A local mock developer user is generated on the fly:
  ```json
  {
    "id": "dev-user",
    "name": "Developer",
    "email": "developer@local.dev",
    "role": "RESEARCH_SCHOLAR",
    "approved": true,
    "status": "APPROVED"
  }
  ```
* A floating **Dev Override Active** widget will appear at the bottom right of the screen. You can select:
  * **Scholar** $\rightarrow$ loads the Research Scholar Portal directly.
  * **Supervisor** $\rightarrow$ loads the Faculty Supervisor Control Center directly.
  * **Admin** $\rightarrow$ redirects to `/admin/dashboard` with full Institution Administrator capabilities.

---

## Production / Live Authentication Mode

To test the live Firebase authentication and Supabase integration:
1. In `apps/api/.env`, set `DEVELOPMENT_MODE=false`.
2. In `apps/web/.env.local`, set `NEXT_PUBLIC_DEVELOPMENT_MODE=false`.
3. Configure your real Firebase client keys in `apps/web/.env.local` and admin private keys in `apps/api/.env`.
4. Update the `DATABASE_URL` in the root `.env` to point to your Supabase or hosted Postgres instance.

---

## Troubleshooting

### Port Conflicts (`EADDRINUSE`)
If you encounter `Error: listen EADDRINUSE: address already in use :::4000` or `:::3000`:
1. Find the processes holding these ports:
   ```bash
   lsof -i :3000
   lsof -i :4000
   ```
2. Kill the corresponding process IDs:
   ```bash
   kill -9 <PID>
   ```

### CORS Blocks
If the backend logs show CORS exceptions (e.g. if the Next.js app starts on port `3001`), the API CORS handler automatically allows all local host variations in `DEVELOPMENT_MODE=true`. Ensure `DEVELOPMENT_MODE` is enabled in `apps/api/.env`.

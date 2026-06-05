# CuriousBees V2 — Deployment & Cross-Platform Orchestration Guide

This guide describes how to run CuriousBees V2 on multiple developer OS platforms (Windows, macOS, Linux) and deploy to cloud production environments.

---

## 💻 1. Cross-Platform Local Setup (macOS / Windows / Linux)

CuriousBees is built using npm workspaces. Ensure you have **Node.js >= 22** and **npm >= 10** installed.

### Git Checkout & Clean Setup

```bash
# 1. Clone the project
git clone <curiousbees-repo-url>
cd CuriousBees_V2

# 2. Reset the workspace (Prunes stale nodes, runs clean install, runs DB setups)
npm run reset
```

*Note: The `npm run reset` command uses `rimraf` and `cross-env` which guarantees compatibility across all Windows shells (PowerShell, Command Prompt, Git Bash) as well as macOS and Linux.*

### Running Services Locally

You can run Postgres and Redis databases locally via Docker:

```bash
# Start Postgres and Redis background services
npm run docker:up

# Stop databases
npm run docker:down
```

To run the application:

```bash
# Run both Next.js UI and NestJS API in watch/development mode
npm run dev

# Run only front-end Next.js application
npm run dev:web

# Run only back-end NestJS API application
npm run dev:api
```

---

## 🐳 2. Running in Docker Containers

CuriousBees V2 provides containerized configurations for development and production.

### Development Mode (with code hot-reloading)

This starts Postgres, Redis, NestJS, and Next.js. Files mounted from the local workspace automatically trigger hot-reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Production Mode (Containerized Compilation)

This compiles production assets and optimizes packages in multi-stage builds:

```bash
docker compose -f docker-compose.yml up --build
```

---

## ☁️ 3. Cloud Production Deployments

CuriousBees V2 can be deployed to serverless frontends and server backends with 100% free/open-source tiers.

### A. Database Deployment (Supabase PostgreSQL)

1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Project Settings > Database** and copy the Connection String (URI).
   * **Transaction Mode (Session/Pooling)**: Set `DATABASE_URL` to the connection pooling URL (usually port `6543` with `pgbouncer=true`).
   * **Direct Mode (Migrations)**: Set `DIRECT_URL` to the direct session connection string (port `5432`).
3. Run migrations and database seeds:
   ```bash
   # Generate Prisma client locally
   npm run db:generate
   
   # Apply database migrations to Supabase Postgres
   npm run db:migrate
   
   # Seed departments, scholars, and opportunities
   npm run db:seed
   ```

### B. Redis Queue Deployment (Upstash Redis)

1. Create a free account on [Upstash](https://upstash.com).
2. Create a Serverless Redis database.
3. Retrieve the Redis Host and Port from the console.
4. Set `REDIS_HOST` and `REDIS_PORT` in your API server environment variables.

### C. Backend API Deployment (Railway / Render / AWS)

The backend runs as a standard Node/Docker service.

1. Connect your GitHub repository to [Railway](https://railway.app) or [Render](https://render.com).
2. Set the build root directory to `/` and select **Docker** as the builder. The service will automatically pick up `Dockerfile.api`.
3. Map the following Environment Variables in the hosting console:
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=your-supabase-connection-pool-url
   DIRECT_URL=your-supabase-direct-session-url
   REDIS_HOST=your-upstash-redis-host
   REDIS_PORT=your-upstash-redis-port
   DEVELOPMENT_MODE=true # Keeps Intranet bypass logins active
   FRONTEND_URL=https://your-ui-domain.vercel.app
   ```

### D. Frontend UI Deployment (Vercel)

The Next.js front-end is optimized for deployment on Vercel.

1. Connect your repository to [Vercel](https://vercel.app).
2. Select the `apps/web` directory as the project root.
3. Add the following Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.railway.app
   NEXT_PUBLIC_DEVELOPMENT_MODE=true
   ```
4. Deploy. Vercel automatically builds and optimizes the frontend assets.

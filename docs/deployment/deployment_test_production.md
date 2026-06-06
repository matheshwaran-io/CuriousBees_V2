# CuriousBees V2 — Test & Production Deployment Guide

This guide details the procedures, checklists, environmental configurations, and rollback strategies required to deploy **CuriousBees V2** to test (staging) and production environments.

---

## 🏗️ Architecture Overview

A production-ready deployment of CuriousBees V2 contains the following components:
1. **Next.js Frontend (`apps/web`)**: Deployed to a serverless platform (e.g., Vercel, AWS Amplify, Netlify) or containerized with Docker.
2. **NestJS API Backend (`apps/api`)**: Deployed to a containerized platform (e.g., AWS ECS, GCP Cloud Run, Heroku, Render) or a VM (e.g., AWS EC2, DigitalOcean Droplet).
3. **Database (PostgreSQL)**: Deployed to a managed database instance (e.g., Supabase PostgreSQL, AWS RDS, GCP Cloud SQL).
4. **Redis Cache & Queue Server**: Deployed to a managed Redis instance (e.g., Upstash, Redis Labs, AWS ElastiCache) to power background jobs managed via BullMQ.
5. **Firebase Project**: Used for user authentication, Google login verification, and Cloud Messaging (FCM) push notifications.

---

## 📋 Pre-Deployment Checklists

### 1. Database Checkup
* [ ] Verify that PostgreSQL version is **15+** (matching the development target of `postgres:15-alpine`).
* [ ] Ensure database user has adequate privileges to create tables and execute migrations (DDL queries).
* [ ] Set up connection pooling (using PgBouncer or Supabase connection pool URLs) if scaling the API horizontally.
* [ ] Verify the direct (non-pooled) URL is available for running migrations.

### 2. Redis & Queue Checkup
* [ ] Ensure Redis server is configured with persistent memory (AOF or RDB) so BullMQ queues don't lose active jobs on server restarts.
* [ ] Test latency and connection from the NestJS host environment to the Redis host using `redis-cli` or telnet.

### 3. Firebase Authentication Setup
* [ ] Register a Firebase web application in your Firebase console.
* [ ] Enable **Google Sign-In** under **Build > Authentication > Sign-in method**.
* [ ] Generate a new private key for the backend service account:
  * Go to **Project Settings > Service accounts > Firebase Admin SDK**.
  * Click **Generate new private key** and download the JSON file.
  * Properly escape the private key for production environment variables (details below).

---

## ⚙️ Production Environment Variables

Ensure that `DEVELOPMENT_MODE` / `NEXT_PUBLIC_DEVELOPMENT_MODE` is set to **`false`** across all target environments.

### 1. NestJS API Backend Variables

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode of the server runtime. | `production` |
| `DEVELOPMENT_MODE` | **MUST BE FALSE** to enforce authentication checks. | `false` |
| `PORT` | The port the NestJS server listens on. | `4000` (or injected by platform) |
| `DATABASE_URL` | Pooled connection string to PostgreSQL. | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | Direct connection string to PostgreSQL (for migrations). | `postgresql://user:pass@host:5432/db` |
| `REDIS_HOST` | Host address of Redis queue. | `your-redis-instance.upstash.io` |
| `REDIS_PORT` | Port of Redis queue. | `6379` |
| `REDIS_PASSWORD` | Password for Redis server (highly recommended). | `secure_redis_pass_here` |
| `FRONTEND_URL` | Main Next.js frontend URL (sets cookie & CORS context). | `https://curiousbees.yourdomain.com` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS domains. | `https://curiousbees.yourdomain.com` |
| `FIREBASE_PROJECT_ID` | Project ID from Firebase service account credentials. | `curiousbees-prod-12345` |
| `FIREBASE_CLIENT_EMAIL` | Client email from Firebase service account credentials. | `firebase-adminsdk@curiousbees-prod.iam...` |
| `FIREBASE_PRIVATE_KEY` | Private key string with escaped `\n` characters. | `"-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n"` |

### 2. Next.js Frontend Variables

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Fully qualified URL of the running API gateway. | `https://api.curiousbees.yourdomain.com` |
| `NEXT_PUBLIC_DEVELOPMENT_MODE` | **MUST BE FALSE** to require Firebase sign-in. | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API URL for Supabase client queries. | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous public key for database interaction. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API key from Firebase settings. | `AIzaSyA1B2C3D4...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain for Firebase Client. | `curiousbees-prod.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID matching backend. | `curiousbees-prod-12345` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Default storage bucket. | `curiousbees-prod.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER` | FCM Sender ID. | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID from Firebase settings. | `1:12345:web:abcd` |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Public key to sign push notifications. | `B...` |

---

## 🚀 Deployment Steps

Follow these steps to deploy CuriousBees V2:

### Step 1: Database Migration
Before starting the API backend, apply database migrations using the direct database URL. In CI/CD pipelines, this can be run in the root workspace:
```bash
# Apply schema changes
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### Step 2: Build and Run Backend
To build the NestJS API application:
```bash
# Build the backend bundle
npm run build:api

# Start production server
npm run start:prod --workspace=apps/api
```

### Step 3: Build and Run Frontend
Next.js statically optimizes routes during compilation, requiring environment variables (such as `NEXT_PUBLIC_API_URL`) to be set *during the build step*.
```bash
# Compile and optimize frontend
npm run build:web

# Start Next.js production server
npm run start --workspace=apps/web
```

---

## 🔄 Rollback & Disaster Recovery Strategies

If errors are detected in production (e.g., server crashes, API routing errors, data corruptions), initiate the rollback protocols.

### 1. Application-Level Rollback
- **Serverless/PaaS Platforms (Vercel, Render)**: Revert to the last successful deployment build via the dashboard or trigger a git revert of the latest commit to the `main` branch.
- **Docker/Kubernetes Environments**: Pull and deploy the previous Docker tag (e.g., roll back from `v1.2.0` to `v1.1.9`).

### 2. Database Migrations Rollback
If a database migration is causing application crashes:
1. **Identify the broken migration name** in the `apps/api/prisma/migrations/` directory.
2. **Do NOT run automated rollbacks** on live databases. Instead, create a new "forward" migration that reverts the changes (e.g., re-adding a column or dropping a newly added table) or use manual PostgreSQL query operations if safe:
   ```sql
   -- Example manual fix to resolve schema state
   ALTER TABLE "User" DROP COLUMN "broken_field";
   ```
3. Use Prisma's troubleshooting flag to mark the broken migration as resolved if needed:
   ```bash
   npx prisma migrate resolve --rolled-back "2026xxxxxx_migration_name" --schema=apps/api/prisma/schema.prisma
   ```

### 3. Redis Queue Purging
If a broken release queued corrupted jobs in Redis, causing workers to crash:
1. Log into your Redis shell (`redis-cli`).
2. Select the database and query BullMQ keys:
   ```bash
   # Find all queue keys
   KEYS "bull:*"
   ```
3. If necessary, flush the database to clear corrupted states (Warning: This wipes out all active queue items):
   ```bash
   FLUSHDB
   ```

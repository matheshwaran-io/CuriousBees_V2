# CuriousBees V2 — Developer Troubleshooting Guide

This guide compiles solutions to common setup, runtime, and connection errors encountered when working in the CuriousBees V2 monorepo.

---

## 🚫 1. Port Conflicts (`EADDRINUSE`)

### Port 3000 (Next.js Frontend) or Port 4000 (NestJS API) is Already in Use
You will see an error matching:
`Error: listen EADDRINUSE: address already in use :::4000`

#### Solutions
##### macOS & Linux
Find and kill the process holding the port:
```bash
# Locate the Process ID (PID)
lsof -i :4000

# Kill the process
kill -9 <PID_NUMBER>
```
*(On macOS, port 3000 or 5000 is often reserved by **AirPlay Receiver**. You can disable it under **System Settings > General > AirPlay & Handoff**).*

##### Windows
Find and kill the process:
```cmd
# Locate the Process ID (PID)
netstat -ano | findstr :4000

# Kill the process (e.g. PID 1234)
taskkill /F /PID 1234
```

---

## 📦 2. Prisma Database Schema & Client Failures

### Prisma client out of sync
You will see TypeScript errors when importing `@prisma/client` or when models lack recently added attributes.

#### Solution
Always re-compile Prisma client bindings after schema modifications or git pulls:
```bash
npm run db:generate
```

### Can't reach database server
`Error: P1001: Can't reach database server`
This indicates the connection URL is wrong or the database is offline.

#### Solutions
1. Check that the PostgreSQL Docker container is running:
   ```bash
   docker ps
   ```
2. Verify the `DATABASE_URL` in the root `.env` and `apps/api/.env`.
   * For local Docker Postgres: `postgresql://postgres:postgres@localhost:5432/srm_curiousbees_db?schema=public`
   * For Supabase: Ensure your IP is whitelisted in Supabase network settings or allow global access.

---

## 💡 3. Redis / Queue Connection Failures

### BullMQ queue stalls or NestJS fails to start due to Redis connection
You will see connection loops or timeouts in the console.

#### Solutions
1. Start the local Redis Docker container:
   ```bash
   npm run docker:up
   ```
2. Verify Redis is listening on `localhost:6379`.
3. Check `REDIS_HOST` and `REDIS_PORT` in your environment files.

---

## 🔐 4. Firebase Auth & Admin SDK Failures

### NestJS API fails on startup due to missing Firebase variables
`Failed to initialize Firebase Admin SDK: Missing FIREBASE_PRIVATE_KEY`

#### Solutions
1. In development, you can completely bypass Firebase checks by setting:
   * **Backend (`apps/api/.env`)**: `DEVELOPMENT_MODE=true`
   * **Frontend (`apps/web/.env.local`)**: `NEXT_PUBLIC_DEVELOPMENT_MODE=true`
2. If testing live integration, check that your Firebase Private Key contains the correct escape characters for newlines (`\n`). In `.env` files, it must be wrapped in double quotes:
   `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...-----END PRIVATE KEY-----\n"`

---

## 📥 5. Dependency Conflicts & Installation Issues

### Installation crashes or fails to resolve package workspaces
You see lockfile conflicts or workspace symlink errors when running `npm install`.

#### Solutions
1. Run a clean reset to clear all lockfiles, caches, and build directories, then reinstall:
   ```bash
   npm run reset
   ```
2. Ensure you are using the standardized package manager (**npm**) instead of mixing with `pnpm` or `yarn` (do not commit `pnpm-lock.yaml` or `yarn.lock`).

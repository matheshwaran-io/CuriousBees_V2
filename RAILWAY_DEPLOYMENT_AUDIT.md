# Railway Production Readiness Audit & Report

This report summarizes the audit and hardening of the CuriousBees NestJS backend (`apps/api`) for production deployment on Railway.

## Deployment Status: **READY**

The application has been successfully audited, modified, and built locally. All production configurations are aligned with Railway containerized deployment standards.

---

## 1. Changes Made

### I. Server Port Configuration
* **Location**: `apps/api/src/main.ts`
* **Fix**: Replaced hardcoded localhost listening with Railway dynamic port binding:
  ```typescript
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  ```
  This ensures the container binds to the correct IP (`0.0.0.0`) and is routeable externally.

### II. Production CORS Configuration
* **Location**: `apps/api/src/main.ts`
* **Fix**: Rewrote the CORS config to split comma-separated origins from `ALLOWED_ORIGINS`, `FRONTEND_URL`, and `WEB_URL`. Allowed headers explicitly include `Authorization`, `Content-Type`, and `Accept`.

### III. Railway Environment Validation
* **Location**: `apps/api/src/main.ts`, `apps/api/src/config/env.validation.ts`
* **Fix**: Implemented a startup validation layer. Before NestJS boots, it validates that `DATABASE_URL`, `CLERK_SECRET_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist in the environment. If any are missing, it logs a clean error and calls `process.exit(1)`, avoiding vague connection errors. Added `SUPABASE_SERVICE_ROLE_KEY` to the Zod config schema.

### IV. Prisma Production Audit
* **Location**: `apps/api/prisma/schema.prisma`, `apps/api/package.json`
* **Fix**: Verified database URLs are fetched dynamically using `env("DATABASE_URL")` and `env("DIRECT_URL")`. Removed the `dotenv-cli` dependency (`dotenv -e ../../.env`) prefix in `apps/api/package.json` scripts so that build/prisma commands run correctly using system-level environment variables supplied by Railway.

### V. Redis Production Audit
* **Location**: `apps/api/src/app.module.ts`, `apps/api/src/notifications/notifications.service.ts`
* **Fix**: Updated `BullModule` initialization to load asynchronously (`forRootAsync`) and instantiate an explicit `Redis` connection with a custom `retryStrategy` and an `error` listener. This registers connection warnings to `console.warn` without bubbling up as unhandled exceptions. Wrapped `notificationQueue.add` inside `notifications.service.ts` in a `try/catch` block to ensure that if Redis is offline/missing, the rest of the application (e.g. user registrations, database writes) remains fully functional.

### VI. Health Endpoint Upgrade
* **Location**: `apps/api/src/app.controller.ts`
* **Fix**: Re-implemented the `/api/health` handler to output the exact requested JSON shape. Wrapped the Redis connection checking in a `try/catch/finally` block to guarantee that the temporary test connection is closed (`redis.disconnect()`) in all code paths, eliminating connection leaks.
  ```json
  {
    "status": "ok",
    "database": "connected",
    "redis": "connected",
    "timestamp": "2026-06-07T12:00:00.000Z",
    "environment": "production"
  }
  ```

### VII. Monorepo Build Verification
* **Location**: Workspace Root (`package.json`)
* **Fix**: Ran `npm run build` from the monorepo root to verify that workspace dependencies compile correctly, the client is generated, and the NestJS application builds successfully.

### VIII. Remove Local Development Assumptions
* **Location**: `apps/api`
* **Fix**: Ensured all occurrences of `localhost`, `127.0.0.1`, and port variables are exclusively used as fallbacks for local developer setups and are overridden by environment variables in production.

---

## 2. Environment Variables Required

Ensure these environment variables are fully configured in the Railway dashboard:

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Connection-pooled Supabase connection string. |
| `DIRECT_URL` | Yes | Direct connection string to Supabase for Prisma migrations. |
| `CLERK_SECRET_KEY` | Yes | Clerk authentication service secret key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role API key. |
| `FRONTEND_URL` | Yes | Root URL of Vercel frontend app. |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of CORS-permitted origins. |
| `REDIS_URL` | No | Redis connection URL (enables asynchronous event queues). |
| `GEMINI_API_KEY` | No | Gemini API key for AI features. |
| `RESEND_API_KEY` | No | Resend API key for emails. |

---

## 3. Potential Deployment Blockers

1. **Missing Environment Variables**: The application will intentionally refuse to start if `DATABASE_URL`, `CLERK_SECRET_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` are not set. Ensure they are configured on Railway before deploying.
2. **Database Migrations**: Railway should run migrations during deployment. Make sure you run `npx prisma migrate deploy` or ensure migrations are updated inside Supabase manually.

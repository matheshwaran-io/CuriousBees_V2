# CuriousBees V2 — Post-Cleanup Report

This document compiles the outcomes of the repository cleanups, details files and dependencies pruned, summarizes build validations, and tracks remaining minor technical debt.

---

## 🗑️ 1. Files & Directories Removed

A total of **16 orphaned files** and **2 packages/directories** have been removed from the repository:

### 1.1 Frontend Code Cleanup (`apps/web`)
* `apps/web/src/components/Sidebar.tsx` (Old layout; replaced by `components/dashboard/Sidebar.tsx`)
* `apps/web/src/components/CalendarView.tsx` (Old calendar; replaced by `components/events/EventCalendar.tsx`)
* `apps/web/src/components/EventForm.tsx` (Unreferenced component)
* `apps/web/src/components/AIBadge.tsx` (Orphaned component)
* `apps/web/src/components/search/SearchBar.tsx` (Legacy search widget)
* `apps/web/src/components/search/RecommendationFeed.tsx` (Legacy search feed)
* `apps/web/src/components/search/EventResultCard.tsx` (Legacy search card)
* `apps/web/src/components/dashboard/Logo.tsx` (Redundant duplicate of `components/Logo.tsx`)
* `apps/web/src/components/shared/status-badge.tsx` (Redundant duplicate of `packages/ui/src/status-badge.tsx`)
* `apps/web/src/components/StatusBadge.tsx` (Unused root component)
* `apps/web/src/test_perm.txt` (Junk test file)

### 1.2 Backend Code & Migration Cleanup (`apps/api`)
* `apps/api/test-ollama.ts` (Broken; references missing AI directory)
* `apps/api/test-event-persistence.ts` (Broken; references missing AI directory)
* `apps/api/create-ext.js` (Obsolete vector extension runner)
* `apps/api/seed-roles.js` (Legacy seeder; replaced by `seed.ts`)
* `apps/api/migrate-roles.js` (Legacy SQL role migrator)
* `apps/api/migrate-status.js` (Legacy SQL status migrator)
* `apps/api/update-roles-by-pattern.js` (Legacy patterns migrator)

### 1.3 Root Workspace Cleanup
* `replace-roles.js` (Legacy refactoring string replacer)
* `packages/config` (Empty workspace directory removed, package reference pruned)

---

## 📦 2. Dependencies & Workspaces Pruned

Runtime dependencies have been isolated to their respective compilation targets, removing root-level duplicate packages:

1. **Backend API (`apps/api/package.json`)**:
   * Pruned: `next` (SSR framework), `nodemailer` (email tool), and `axios` (HTTP client).
   * Added: `@nestjs/config` (moved from root scope to backend scope).
2. **Frontend Portal (`apps/web/package.json`)**:
   * Pruned: `@nestjs/cli` (backend builder tool).
3. **Monorepo Root (`package.json`)**:
   * Pruned all runtime dependencies from the global scope (`firebase`, `next`, `@nestjs/cli`, `@nestjs/common`, `@nestjs/core`, `@nestjs/schedule`, `@prisma/client`, `dotenv`), leaving root only to manage build dependencies (`concurrently`, `cross-env`, `rimraf`, `prisma`, `typescript`).

---

## 🔒 3. Database Schema Migration

### 3.1 NextAuth Table Purge
* Removed the legacy models `Account`, `Session`, and `VerificationToken` from [apps/api/prisma/schema.prisma](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/schema.prisma).
* Removed corresponding relationships (`accounts` and `sessions` lists) from the `User` model.
* Updated [apps/api/prisma/seed.ts](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/seed.ts) to clean up nextauth cleanups.

### 3.2 SQL Migration Summary (`drop_nextauth_tables`)
* **Migration ID**: `20260605062647_drop_nextauth_tables`
* **Actions Applied**:
  * Reset the drift status on the database.
  * Applied clean schema migrations creating active tables (`User`, `Department`, `Opportunity`, etc.) and their constraints.
  * Completely dropped standard NextAuth.js tables from PostgreSQL.
  * Successfully re-seeded mock departments, supervisors, and threads into the local database schema.

---

## 🔬 4. Build & Compilation Verification

All verification diagnostics compile successfully with exit code `0`:
* **TypeScript Verification (`npm run typecheck`)**: Compiles with zero errors across Next.js and NestJS.
* **ESLint Verification (`npm run lint`)**: Complies cleanly.
* **Production Build (`npm run build`)**: Bundling completes successfully.

---

## 💡 5. Remaining Technical Debt

The following minor items are flagged for future developers:

1. **Auth UI Description Text**:
   * In [apps/web/src/app/auth/denied/page.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/app/auth/denied/page.tsx) line 53, the text describes account blocking using the string: `"... automatically rejected by our NextAuth firewall."`
   * *Debt Task*: Refactor this string to reference the active authentication provider (e.g., `"... Firebase firewall"`).
2. **Local Role Styles**:
   * In [apps/web/src/app/(portal)/threads/[id]/page.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/app/(portal)/threads/[id]/page.tsx) line 79, a local styling parser `getRoleBadge` is defined.
   * *Debt Task*: Standardize it by importing the global `<RoleBadge />` component.

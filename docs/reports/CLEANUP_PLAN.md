# CuriousBees V2 — Cleanup Plan

This document outlines the step-by-step strategy to sanitize the repository. It categorizes files into those safe for immediate removal, files requiring reference auditing, and core files that must be protected.

---

## 🗑️ Category 1: SAFE TO DELETE

The following files are verified to be orphaned, unused, or obsolete. They can be deleted without impacting application execution:

### 1.1 Frontend Files (`apps/web`)
* [ ] [apps/web/src/components/Sidebar.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/Sidebar.tsx) (Replaced by `components/dashboard/Sidebar.tsx`)
* [ ] [apps/web/src/components/CalendarView.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/CalendarView.tsx) (Replaced by `components/events/EventCalendar.tsx`)
* [ ] [apps/web/src/components/EventForm.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/EventForm.tsx) (Unused form component)
* [ ] [apps/web/src/components/AIBadge.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/AIBadge.tsx) (Orphaned component)
* [ ] [apps/web/src/components/search/SearchBar.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/search/SearchBar.tsx) (Legacy search widget)
* [ ] [apps/web/src/components/search/RecommendationFeed.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/search/RecommendationFeed.tsx) (Legacy recommendation widget)
* [ ] [apps/web/src/components/search/EventResultCard.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/search/EventResultCard.tsx) (Legacy search result card)
* [ ] [apps/web/src/test_perm.txt](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/test_perm.txt) (Junk test file)

### 1.2 Backend Files & Experimental Scripts (`apps/api`)
* [ ] [apps/api/test-ollama.ts](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/test-ollama.ts) (Orphaned script)
* [ ] [apps/api/test-event-persistence.ts](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/test-event-persistence.ts) (Orphaned script)
* [ ] [apps/api/create-ext.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/create-ext.js) (Obsolete SQL script)
* [ ] [apps/api/seed-roles.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/seed-roles.js) (Replaced by `seed.ts`)
* [ ] [apps/api/migrate-roles.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/migrate-roles.js) (Legacy migrator)
* [ ] [apps/api/migrate-status.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/migrate-status.js) (Legacy migrator)
* [ ] [apps/api/update-roles-by-pattern.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/update-roles-by-pattern.js) (Legacy role auditor)

### 1.3 Root Workspace Files
* [ ] [replace-roles.js](file:///Users/maddy/Current%20Project/CuriousBees_V2/replace-roles.js) (Legacy string replacer)

---

## 🔍 Category 2: REVIEW BEFORE DELETE (Audits Required)

The following files represent duplications or empty packages. They should be reviewed, and references must be redirected before deletion:

### 2.1 Component Redundancy
* **`apps/web/src/components/shared/status-badge.tsx`**:
  * *Audit Task*: This duplicate should be removed, and any future status checks should reference the shared component in `@curiousbees/ui` (under [packages/ui/src/status-badge.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/packages/ui/src/status-badge.tsx)).
* **`apps/web/src/components/Logo.tsx`** vs **`apps/web/src/components/dashboard/Logo.tsx`**:
  * *Audit Task*: Modify the main layout pages to import a single unified Logo component (e.g. standardizing on the one in `src/components/Logo.tsx`), and delete the redundant `dashboard/Logo.tsx`.

### 2.2 Schema Cleanup
* **`Account`**, **`Session`**, **`VerificationToken`** in [schema.prisma](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/schema.prisma):
  * *Audit Task*: Remove these NextAuth.js models. Ensure that no database table locks or seeding scripts depend on them, then run `npm run db:migrate` or `prisma migrate dev` to drop them from Postgres.

### 2.3 Empty Workspaces
* **`packages/config`**:
  * *Audit Task*: Remove references to this empty workspace in the root `package.json` workspaces array before deleting the directory.

---

## 🔒 Category 3: KEEP (Do Not Touch)

These files constitute the core architecture, active dashboards, and infrastructure and must be protected:

* **Frontend Portals & Routes**: All active dashboard components (`dashboard/`, `profile/`, `researchers/`, `workspace/`, `threads/`, `reports/`, `notifications/`, `admin/`).
* **Backend NestJS Controller Modules**: Active REST endpoints (`comments/`, `opportunities/`, `auth/`, `publications/`, `prisma/`, `departments/`, `workspaces/`, `supervisors/`, `threads/`, `users/`, `events/`, `notifications/`, `reports/`).
* **Prisma Active Models**: `User`, `Department`, `Opportunity`, `CollaborationRequest`, `Workspace`, `Event`, `Publication`, `Report`, etc.
* **Shared Workspace Packages**: `@curiousbees/types`, `@curiousbees/constants`, `@curiousbees/shared-utils`, `@curiousbees/ui`.
* **Developer Scripts**: `scripts/db-setup.js`, `scripts/check-health.js`.
* **Workspace Configs**: `package.json` (root), `docker-compose.yml`, `.gitignore`, `tsconfig.json`.
* **Documentation**: All architecture, setup, troubleshooting, and audit manuals in `docs/` and `About/`.

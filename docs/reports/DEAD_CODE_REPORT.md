# CuriousBees V2 — Dead Code & Duplication Report

This report documents dead code, orphaned components, experimental files, unused packages, duplicate logic, and redundant database entities identified across the monorepo workspace.

---

## 🚫 1. Unused Files & Orphaned Components

The following files are defined in the repository but have no active references, import statements, or routes calling them. They are safe to remove.

### 1.1 Frontend Workspace (`apps/web`)
* **`src/components/Sidebar.tsx`**: Old sidebar structure. It has been replaced by the role-aware sidebar under [apps/web/src/components/dashboard/Sidebar.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/dashboard/Sidebar.tsx).
* **`src/components/CalendarView.tsx`**: A 470-line calendar component. It has been replaced by the refined [apps/web/src/components/events/EventCalendar.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/events/EventCalendar.tsx).
* **`src/components/EventForm.tsx`**: An events entry form that is never imported or mounted.
* **`src/components/AIBadge.tsx`**: An artificial intelligence indicator component. It is only imported in the unused `CalendarView.tsx` component, making it dead code.
* **`src/components/search/` (Entire Directory)**:
  * `SearchBar.tsx`
  * `RecommendationFeed.tsx`
  * `EventResultCard.tsx`
  * *Reason*: Leftovers of an old AI/semantic search experiment. They are never imported in active routes.
* **`src/test_perm.txt`**: A temporary 2-line test file containing "Perm check".

---

## ⚙️ 2. Dead Scripting & Database Utilities

The following scripts and utilities are legacy elements that are no longer referenced in core tasks or build triggers:

### 2.1 Backend Workspace (`apps/api`)
* **`test-ollama.ts`**: Tries to test the AI extractor service. It is broken because the `src/ai` folder it references has been deleted.
* **`test-event-persistence.ts`**: References the missing `src/ai` and `src/events/event-persistence.service` services. It is broken and dead code.
* **`create-ext.js`**: Connects to Postgres to create the `pgvector` extension. The extension is not referenced by any model in the current database schema.
* **`seed-roles.js`**: Legacy seeder. It has been replaced by the standard Prisma seeding module under [apps/api/prisma/seed.ts](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/seed.ts).
* **`migrate-roles.js`**: Legacy one-time SQL migration script to update roles from old string keys (`FACULTY`, `PHD_SCHOLAR`) to new enums.
* **`migrate-status.js`**: Legacy script to update user status fields.
* **`update-roles-by-pattern.js`**: Script to verify and update roles based on email syntax patterns.

### 2.2 Root Workspace
* **`replace-roles.js`**: A Node refactoring utility used to replace strings across the repository during database schema upgrades. It is no longer needed.

---

## 📦 3. Unused Packages & Dependencies

The following packages are listed in `package.json` dependencies but are never imported in code:

### 3.1 Backend Workspace (`apps/api/package.json`)
* **`next`**: Backend depends on Next.js frontend framework. This is a duplicate dependency and is unused by NestJS.
* **`nodemailer`**: Listed in dependencies, but `nodemailer` is never imported or configured to send mail in the codebase.
* **`axios`**: The backend does not make external HTTP requests and does not import Axios.

### 3.2 Frontend Workspace (`apps/web/package.json`)
* **`@nestjs/cli`**: The frontend package.json lists the NestJS backend command-line tool as a runtime dependency. This is incorrect.

### 3.3 Shared Workspace (`packages/`)
* **`packages/config/`**: An empty package containing only a `package.json` with name `@curiousbees/config`. It contains no files and is never imported.

---

## 🗄️ 4. Unused Database Schema Tables

In [apps/api/prisma/schema.prisma](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/schema.prisma):
* **`Account`**, **`Session`**, **`VerificationToken`**:
  * These are standard NextAuth.js v5 schema tables. 
  * The project was updated to use **Firebase Authentication** on both the frontend and backend, rendering these tables completely unused.

---

## 🔄 5. Duplicate Components & Logic

The following modules contain redundant implementations of identical features:

### 5.1 Status Chips
* **`apps/web/src/components/shared/status-badge.tsx`** vs **`packages/ui/src/status-badge.tsx`**:
  * These files are 99% identical. 
  * The only difference is the import path of the class merger helper (`@/lib/utils` in the app, `./utils` in the UI package).
  * *Recommendation*: Delete the frontend copy and import `StatusBadge` from the `@curiousbees/ui` package.

### 5.2 Logo Rendering
* **`apps/web/src/components/Logo.tsx`** vs **`apps/web/src/components/dashboard/Logo.tsx`**:
  * These render identical SVGs.
  * The only differences are minor typography class overrides.
  * *Recommendation*: Standardize on a single `Logo` component.

### 5.3 Utilities
* **`apps/web/src/lib/utils.ts`** vs **`packages/ui/src/utils.ts`**:
  * Both define the exact same Tailwind CSS class merger utility (`cn`).

### 5.4 Inline Role Badge Styles
* **`apps/web/src/app/(portal)/threads/[id]/page.tsx`**:
  * Declares a local function `getRoleBadge` to return Tailwind styles for user roles instead of importing the existing `<RoleBadge />` component defined in [apps/web/src/components/shared/role-badge.tsx](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/web/src/components/shared/role-badge.tsx).

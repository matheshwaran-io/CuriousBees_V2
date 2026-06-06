# CuriousBees V2 — Feature Alignment Report

This report evaluates the monorepo against the core CuriousBees product vision, mapping active files to required features and identifying legacy remnants that do not align with current requirements.

---

## 🗺️ 1. Active Feature Mapping

The table below maps the directory nodes and source modules in CuriousBees V2 to the core product requirements:

| Required Feature | Frontend Route / Component | Backend REST Module | Status & Notes |
| :--- | :--- | :--- | :--- |
| **Research Scholar Portal** | `app/(portal)/dashboard` | `/api/users/onboard` | **Fully Aligned**. Accessible under scholar role, displays milestone trackers. |
| **Research Supervisor Portal** | `app/(portal)/my-scholars` | `/api/supervisors` | **Fully Aligned**. Managing scholar milestones & approvals queue. |
| **Institutional Admin Portal** | `app/(portal)/admin/dashboard` | `/api/users/all` | **Fully Aligned**. Overview statistics dashboard for administrators. |
| **Researchers Directory** | `app/(portal)/researchers` | `/api/users/supervisors` | **Fully Aligned**. Renders researcher matching index. |
| **Opportunities Board** | `app/(portal)/opportunities` | `/api/opportunities` | **Fully Aligned**. Allows supervisors to list funding calls. |
| **Workspace (Sandboxes)** | `app/(portal)/workspace` | `/api/workspaces` | **Fully Aligned**. Document sharing, chats, and milestones tracking. |
| **Research Discussion Feed** | `app/(portal)/threads` | `/api/threads` | **Fully Aligned**. Discussion forums and comment chains. |
| **Academic Events** | `app/(portal)/events` | `/api/events` | **Fully Aligned**. Calendar scheduling and coordinator events approvals. |
| **Publications Tracker** | `app/(portal)/publications` | `/api/publications` | **Fully Aligned**. Scholar journal publications entry and counts. |
| **Milestone Reports** | `app/(portal)/reports` | `/api/reports` | **Fully Aligned**. PDF report submissions and supervisor verification logs. |
| **Notifications** | `app/(portal)/notifications` | `/api/notifications` | **Fully Aligned**. Firebase cloud push and preference controls. |
| **Departments** | `app/(portal)/admin/departments` | `/api/departments` | **Fully Aligned**. SRMIST departments management index. |
| **Analytics Dashboard** | `app/(portal)/admin/analytics` | `/api/users/audit-logs` | **Fully Aligned**. Renders activity graphs. |
| **User Management** | `app/(portal)/admin/users` | `/api/users/:id/suspend` | **Fully Aligned**. Admin account approval & suspension controller. |

---

## 🚫 2. Legacy / Non-Aligned Files

The following sections contain files representing deprecated features, legacy auth experiments, or retired integrations that are no longer part of the CuriousBees V2 architecture:

### 2.1 NextAuth.js v5 Leftovers
* **Remnants**: `Account`, `Session`, `VerificationToken` models in [schema.prisma](file:///Users/maddy/Current%20Project/CuriousBees_V2/apps/api/prisma/schema.prisma).
* **Alignment Analysis**: NextAuth.js has been completely replaced by Firebase Authentication. These tables are never written to or queried, but they are still generated in the database schema.

### 2.2 Deprecated AI / Ollama Integrations
* **Remnants**:
  * `apps/api/test-ollama.ts`
  * `apps/api/test-event-persistence.ts`
  * `apps/api/create-ext.js`
* **Alignment Analysis**: These scripts were created during experiments with local LLMs (Ollama) and PostgreSQL vector search extensions (`pgvector`). Because these features were replaced by standard form structures and PostgreSQL queries, these files are now orphaned.

### 2.3 Legacy Database Migrators & Seeders
* **Remnants**:
  * `apps/api/migrate-roles.js`
  * `apps/api/migrate-status.js`
  * `apps/api/seed-roles.js`
  * `apps/api/update-roles-by-pattern.js`
  * `replace-roles.js` (root)
* **Alignment Analysis**: These files were created for one-time migrations and role replacements during repository upgrades. They are no longer run and should be archived or deleted to avoid developer confusion.

### 2.4 Temporary Testing Junk
* **Remnants**: `apps/web/src/test_perm.txt`.
* **Alignment Analysis**: Temporary text file left behind from permission testing.

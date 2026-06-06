# CuriousBees V2 — Repository Map

This document outlines the directory structure, architectural modules, active pages, API routes, database schemas, and shared dependencies of the **CuriousBees V2** monorepo.

---

## 📂 1. Directory Tree Overview

```
.
├── .github/                       # Pull Request & Issue templates
├── About/                         # Setup diagrams and high-level installation guides
├── apps/
│   ├── api/                       # NestJS Backend API
│   └── web/                       # Next.js Frontend Application
├── docs/                          # Architecture, deployment, and troubleshooting guides
├── packages/                      # Shared workspace libraries
│   ├── config/                    # Shared configurations (Empty/Legacy)
│   ├── constants/                 # Shared global constants
│   ├── shared-utils/              # Shared Zod validators & helpers
│   ├── types/                     # Shared TypeScript interfaces
│   └── ui/                        # Shared UI component design tokens
├── scripts/                       # Cross-platform developer utility scripts
├── supabase/                      # Database raw migrations and schemas
├── docker-compose.yml             # Local PostgreSQL & Redis container orchestration
├── package.json                   # Monorepo workspaces definition and root tasks
└── README.md                      # Developer quickstart and project portal
```

---

## 🌐 2. Frontend Workspace (`apps/web`)

The frontend is a **Next.js 15** application styled using Tailwind CSS and using Zustand for client-side state management.

### 2.1 Route Map (Next.js App Router)
* **`(marketing)`** (Public routes with global header/footer)
  * `/` (Home landing page)
  * `/about` (Platform overview)
  * `/contact` (Support request form)
  * `/education` (Research portal details)
  * `/ethics-framework` (SRMIST ethics compliance standard)
  * `/institution` (University integration roadmap)
  * `/terms-of-service` & `/privacy-policy` (Legal guidelines)
* **`(auth)`** (Onboarding & session validation)
  * `/login` & `/signin` & `/signup` (Authentication screens)
  * `/onboarding` (Wizard sequence for profile mapping)
  * `/verification-pending` (Awaiting supervisor/admin approval page)
* **`(portal)`** (Main authenticated dashboards, wrapped in layout with sidebar and role header)
  * `/dashboard` (Role-aware portal landing)
  * `/profile` (User CV, statistics, and interests)
  * `/researchers` (Faculty directory and collaboration matching)
  * `/opportunities` (PI-posted research openings and application flows)
  * `/workspace` & `/workspace/[id]` (Active joint research sandboxes)
  * `/threads` & `/threads/[id]` & `/threads/create` (Academic discussion boards)
  * `/events` (Academic calendars and scheduling)
  * `/publications` (Scholar publication journals)
  * `/reports` (Milestone reporting & supervisor approval queue)
  * `/notifications` (FCM push preferences & notifications logs)
  * `/approval-requests` (Admin pending supervisor/scholar reviews)
  * **`admin/`** (Institution Administrator controls)
    * `admin/dashboard` (Administrative statistics overview)
    * `admin/users` (Account suspensions and roles management)
    * `admin/supervisors` (Supervisor database records management)
    * `admin/departments` (SRMIST departments management)
    * `admin/analytics` (Platform activity charts)
    * `admin/settings` (System configuration toggles)

### 2.2 Frontend State & Library Structure
* **State Store (`src/store/useStore.ts`)**: Unified client state managing user sessions, active roles, notifications lists, and developer bypass parameters.
* **API Client (`src/lib/api-client.ts`)**: Axios-based client that passes the active developer token header (`Authorization: Bearer dev-role:<role>`) when `NEXT_PUBLIC_DEVELOPMENT_MODE` is active.
* **Authentication Drivers**:
  * `src/lib/firebase.ts` (Firebase Client SDK)
  * `src/lib/supabase.ts` (Supabase client for direct database interactions)

---

## 📡 3. Backend Workspace (`apps/api`)

The backend is built on **NestJS 11** and connects to the PostgreSQL database via **Prisma ORM**.

### 3.1 Controller Modules & API Routes
* **`AuthController` (`/api/auth`)**: Handles session configuration and database user onboarding validations.
* **`UsersController` (`/api/users`)**: Profile updates, role switches, and account listings.
* **`SupervisorsController` (`/api/supervisors`)**: Supervisor verification actions.
* **`DepartmentsController` (`/api/departments`)**: Managing departments lists.
* **`OpportunitiesController` (`/api/opportunities`)**: Publishing research openings and processing applications.
* **`WorkspacesController` (`/api/workspaces`)**: Creating sandboxes, sharing files, and posting milestones.
* **`ThreadsController` (`/api/threads`)** & **`CommentsController` (`/api/comments`)**: Forums processing.
* **`EventsController` (`/api/events`)**: Event calendar schedules and approvals.
* **`PublicationsController` (`/api/publications`)**: Managing scholar publications logs.
* **`ReportsController` (`/api/reports`)**: Tracking academic reports and feedback.
* **`NotificationsController` (`/api/notifications`)**: FCM registration, subscription preferences, and messaging queues.

### 3.2 Guards & Security Filters
* **`FirebaseGuard`**: Intercepts authorization headers and decodes Firebase user tokens. (Bypassed in `DEVELOPMENT_MODE`).
* **`ApprovedGuard`**: Checks if the user's approval status is `APPROVED`.
* **Role Guards**:
  * `ScholarGuard` (Restricts routes to `RESEARCH_SCHOLAR`)
  * `SupervisorGuard` (Restricts routes to `RESEARCH_SUPERVISOR`)
  * `AdminGuard` (Restricts routes to `INSTITUTION_ADMIN`)

---

## 🗄️ 4. Prisma Database Schema (`schema.prisma`)

* **Enums**: `Role` (RESEARCH_SCHOLAR, RESEARCH_SUPERVISOR, INSTITUTION_ADMIN), `ApprovalStatus` (PENDING, PUBLISHED, REJECTED, NEEDS_INFO), `EventStatus` (DRAFT, PUBLISHED, REVIEW_REQUIRED, FAILED), `EventPriority` (LOW, MEDIUM, HIGH, CRITICAL).
* **Core Tables**:
  * `User`: Profiles, role tags, approval statuses, and connections.
  * `Department`: SRMIST department categories.
  * `ResearchInterest` & `UserInterest`: Mappings for researcher match-making.
  * `Thread` & `Comment`: Discussion board data.
  * `Opportunity` & `CollaborationRequest`: Faculty research opening logs and scholar applications.
  * `Workspace` & relations (`WorkspaceMember`, `WorkspaceFile`, `WorkspaceMilestone`, `WorkspaceAnnouncement`): Shared joint workspace boards.
  * `Event`: Calendar notifications.
  * `Notification` & `NotificationLog` & `UserPreference`: Push subscription details.
  * `Publication`: Journal entries.
  * `Report`: Milestone progress documents.
  * `AuditLog`: Admin activity records.
* **Legacy Tables**:
  * `Account`, `Session`, `VerificationToken` (Unused NextAuth standard structures).

---

## 📦 5. Shared Workspaces & Packages

* **`@curiousbees/types`**: Type declarations for models, inputs, and REST request/response structures.
* **`@curiousbees/constants`**: Holds global identifiers (e.g. cookie name `cb-role` used in middleware checks).
* **`@curiousbees/shared-utils`**: Centralizes Zod validation rules (`CreateThreadSchema`, `CreateCommentSchema`, `CreateOpportunitySchema`, `UpdateProfileSchema`) and the list of departments (`SRM_DEPARTMENTS`).
* **`@curiousbees/ui`**: Hosts common components like `TagPill` and `StatusBadge`.

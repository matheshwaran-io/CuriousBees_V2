# Admin-Managed Google Authentication & Role-Based Access Control (RBAC)

This documentation outlines the design and implementation details of the Admin-Managed User Provisioning System, introduced to replace self-registration and email/password authentication workflows.

---

## 1. System Overview

In this system:
1. **Google Sign-In Only**: Clerk acts strictly as an Identity Provider (IdP). Custom credentials (email/password), passwords reset, and self-registration are removed.
2. **Pre-Provisioning**: Users must be pre-created in the PostgreSQL database (either manually by an Administrator or via bulk spreadsheets import).
3. **Identity Association**: Upon first login via Google, the system matches the Clerk user's email with the pre-provisioned PostgreSQL database record, auto-linking the Clerk ID (`clerkId`) to the user.
4. **Access Denied Fallback**: If an email address is not pre-provisioned, the login request is rejected with `USER_NOT_PROVISIONED`, and they are redirected to `/not-provisioned`.

---

## 2. Configuration & Feature Flags

The system implements a feature-flag approach to allow toggling between the legacy self-registration flow and the new admin-managed Google provisioning workflow.

| Variable | Recommended Value | Scope | Description |
| :--- | :--- | :--- | :--- |
| `AUTH_MODE` | `GOOGLE_ADMIN_MANAGED` | Backend | Enable the new admin-managed auth flow. Remove/unset for legacy mode. |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` | `srmist.edu.in,gmail.com` | Both | Comma-separated list of allowed email domains. |

---

## 3. Database Schema

The Prisma database schema is refactored to support robust roles and statuses:

```prisma
enum Role {
  ADMIN
  SUPERVISOR
  SCHOLAR
}

enum UserStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

### User Model Extensions
```prisma
model User {
  id              String      @id @default(cuid())
  clerkId         String?     @unique
  name            String?
  email           String      @unique
  role            Role        @default(SCHOLAR)
  status          UserStatus  @default(PENDING)
  departmentId    String?
  supervisorId    String?
  supervisor      User?       @relation("SupervisorScholars", fields: [supervisorId], references: [id])
  scholars        User[]      @relation("SupervisorScholars")
}
```

---

## 4. Role-Based Access Control (RBAC) Architecture

### Backend Protection (NestJS)

We implement custom decorators and guards under `apps/api/src/auth/roles/`:

1. **`@Roles(Role.ADMIN)`**: Restricts access to specific endpoints.
2. **`RolesGuard`**: Validates the authenticated user's role against required roles. Supports backward compatibility mapping (`INSTITUTE_ADMIN` -> `ADMIN`).
3. **`ClerkAuthGuard`**: Intercepts authentication, performs email validation, domain checking, pre-provision checks, and suspension checking.

### Protected API Endpoints

#### Admin APIs
* `GET    /api/admin/users` - List all users.
* `POST   /api/admin/users` - Pre-provision a single user.
* `PUT    /api/admin/users/:id` - Update user details, roles, or statuses.
* `DELETE /api/admin/users/:id` - Delete user.
* `POST   /api/admin/users/import` - Bulk upload CSV/XLSX files.

#### Supervisor APIs
* `GET  /api/supervisor/pending-scholars` - Fetch scholars awaiting approval.
* `PUT  /api/supervisor/approve/:id` - Approve scholar under guidance.
* `PUT  /api/supervisor/reject/:id` - Reject scholar request.

---

## 5. Frontend Navigation Guarding (Next.js)

### Status Redirection Matrix

When a user signs in, `/api/auth/me` verifies their profile and returns the corresponding access permissions. The global portal layout enforces automatic redirects based on the user's status:

| User Status / Condition | Redirect Target | Description |
| :--- | :--- | :--- |
| `PENDING` | `/approval-pending` | Scholar waiting for supervisor approval. |
| `REJECTED` | `/access-denied` | Scholar rejected by supervisor. |
| `SUSPENDED` | `/account-suspended` | Account suspended by administrator. |
| Unprovisioned Email | `/not-provisioned` | Google account has not been pre-provisioned by Admin. |

### Path Protection
* `/admin/*` and `/institute-admin/*` paths are restricted to `ADMIN` (and `INSTITUTE_ADMIN`).
* `/supervisor/*` paths are restricted to `SUPERVISOR`.
* `/scholar/*` and `/dashboard` paths are restricted to `SCHOLAR`.

---

## 6. Bulk Import Specification

Administrators can upload users in bulk at `/admin/users/import`.

### Format Requirements
The uploaded file (CSV or XLSX) must contain a header row with the following column headers (case-insensitive):
* `name`: User's full name.
* `email`: Institutional email address (must belong to an allowed domain).
* `role`: User role (`ADMIN`, `SUPERVISOR`, or `SCHOLAR`).
* `department`: Department code or name (must match a department in the database).
* `supervisor_email`: Supervisor email address (required **only** for `SCHOLAR` role).

### Validation Schema
* **Duplicate Email Validation**: Blocks rows containing emails already registered in the database or duplicated within the same spreadsheet.
* **Role Check**: Rejects rows with invalid roles.
* **Supervisor Mapping**: Ensures every scholar's supervisor is either already in the database or defined as a supervisor within the same upload batch.
* **Department Matching**: Ensures the department matches existing database entries.

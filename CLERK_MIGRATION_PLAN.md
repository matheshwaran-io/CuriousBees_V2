# CuriousBees V2 — Clerk Authentication Migration Plan

This document outlines the architectural plan to migrate the CuriousBees V2 monorepo's authentication provider from **Firebase Authentication** to **Clerk Authentication** while preserving all non-auth Firebase capabilities (Firebase Cloud Messaging/FCM and Push Notifications), the database, user records, and role-based access control (RBAC) logic.

---

## 1. Executive Summary & Architecture Overview

The objective is to replace the authentication responsibilities of Firebase with Clerk, ensuring a modern, secure, and developer-friendly authentication system.

### Core Architectural Commitments
1. **Retain FCM/Push Notifications**: The Firebase Admin SDK on the backend and Firebase Client SDK on the frontend will be kept **strictly initialized** and active *solely* for device registration and notification dispatch.
2. **Preserve User Records & RBAC**: Existing PostgreSQL database user records, including roles (`RESEARCH_SCHOLAR`, `RESEARCH_SUPERVISOR`, `INSTITUTION_ADMIN`), status settings, and approval logic, remain unchanged.
3. **Decouple Auth Responsibilities**: Firebase Authentication APIs (`signInWithPopup`, Google Auth Provider, backend token verification) will be completely removed and replaced by Clerk's Next.js and backend integrations.

### Target Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Research Scholar / Supervisor
    participant FE as Next.js Frontend (Clerk SDK)
    participant Clerk as Clerk Auth Service
    participant BE as NestJS Backend (Clerk Guard)
    participant DB as PostgreSQL Database (Prisma)

    User->>FE: Click "Login with Google"
    FE->>Clerk: Redirect/Popup OAuth (SRMIST Workspace)
    Clerk-->>FE: Return Session Token (JWT JWT)
    FE->>BE: API Request with Bearer Token (Clerk JWT)
    Note over BE: ClerkAuthGuard verifies JWT<br/>using cached JWKS keys
    BE->>DB: Query User by Email
    alt User exists but no clerkId (existing Firebase user)
        BE->>DB: Link clerkId to user record (Self-Healing Sync)
    else User does not exist (new user)
        BE->>DB: JIT Create user with clerkId & status=ONBOARDING
    end
    BE-->>FE: Return User Session Profile (Zustand Sync)
    FE->>User: Grant Portal Dashboard Access
```

---

## 2. Audited Firebase & Auth Components

An analysis of the repository identified the following usage patterns and components:

### 1. Firebase Authentication Usage
- **Client SDK**: Utilized in `apps/web/src/lib/firebase.ts` to export the `auth` service instance, initialize the `GoogleAuthProvider`, and execute `signInWithPopup` and `signOut`.
- **Zustand Store**: The auth state lifecycle is managed inside `apps/web/src/store/useStore.ts`, which listens to auth changes and dispatches tokens to backend endpoints.

### 2. Firebase Admin SDK Usage
- **Authentication**: Used in `apps/api/src/auth/firebase-admin.service.ts` via `admin.auth().verifyIdToken(token)` to verify the client's JWT token.
- **Messaging (FCM)**: Used in `apps/api/src/notifications/fcm.service.ts` and `apps/api/src/notifications/notifications.service.ts` for sending targeted/multicast push notifications.
- **Architectural Check**: Since the Admin SDK is required for FCM, **the Firebase Admin SDK must remain initialized**. Only the token verification method `verifyToken` will be deleted.

### 3. Firebase Guards
- **Backend Guard**: `FirebaseAuthGuard` inside `apps/api/src/auth/firebase.guard.ts` intercepts requests, extracts the authorization header token, verifies it, JIT syncs user profiles with PostgreSQL, and injects the database `User` object into the request (`request.user`).

### 4. Firebase Middleware
- **Next.js Middleware**: No server-side Next.js edge middleware file (`middleware.ts`) is currently implemented. The frontend relies entirely on client-side route protection.

### 5. Firebase User Sync
- **JIT Sync Flow**: The backend `FirebaseAuthGuard` handles automatic syncing. If a verified email is not in the database, it creates a `User` record with role default configurations (`RESEARCH_SCHOLAR`) and a status of `ONBOARDING` (or `APPROVED` for default admin and mock roles).

### 6. Firebase Session Logic
- **Client Session**: Managed inside `apps/web/src/lib/api-client.ts` via an active listener `onAuthStateChanged` which resolves a cached promise (`waitForAuth`) to fetch the Firebase token.

### 7. Login Pages
- **Route**: `apps/web/src/app/(auth)/login/page.tsx` contains a Google Sign-in button trigger, displaying error details and providing the local sandbox bypass options for developer roles.

### 8. Auth Contexts
- **Zustand Store**: Global states (e.g. `currentUser`, `isLoading`, and the `syncUserSession` action) are housed in `apps/web/src/store/useStore.ts`.

### 9. Protected Routes
- **Portal Layout**: `apps/web/src/app/(portal)/layout.tsx` wraps all logged-in views. It checks if the `currentUser` exists, triggers syncing if empty, and redirects unauthenticated users to `/login`, onboarding users to `/onboarding`, and unapproved users to `/verification-pending`.

### 10. Role Logic
- **RBAC Validation**: NestJS role guards (`AdminGuard`, `SupervisorGuard`, `ScholarGuard`, and `ApprovedGuard`) execute post-authentication checks using the `request.user` injected by the auth guard. They do not interface with Firebase directly.

---

## 3. Target Architecture & Environment Configuration

### Env Variables Configuration (`.env`)

To complete the migration, we will deprecate Firebase Auth environment variables and introduce Clerk variables. **Crucially, FCM-related variables must be preserved.**

```bash
# ==========================================
# DEPRECATED VARIABLES (Remove during migration)
# ==========================================
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."

# ==========================================
# PRESERVED VARIABLES (Keep for FCM Push Notifications)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-fcm-vapid-key"

FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# ==========================================
# NEW VARIABLES (Add for Clerk Integration)
# ==========================================
# Frontend Clerk configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"

# Backend Clerk JWT Validation
CLERK_JWKS_URL="https://api.clerk.com/v1/jwks"
```

---

## 4. Impact Assessment

### 1. Database Impact
- **Prisma Schema (`schema.prisma`)**:
  - The `firebaseUid` field on the `User` model will be renamed to `clerkId`.
  - A database migration will be run to safely rename the column while preserving all data.
- **Prisma Schema Migration Diff**:
  ```diff
  model User {
    id            String          @id @default(cuid())
  - firebaseUid   String?         @unique
  + clerkId       String?         @unique
    name          String?
    email         String          @unique
  ```
- **PostgreSQL Migration**:
  ```sql
  ALTER TABLE "User" RENAME COLUMN "firebaseUid" TO "clerkId";
  ```

### 2. API Impact
- **Endpoint Contracts**: The backend endpoints remain unchanged.
- **Authorization Header**: API requests will transition from using Firebase ID tokens to Clerk Session JWT tokens.
- **Validation Overhead**: Low. Since JWT validation relies on Clerk's JWKS public keys, the backend can cache keys locally, minimizing external network requests for token validation.

### 3. Frontend Impact
- **SDK Installation**: Introduce `@clerk/nextjs` to manage session cookies, login buttons, and OAuth handshakes.
- **Session State**: Zustand (`useStore.ts`) will fetch tokens using the Clerk `getToken()` method instead of the Firebase listener, streamlining the client-side authentication code.
- **Developer Bypass**: The `AUTH_MODE=bypass` developer mode and local role override functionality (in `LoginPage` and `PortalLayout`) will be fully preserved.

### 4. Backend Impact
- **SDK Installation**: Add `@clerk/backend` to verify JWT signatures in the guard.
- **Guard Validation**: The NestJS guard will decode Clerk JWT tokens, read the email and Clerk user ID, perform the database checks, and JIT sync the user.

### 5. Notification Impact (FCM)
- **FCM Architecture**: No impact. Frontend tokens are still fetched using standard Firebase web SDK messaging APIs and uploaded to `/api/notifications/register-token`. The backend continues utilizing `firebase-admin` to send push notifications.

---

## 5. File-by-File Refactoring Map

| File Path | Change Type | Modification Details |
| :--- | :--- | :--- |
| **`apps/web/package.json`** | `MODIFY` | Add `@clerk/nextjs` dependency. |
| **`apps/api/package.json`** | `MODIFY` | Add `@clerk/backend` dependency. |
| **`apps/api/prisma/schema.prisma`** | `MODIFY` | Rename `firebaseUid` field to `clerkId`. |
| **`packages/types/index.ts`** | `MODIFY` | Update the `User` interface to replace `firebaseUid` with `clerkId`. |
| **`apps/web/src/app/layout.tsx`** | `MODIFY` | Wrap `RootLayout` with `<ClerkProvider>` from `@clerk/nextjs`. |
| **`apps/web/src/lib/firebase.ts`** | `MODIFY` | Remove imports from `firebase/auth`. Remove client-side auth methods. Keep Firebase App initialization for FCM client access. |
| **`apps/web/src/lib/api-client.ts`** | `MODIFY` | Update `getAuthHeaders` to use Clerk `window.Clerk.session.getToken()` or next-auth session tokens instead of Firebase listener. |
| **`apps/web/src/store/useStore.ts`** | `MODIFY` | Update `syncUserSession` to handle Clerk-based auth tokens and update local mock references. Modify `logout` to execute Clerk `signOut()`. |
| **`apps/web/src/app/(auth)/login/page.tsx`** | `MODIFY` | Replace Firebase Google Login trigger with Clerk custom sign-in button or Clerk client actions. |
| **`apps/api/src/auth/firebase-admin.service.ts`** | `REPLACE` | Refactor into a `ClerkService` (or configure inline guard validation) that verifies JWT tokens against Clerk's JWKS endpoint. |
| **`apps/api/src/auth/firebase.guard.ts`** | `REPLACE` | Rename/replace with `ClerkAuthGuard` executing Clerk token validation, JIT database user synchronization, and request user injection. |
| **`apps/api/src/auth/auth.module.ts`** | `MODIFY` | Update module exports to use `ClerkAuthGuard` and `ClerkService`. |
| **`scripts/doctor.js`** | `MODIFY` | Replace Firebase auth environment key assertions with Clerk environment key validation. Keep Firebase FCM keys validation. |

---

## 6. Detailed Migration Strategy

### Step 1: Clerk Instance Setup
1. Create a project in the Clerk Dashboard.
2. Enable the **Google OAuth Social Connection**. Configure it to restrict access to the institution's domain if required (e.g. `srmist.edu.in`).
3. Customize the Clerk JWT template (optional) to embed standard claims such as `email`, `name`, and `picture` in the default session token.

### Step 2: Database Migration (Self-Healing JIT Matching)
To ensure zero disruption and keep existing user records:
1. Run the Prisma migration renaming `firebaseUid` to `clerkId`.
2. Existing records will have `clerkId = null`.
3. In `ClerkAuthGuard`, match incoming requests by **email**. If a matching email is found but `clerkId` is null, write the Clerk ID (`sub` claim) to the `clerkId` column. This is a **phased self-healing migration** requiring zero database write scripts.

### Step 3: Developer Override Preservation
The migration will preserve the bypass mode:
1. When `process.env.AUTH_MODE === 'bypass'` is set, both frontend `PortalLayout` and backend `ClerkAuthGuard` will bypass Clerk verification.
2. They will continue to read the mock role tokens from `localStorage` and inject mock user objects (`dev-user` with `RESEARCH_SCHOLAR`, `RESEARCH_SUPERVISOR`, or `INSTITUTION_ADMIN` roles).

---

## 7. Rollback Strategy

In the event of critical issues during deployment, a rollback can be executed using the following checklist:

1. **Revert Environment Keys**:
   - Restore the Firebase Admin SDK and Client SDK authentication environment variables.
   - Set the `AUTH_MODE` and backend guards to look for Firebase credentials.
2. **Revert DB Column**:
   - Maintain the database schema mapping or run a migration to rename `clerkId` back to `firebaseUid` (the database values migrated JIT will not affect this since they represent unique IDs). Alternatively, design the schema to support *both* columns temporarily to allow hot-swapping during the migration week.
3. **Revert Guards and Providers**:
   - Revert code changes on the `main` branch to the pre-migration commit.

---

## 8. Estimated Effort

| Task Phase | Estimated Time |
| :--- | :--- |
| **Phase 1: Clerk Configuration & Environment Keys** | 2 Hours |
| **Phase 2: Prisma Schema Renaming & DB Migration** | 2 Hours |
| **Phase 3: Backend Clerk JWT Integration (`ClerkAuthGuard`)** | 6 Hours |
| **Phase 4: Frontend Clerk SDK Wrapper & Store Updates** | 6 Hours |
| **Phase 5: Login Page Refactoring** | 4 Hours |
| **Phase 6: Verification & Developer Bypass Validation** | 4 Hours |
| **Total Estimated Effort** | **24 Hours (~1.5 Sprints)** |

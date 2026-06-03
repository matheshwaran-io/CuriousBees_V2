/**
 * lib/auth/role-mapping.ts
 *
 * DEV-ONLY: Static email → role mapping for local dashboard testing.
 *
 * Architecture note: This file is the ONLY place that needs to change when
 * production RBAC lands. Replace `DEV_ROLE_MAP` lookup with a
 * `getUserRoleFromDB(email)` async call — all callers stay identical.
 */

import type { UserRole } from '@curiousbees/types';

// ─── Dev Role Map ─────────────────────────────────────────────────────────────
// Maps known developer/test emails to their platform roles.
// In production: replace this with a database-backed RBAC lookup.

export const DEV_ROLE_MAP: Record<string, UserRole> = {
  'mrmatheshwaran17@gmail.com': 'RESEARCH_SUPERVISOR',
  'r.matheshwaran.io@gmail.com': 'RESEARCH_SCHOLAR',
  'maddybgmistoreog@gmail.com': 'INSTITUTION_ADMIN',
} as const;

// ─── Role Labels (human-readable) ────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  RESEARCH_SUPERVISOR: 'Supervisor',
  RESEARCH_SCHOLAR: 'Scholar',
  INSTITUTION_ADMIN: 'Admin',
};

// ─── Core resolver ───────────────────────────────────────────────────────────

/**
 * Returns the platform role for a given email.
 *
 * Dev: resolves from the static DEV_ROLE_MAP.
 * Prod: swap this implementation with a DB call — callers are unaffected.
 *
 * @returns The UserRole if the email is mapped, null otherwise (access denied).
 */
export function getRoleForEmail(email: string): UserRole | null {
  const normalized = email.trim().toLowerCase();
  return DEV_ROLE_MAP[normalized] ?? null;
}

/**
 * Returns true if the given email is in the allowed dev mapping.
 * Unmapped emails should be redirected to /login?error=access_denied.
 */
export function isEmailAllowed(email: string): boolean {
  return getRoleForEmail(email) !== null;
}

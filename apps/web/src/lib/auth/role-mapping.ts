/**
 * lib/auth/role-mapping.ts
 *
 * DEV-ONLY: Static email → role mapping for local dashboard testing.
 */

import type { UserRole } from '@curiousbees/types';

// ─── Role Labels (human-readable) ────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  RESEARCH_SUPERVISOR: 'Supervisor',
  RESEARCH_SCHOLAR: 'Scholar',
  INSTITUTE_ADMIN: 'Admin',
};

// ─── Core resolver ───────────────────────────────────────────────────────────

/**
 * Returns the platform role for a given email dynamically based on development patterns.
 *
 * @returns The UserRole resolved from email pattern.
 */
export function getRoleForEmail(email: string): UserRole {
  const normalized = email.trim().toLowerCase();
  const username = normalized.split('@')[0];

  if (normalized === 'r.matheshwaran.io@gmail.com') {
    return 'INSTITUTE_ADMIN';
  }

  if (username.includes('.')) {
    return 'INSTITUTE_ADMIN';
  } else if (/[a-zA-Z]/.test(username) && /[0-9]/.test(username)) {
    return 'RESEARCH_SCHOLAR';
  } else if (/^[a-zA-Z]+$/.test(username)) {
    return 'RESEARCH_SUPERVISOR';
  }

  return 'RESEARCH_SCHOLAR';
}

/**
 * Returns true if the email maps to a valid role. Since pattern-based routing
 * resolves a role for all inputs, this helper is preserved and always returns true.
 */
export function isEmailAllowed(email: string): boolean {
  return true;
}

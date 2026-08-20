/**
 * lib/auth/role-mapping.ts
 *
 * DEV-ONLY: Static email → role mapping for local dashboard testing.
 */

import type { UserRole } from '@curiousbees/types';

// ─── Role Labels (human-readable) ────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  INSTITUTE_ADMIN: 'Institute Admin',
  RESEARCH_SUPERVISOR: 'Research Supervisor',
  RESEARCH_SCHOLAR: 'Research Scholar',
};

// ─── Core resolver ───────────────────────────────────────────────────────────

/**
 * Returns the platform role for a given email dynamically based on development patterns.
 *
 * @returns The UserRole resolved from email pattern.
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  'curiousbees@srmist.edu.in',
  'r.matheshwaran.io@gmail.com',
];

export function getRoleForEmail(email: string): UserRole {
  const normalized = email.trim().toLowerCase();

  if (AUTHORIZED_ADMIN_EMAILS.includes(normalized)) {
    return 'INSTITUTE_ADMIN';
  }

  const username = normalized.split('@')[0];
  if (/[a-zA-Z]/.test(username) && /[0-9]/.test(username)) {
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

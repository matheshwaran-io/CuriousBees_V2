/**
 * Centralized API Client for CuriousBees V2
 *
 * All API requests MUST go through here. This module:
 *   1. Resolves the backend base URL from the env variable.
 *   2. Automatically attaches the Firebase ID token as a Bearer header.
 *   3. Safely parses JSON and never tries to parse HTML error pages.
 *   4. Provides verbose console logging for debugging.
 */

import { auth } from '@/lib/firebase';

// Backend base URL — set in apps/web/.env.local
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Token helper ────────────────────────────────────────────────────────────

/**
 * Returns the Firebase Bearer token for the currently authenticated user,
 * or falls back to the local mock token used in development.
 *
 * Returns an empty object when there is no authenticated user (guest mode).
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;

  if (user) {
    try {
      const token = await user.getIdToken(/* forceRefresh */ true);
      console.debug('[APIClient] Attaching Firebase bearer token:', {
        uid: user.uid,
        email: user.email,
        tokenLength: token.length,
      });
      return { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.warn('[APIClient] Failed to retrieve Firebase ID token:', err);
    }
  }

  // Local development bypass
  if (typeof window !== 'undefined') {
    const mockToken = localStorage.getItem('curiousbees-mock-token');
    if (mockToken) {
      console.debug('[APIClient] Using local mock bypass token.');
      return { Authorization: `Bearer ${mockToken}` };
    }
  }

  console.warn('[APIClient] No auth token available — request will be unauthenticated.');
  return {};
}

// ─── Response helper ─────────────────────────────────────────────────────────

/**
 * Safely reads a Response as JSON.
 * Checks Content-Type first to avoid crashing on HTML error pages (401, 302, etc.).
 */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `[APIClient] Expected JSON but received "${contentType}" (HTTP ${res.status}). Body preview: ${text.slice(0, 200)}`
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Reads error details from a failed response.
 * Never throws — returns an empty string on failure.
 */
export async function readApiError(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      const message = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message;
      const details = Array.isArray(data?.details)
        ? data.details.join(', ')
        : data?.details;
      return [message, details].filter(Boolean).join(' ');
    }
    return await res.text();
  } catch {
    return '';
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export interface ApiRequestInit extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Skip auto-auth. Default: false (auth is always added). */
  skipAuth?: boolean;
}

/**
 * Drop-in replacement for `fetch` that:
 *   • Prepends API_URL to relative paths
 *   • Injects the Firebase Bearer token
 *   • Logs the request and response for debugging
 */
export async function apiFetch(
  path: string,
  init: ApiRequestInit = {}
): Promise<Response> {
  const { skipAuth = false, headers: extraHeaders = {}, ...rest } = init;

  const authHeaders = skipAuth ? {} : await getAuthHeaders();

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
    ...extraHeaders,
  };

  console.info('[APIClient] →', rest.method ?? 'GET', url, {
    hasAuth: Boolean(mergedHeaders['Authorization']),
    contentType: mergedHeaders['Content-Type'],
  });

  const res = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });

  console.info('[APIClient] ←', res.status, url, {
    ok: res.ok,
    contentType: res.headers.get('content-type'),
  });

  return res;
}

/**
 * Convenience: authenticated GET that returns parsed JSON.
 * Throws on non-2xx or non-JSON responses.
 */
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg || `HTTP ${res.status} ${path}`);
  }
  return safeJson<T>(res);
}

/**
 * Convenience: authenticated POST / PUT / PATCH / DELETE that returns parsed JSON.
 */
export async function apiMutate<T = unknown>(
  path: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg || `HTTP ${res.status} ${method} ${path}`);
  }
  return safeJson<T>(res);
}

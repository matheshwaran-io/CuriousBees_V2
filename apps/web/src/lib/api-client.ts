/**
 * Centralized API Client for CuriousBees V2
 *
 * All API requests MUST go through here. This module:
 *   1. Resolves the backend base URL from the env variable.
 *   2. Automatically attaches the Clerk ID token as a Bearer header.
 *   3. Safely parses JSON and never tries to parse HTML error pages.
 *   4. Provides verbose console logging for debugging.
 */

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
      signOut: () => Promise<void>;
    };
  }
}

// Backend base URL — set in apps/web/.env.local
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Robust helper to wait for the Clerk global client to load and fetch the session JWT.
 */
/** Helper: finds an active session from any known Clerk global location */
function getActiveClerkSession(): { getToken: () => Promise<string | null> } | null {
  const w = window as any;
  // v7 location
  if (w.Clerk?.session?.getToken) return w.Clerk.session;
  // v6 client location
  const active = w.Clerk?.client?.activeSessions?.[0];
  if (active?.getToken) return active;
  // sessions array fallback
  const first = w.Clerk?.client?.sessions?.[0];
  if (first?.getToken) return first;
  return null;
}

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Wait up to 4s total for both Clerk to load AND a session to exist
  await new Promise<void>((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const ready = !!(window as any).Clerk && !!getActiveClerkSession();
      if (ready || attempts > 40) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

  const session = getActiveClerkSession();
  if (!session) {
    console.warn('[APIClient] No active Clerk session found after waiting.');
    return null;
  }

  try {
    // Race getToken() against a 5s timeout to prevent hanging on JWT refresh
    const tokenPromise = session.getToken();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    if (!token) {
      console.warn('[APIClient] getToken() timed out or returned null.');
    }
    return token;
  } catch (err) {
    console.warn('[APIClient] Failed to retrieve token from Clerk:', err);
    return null;
  }
}



export function resetAuthPromise() {
  console.info('[APIClient] Resetting auth promise (no-op for Clerk).');
}

// ─── Token helper ────────────────────────────────────────────────────────────

/**
 * Returns the Clerk Bearer token for the currently authenticated user.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getClerkToken();
  if (token) {
    console.debug('[APIClient] Attaching Clerk bearer token. tokenLength =', token.length);
    return { Authorization: `Bearer ${token}` };
  }

  console.warn('[APIClient] No authenticated Clerk user — request will be unauthenticated.');
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
 *   • Injects the Clerk Bearer token
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

  // Use AbortController for a default 8-second request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[APIClient] Request to ${url} timed out after 15s. Aborting.`);
    controller.abort();
  }, 15000);

  // If a custom signal is provided, listen to aborts on it
  if (rest.signal) {
    if (rest.signal.aborted) {
      controller.abort();
    } else {
      rest.signal.addEventListener('abort', () => controller.abort());
    }
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    console.info('[APIClient] ←', res.status, url, {
      ok: res.ok,
      contentType: res.headers.get('content-type'),
    });

    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`[APIClient] Request to ${path} timed out after 15s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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

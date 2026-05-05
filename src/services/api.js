/**
 * @module services/api
 *
 * Core HTTP wrapper for all API communication with the Laravel backend.
 * Handles:
 *   - CSRF cookie bootstrapping (Sanctum requires one fetch to /sanctum/csrf-cookie
 *     before any state-mutating request; we do this once and cache the result)
 *   - Automatic XSRF-TOKEN header injection from the cookie Laravel sets
 *   - Content-Type negotiation (JSON by default, omitted for FormData uploads)
 *   - Unified error normalisation — all non-2xx responses throw an Error whose
 *     message comes from the API's { message } field when available
 */

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('[api] VITE_API_URL is not set — falling back to localhost:8000. This will not work in production.')
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Re-fetch the CSRF cookie after 30 min of idle time so stale sessions don't
// silently break state-mutating requests (cookie expires with the session).
let csrfLoadedAt  = 0
const CSRF_TTL_MS = 30 * 60 * 1000

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Read a cookie value by name from document.cookie.
 * Used to extract the XSRF-TOKEN that Laravel sets after the CSRF bootstrap call.
 *
 * @param {string} name
 * @returns {string|undefined}
 */
function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Perform an authenticated fetch to the backend API.
 *
 * Automatically:
 *   - Fetches the CSRF cookie on the first call (skipped on subsequent calls)
 *   - Injects the X-XSRF-TOKEN header from the cookie Laravel provides
 *   - Sets Content-Type: application/json unless the body is FormData
 *   - Throws a descriptive Error on any non-2xx response
 *
 * @param {string}       path    - API path relative to BASE_URL (e.g. '/api/auth/me')
 * @param {RequestInit}  options - Standard fetch options (method, body, headers…)
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} With message from the API's { message } field, or a generic fallback
 */
export async function apiFetch(path, options = {}) {
  // ── CSRF bootstrap ──────────────────────────────────────────────────────────
  // Sanctum requires a GET to /sanctum/csrf-cookie before any POST/PUT/DELETE.
  // This sets the XSRF-TOKEN cookie which we then echo back as a header.
  // We guard with csrfLoaded so this only happens once per page session.
  // The fetch is wrapped in try/catch so a CORS failure here is non-fatal —
  // the main request will still fire and fail with a proper error if needed.
  if (Date.now() - csrfLoadedAt > CSRF_TTL_MS) {
    try {
      await fetch(`${BASE_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
      csrfLoadedAt = Date.now()
    } catch {
      // Network or CORS error on the CSRF call — proceed anyway.
      // The subsequent API request will surface the real problem.
    }
  }

  // ── Header construction ─────────────────────────────────────────────────────
  // We omit Content-Type for FormData so the browser can set the correct
  // multipart boundary automatically. For everything else we default to JSON.
  const xsrf    = getCookie('XSRF-TOKEN')
  const isForm  = options.body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(xsrf   ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
    ...(options.headers ?? {}),
  }

  // ── Request ─────────────────────────────────────────────────────────────────
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  // ── Error handling ──────────────────────────────────────────────────────────
  // Parse the body regardless of status so we can read the { message } field
  // that Laravel includes on validation errors and other failures.
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.message ?? data?.error ?? `HTTP ${response.status}`
    throw new Error(message)
  }

  return data
}

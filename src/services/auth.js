/**
 * @module services/auth
 *
 * Authentication service — handles session-based auth via Laravel Sanctum.
 * The CSRF cookie is fetched once on the first API call (managed in apiFetch),
 * after which the XSRF-TOKEN cookie is sent automatically with every request.
 */

import { apiFetch } from './api'

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

/**
 * Attempt to log in with email and password.
 * On success the backend creates a session and returns the authenticated user.
 * On failure it throws with an appropriate error message.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ data: User }>}
 */
export function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
}

/**
 * Destroy the current session on the backend.
 * The frontend clears local user state independently via the auth store.
 */
export function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

/**
 * Fetch the currently authenticated user.
 * Called once on app mount to rehydrate the auth store from an existing session.
 * Returns 401 if no session exists, which is caught and treated as "not logged in".
 *
 * @returns {Promise<{ data: User }>}
 */
export function getUser() {
  return apiFetch('/api/auth/me')
}

/**
 * @module services/cpe
 *
 * API service layer for the Surveillant (CPE) role.
 * The surveillant oversees school-wide justifications and has read access
 * to the full schedule across all classes.
 */

import { apiFetch } from './api'

// ─────────────────────────────────────────────
// Justifications
// ─────────────────────────────────────────────

/**
 * Fetch a paginated list of all justifications submitted by parents.
 * The backend returns records regardless of status (pending, accepted, rejected).
 * Filtering by status is handled client-side to avoid extra round-trips.
 *
 * @param {number} page - 1-based page index
 * @returns {Promise<{ data: Justification[], current_page: number, last_page: number }>}
 */
export function getJustifications(page = 1) {
  return apiFetch(`/api/cpe/justifications?page=${page}`)
}

/**
 * Accept or reject a justification.
 * Updates the justification's status and sets reviewed_at on the backend.
 *
 * @param {number} id     - Justification ID
 * @param {'accepted'|'rejected'} status - The decision
 */
export function reviewJustification(id, status) {
  return apiFetch(`/api/cpe/justifications/${id}/validate`, {
    method: 'POST',
    body:   JSON.stringify({ status }),
  })
}

// ─────────────────────────────────────────────
// Schedule
// ─────────────────────────────────────────────

/**
 * Fetch the school-wide weekly schedule across all classes.
 * The backend returns a map keyed by day name (monday → saturday),
 * each containing an array of slots with class, subject, and teacher relations.
 *
 * @returns {Promise<{ data: Record<string, ScheduleSlot[]> }>}
 */
export function getSchedule() {
  return apiFetch('/api/cpe/schedule')
}

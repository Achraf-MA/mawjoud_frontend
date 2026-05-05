/**
 * @module services/student
 *
 * API service layer for the Student role.
 * Students have read-only access — they can view their own schedule
 * and attendance history, but cannot submit or modify any records.
 */

import { apiFetch } from './api'

// ─────────────────────────────────────────────
// Schedule
// ─────────────────────────────────────────────

/**
 * Fetch the weekly schedule for the authenticated student's class.
 * The backend resolves the class automatically via the student–user link.
 * Returns a map keyed by day name containing sorted schedule slots.
 *
 * @returns {Promise<{ data: Record<string, ScheduleSlot[]> }>}
 */
export function getSchedule() {
  return apiFetch('/api/student/schedule')
}

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

/**
 * Fetch the paginated attendance history for the authenticated student.
 * Records are ordered by date descending (most recent first).
 *
 * @param {number} page - 1-based page index
 * @returns {Promise<{ data: AttendanceRecord[], current_page: number, last_page: number }>}
 */
export function getAttendance(page = 1) {
  return apiFetch(`/api/student/attendance?page=${page}`)
}

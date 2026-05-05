/**
 * @module services/parent
 *
 * API service layer for the Parent role.
 * All functions return raw API responses — consumers are responsible
 * for unpacking the { data, current_page, last_page } envelope.
 */

import { apiFetch } from './api'

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

/**
 * Fetch paginated attendance records for all of the parent's linked children.
 * The backend filters automatically based on the authenticated user's parent_student links.
 *
 * @param {number} page - 1-based page index
 * @returns {Promise<{ data: AttendanceRecord[], current_page: number, last_page: number }>}
 */
export function getChildAttendances(page = 1) {
  return apiFetch(`/api/parent/attendances?page=${page}`)
}

// ─────────────────────────────────────────────
// Justifications
// ─────────────────────────────────────────────

/**
 * Submit a justification for a specific absence.
 * Uses FormData (multipart) instead of JSON because the file attachment is optional.
 * If no file is provided, only the attendance_id and comment are sent.
 *
 * @param {number}      attendanceId - ID of the Attendance record being justified
 * @param {object}      options
 * @param {string}      options.comment - Optional written explanation from the parent
 * @param {File|null}   options.file    - Optional supporting document (PDF, JPG, PNG)
 */
export function submitJustification(attendanceId, { comment = '', file = null } = {}) {
  const body = new FormData()
  body.append('attendance_id', attendanceId)

  // Only append optional fields when they carry a value to keep the request clean
  if (comment) body.append('comment', comment)
  if (file)    body.append('file', file)

  return apiFetch('/api/parent/justifications', { method: 'POST', body })
}

// ─────────────────────────────────────────────
// Schedule
// ─────────────────────────────────────────────

/**
 * Fetch the weekly schedule for all of the parent's linked children's classes.
 * The backend returns a map keyed by day name (monday → friday) containing
 * an array of schedule slots, each including subject and teacher relations.
 *
 * @returns {Promise<{ data: Record<string, ScheduleSlot[]> }>}
 */
export function getSchedule() {
  return apiFetch('/api/parent/schedule')
}

/**
 * @module services/teacher
 *
 * API service layer for the Teacher role.
 * Teachers can read their assigned classes, subjects and students,
 * and write attendance records for sessions they own.
 */

import { apiFetch } from './api'

// ─────────────────────────────────────────────
// Classes & Assignments
// ─────────────────────────────────────────────

/**
 * Fetch all classes assigned to the authenticated teacher.
 * The backend resolves assignments via the teacher_class_subject pivot.
 *
 * @returns {Promise<{ data: SchoolClass[] }>}
 */
export function getClasses() {
  return apiFetch('/api/teacher/classes')
}

/**
 * Fetch all subjects taught by the authenticated teacher in a given class.
 *
 * @param {number} classId - The class whose subjects should be returned
 * @returns {Promise<{ data: Subject[] }>}
 */
export function getSubjectsByClass(classId) {
  return apiFetch(`/api/teacher/classes/${classId}/subjects`)
}

/**
 * Fetch all students enrolled in a given class.
 *
 * @param {number} classId - The class whose student roster should be returned
 * @returns {Promise<{ data: Student[] }>}
 */
export function getStudentsByClass(classId) {
  return apiFetch(`/api/teacher/classes/${classId}/students`)
}

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

/**
 * Submit a single attendance record for one student.
 * The backend uses updateOrCreate to prevent duplicate entries
 * for the same student/class/subject/date combination.
 *
 * @param {{ student_id: number, class_id: number, subject_id: number, date: string, status: 'present'|'absent'|'late' }} payload
 * @returns {Promise<{ data: Attendance }>}
 */
export function createAttendance(payload) {
  return apiFetch('/api/teacher/attendance', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

/**
 * Fetch attendance records filtered by class.
 * The class_id query parameter is forwarded to the backend so only
 * records belonging to the selected class are returned.
 *
 * @param {{ class_id: number }} params
 * @returns {Promise<{ data: Attendance[] }>}
 */
export function getAttendance(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`/api/teacher/attendance${query ? `?${query}` : ''}`)
}

// ─────────────────────────────────────────────
// Schedule
// ─────────────────────────────────────────────

/**
 * Fetch the teacher's own weekly work schedule.
 * The backend returns all schedule slots assigned to the authenticated teacher,
 * grouped by day name (monday → saturday), each including class and subject relations.
 *
 * @returns {Promise<{ data: Record<string, ScheduleSlot[]> }>}
 */
export function getTeacherSchedule() {
  return apiFetch('/api/teacher/schedule')
}

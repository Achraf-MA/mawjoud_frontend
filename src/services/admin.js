/**
 * @module services/admin
 *
 * API service layer for the Admin role.
 * All write operations go through the shared apiFetch wrapper which
 * handles CSRF token injection automatically via Sanctum.
 * On success the backend returns { success: true, data: {...} }.
 * On failure apiFetch throws, so all callers should use try/catch.
 */

import { apiFetch } from './api'

const BASE = '/api/admin'

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: User[] }>} */
export const getUsers = () => apiFetch(`${BASE}/users`)

/**
 * Create a new user. When role is 'student', the payload must also include
 * class_id to create the linked student record in the same request.
 *
 * @param {{ first_name, last_name, email, password, role, class_id? }} data
 */
export const createUser = (data) => apiFetch(`${BASE}/users`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Classes
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: SchoolClass[] }>} */
export const getClasses = () => apiFetch(`${BASE}/classes`)

/** @param {{ name: string }} data */
export const createClass = (data) => apiFetch(`${BASE}/classes`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Subjects
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: Subject[] }>} */
export const getSubjects = () => apiFetch(`${BASE}/subjects`)

/** @param {{ name: string }} data */
export const createSubject = (data) => apiFetch(`${BASE}/subjects`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Students
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: Student[] }>} */
export const getStudents = () => apiFetch(`${BASE}/students`)

/** @param {{ user_id, class_id }} data */
export const createStudent = (data) => apiFetch(`${BASE}/students`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Parent–Student Links
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: ParentStudentLink[] }>} */
export const getParentLinks = () => apiFetch(`${BASE}/parent-student`)

/**
 * Link a parent user to a student record.
 * Creates a row in the parent_student pivot table.
 *
 * @param {{ parent_id: number, student_id: number }} data
 */
export const linkParent = (data) => apiFetch(`${BASE}/parent-student`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Teacher–Class–Subject Assignments
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: Assignment[] }>} */
export const getAssignments = () => apiFetch(`${BASE}/assignments`)

/**
 * Assign a teacher to teach a specific subject in a specific class.
 * Creates a row in the teacher_class_subject pivot table.
 *
 * @param {{ teacher_id: number, class_id: number, subject_id: number }} data
 */
export const assignTeacher = (data) => apiFetch(`${BASE}/assignments`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

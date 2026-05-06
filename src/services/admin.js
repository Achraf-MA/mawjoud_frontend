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

/** @param {{ first_name, last_name, email, password, role, class_id? }} data */
export const createUser = (data) => apiFetch(`${BASE}/users`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

/** @param {number} id  @param {{ first_name, last_name, email, role, password?, class_id? }} data */
export const updateUser = (id, data) => apiFetch(`${BASE}/users/${id}`, {
  method: 'PUT',
  body:   JSON.stringify(data),
})

/** @param {number} id */
export const deleteUser = (id) => apiFetch(`${BASE}/users/${id}`, { method: 'DELETE' })

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

/** @param {number} id  @param {{ name: string }} data */
export const updateClass = (id, data) => apiFetch(`${BASE}/classes/${id}`, {
  method: 'PUT',
  body:   JSON.stringify(data),
})

/** @param {number} id */
export const deleteClass = (id) => apiFetch(`${BASE}/classes/${id}`, { method: 'DELETE' })

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

/** @param {number} id  @param {{ name: string }} data */
export const updateSubject = (id, data) => apiFetch(`${BASE}/subjects/${id}`, {
  method: 'PUT',
  body:   JSON.stringify(data),
})

/** @param {number} id */
export const deleteSubject = (id) => apiFetch(`${BASE}/subjects/${id}`, { method: 'DELETE' })

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

/** @param {{ parent_id: number, student_id: number }} data */
export const linkParent = (data) => apiFetch(`${BASE}/parent-student`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

/** @param {{ parent_id: number, student_id: number }} data */
export const unlinkParent = (data) => apiFetch(`${BASE}/parent-student`, {
  method: 'DELETE',
  body:   JSON.stringify(data),
})

// ─────────────────────────────────────────────
// Teacher–Class–Subject Assignments
// ─────────────────────────────────────────────

/** @returns {Promise<{ data: Assignment[] }>} */
export const getAssignments = () => apiFetch(`${BASE}/assignments`)

/** @param {{ teacher_id: number, class_id: number, subject_id: number }} data */
export const assignTeacher = (data) => apiFetch(`${BASE}/assignments`, {
  method: 'POST',
  body:   JSON.stringify(data),
})

/** @param {number} id */
export const deleteAssignment = (id) => apiFetch(`${BASE}/assignments/${id}`, { method: 'DELETE' })

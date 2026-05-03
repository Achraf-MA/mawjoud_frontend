import { apiFetch } from './api'

const BASE = '/api/admin'

// Users
export const getUsers      = ()     => apiFetch(`${BASE}/users`)
export const createUser    = (data) => apiFetch(`${BASE}/users`, { method: 'POST', body: JSON.stringify(data) })

// Classes
export const getClasses    = ()     => apiFetch(`${BASE}/classes`)
export const createClass   = (data) => apiFetch(`${BASE}/classes`, { method: 'POST', body: JSON.stringify(data) })

// Subjects
export const getSubjects   = ()     => apiFetch(`${BASE}/subjects`)
export const createSubject = (data) => apiFetch(`${BASE}/subjects`, { method: 'POST', body: JSON.stringify(data) })

// Students
export const getStudents   = ()     => apiFetch(`${BASE}/students`)
export const createStudent = (data) => apiFetch(`${BASE}/students`, { method: 'POST', body: JSON.stringify(data) })

// Parent–Student links
export const linkParent     = (data) => apiFetch(`${BASE}/parent-student`, { method: 'POST', body: JSON.stringify(data) })
export const getParentLinks = ()     => apiFetch(`${BASE}/parent-student`)

// Assignments (teacher ↔ class ↔ subject)
export const getAssignments = ()     => apiFetch(`${BASE}/assignments`)
export const assignTeacher  = (data) => apiFetch(`${BASE}/assignments`, { method: 'POST', body: JSON.stringify(data) })
import { apiFetch } from './api'

// Get classes assigned to the logged-in teacher
export function getClasses() {
  return apiFetch('/api/teacher/classes')
}

// Get subjects for a class
export function getSubjectsByClass(classId) {
  return apiFetch(`/api/teacher/classes/${classId}/subjects`)
}

// Get students for a class
export function getStudentsByClass(classId) {
  return apiFetch(`/api/teacher/classes/${classId}/students`)
}

// Submit a single attendance record
export function createAttendance(payload) {
  return apiFetch('/api/teacher/attendance', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

// Fetch attendance records — class_id filter is forwarded as a query param
export function getAttendance(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`/api/teacher/attendance${query ? `?${query}` : ''}`)
}
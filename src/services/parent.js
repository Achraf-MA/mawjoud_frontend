import { apiFetch } from './api'

// Get all attendance records for the parent's children (paginated)
export function getChildAttendances(page = 1) {
  return apiFetch(`/api/parent/attendances?page=${page}`)
}

// Submit a justification — uses FormData because file upload is optional
export function submitJustification(attendanceId, { comment = '', file = null } = {}) {
  const body = new FormData()
  body.append('attendance_id', attendanceId)
  if (comment) body.append('comment', comment)
  if (file)    body.append('file', file)

  return apiFetch('/api/parent/justifications', {
    method: 'POST',
    body,
  })
}

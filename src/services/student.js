import { apiFetch } from './api'

export function getSchedule() {
  return apiFetch('/api/student/schedule')
}

export function getAttendance(page = 1) {
  return apiFetch(`/api/student/attendance?page=${page}`)
}

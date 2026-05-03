import { apiFetch } from './api'

// Get all justifications (paginated)
export function getJustifications(page = 1) {
  return apiFetch(`/api/cpe/justifications?page=${page}`)
}

// Accept or reject a justification
export function reviewJustification(id, status) {
  return apiFetch(`/api/cpe/justifications/${id}/validate`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

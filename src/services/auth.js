import { apiFetch } from './api'

// Login
export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

// Get current user
export async function getUser() {
  return apiFetch('/api/auth/me')
}

// Logout
export async function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST'
  })
}
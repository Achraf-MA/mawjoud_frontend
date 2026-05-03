const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let csrfLoaded = false

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export async function apiFetch(url, options = {}) {
  // Ensure CSRF cookie (only once) — failure is non-fatal
  if (!csrfLoaded) {
    try {
      await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
        credentials: 'include'
      })
    } catch {
      // CORS or network issue — proceed anyway, the main request will fail with a proper error
    }
    csrfLoaded = true
  }

  const headers = new Headers({
    'Accept': 'application/json',
    ...(options.headers || {})
  })

  // Only set JSON if not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach CSRF token
  const xsrfToken = getCookie('XSRF-TOKEN')
  if (xsrfToken) {
    headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken))
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    ...options,
    headers
  })

  if (response.status === 204) return null

  let data
  try {
    data = await response.json()
  } catch {
    data = { message: 'Invalid JSON response from server' }
  }

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
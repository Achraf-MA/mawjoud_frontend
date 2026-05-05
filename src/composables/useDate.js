/**
 * @module composables/useDate
 *
 * Pure utility functions for date formatting, relative time display,
 * and greeting generation. No reactive state — these are stateless
 * helpers imported directly into components and composables.
 *
 * All date formatting uses 'en-GB' locale for consistent DD Mon YYYY output
 * regardless of the user's browser locale setting.
 */

// ─────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────

/**
 * Format a date string or Date object as "DD Mon YYYY" (e.g. "03 Jan 2025").
 * Returns an em-dash if the value is falsy.
 *
 * @param {string|Date|null} d
 * @returns {string}
 */
export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/**
 * Format a date as a relative label — "Today", "Yesterday", "Nd ago", or "DD Mon".
 * Used in the teacher roster's "Recorded" column to give attendance dates
 * more meaningful context at a glance.
 *
 * @param {string|Date|null} date
 * @returns {string}
 */
export function formatRelative(date) {
  if (!date) return '—'
  const d    = new Date(date)
  const now  = new Date()

  // Compare calendar dates (not timestamps) so midnight boundaries are handled correctly
  const diff = Math.floor(
    (new Date(now.getFullYear(),  now.getMonth(),  now.getDate()) -
     new Date(d.getFullYear(),   d.getMonth(),    d.getDate())) / 86400000
  )

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7)  return `${diff}d ago`

  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ─────────────────────────────────────────────
// Current date / time helpers
// ─────────────────────────────────────────────

/**
 * Return a full human-readable label for today's date.
 * Example: "Monday, 3 January 2025"
 *
 * @returns {string}
 */
export function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Return today's day name as a lowercase string matching the schedule keys.
 * Example: "monday", "tuesday", etc.
 *
 * @returns {string}
 */
export function todayDayName() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase()
}

/**
 * Return a time-appropriate greeting for use in dashboard headers.
 * Cutoffs: morning < 12:00, afternoon < 18:00, evening ≥ 18:00.
 *
 * @returns {'Good morning'|'Good afternoon'|'Good evening'}
 */
export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─────────────────────────────────────────────
// Name helpers
// ─────────────────────────────────────────────

/**
 * Generate up to 2 uppercase initials from a full name string.
 * Example: "Jane Dupont" → "JD"
 *
 * @param {string} name
 * @returns {string}
 */
export function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/**
 * Generate 2 uppercase initials from separate first and last name fields.
 * Preferred over initials() when the model exposes first_name / last_name separately.
 * Example: ("Jane", "Dupont") → "JD"
 *
 * @param {string} first
 * @param {string} last
 * @returns {string}
 */
export function personInitials(first = '', last = '') {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

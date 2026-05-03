export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatRelative(date) {
  if (!date) return '—'
  const d    = new Date(date)
  const now  = new Date()
  const diff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
     new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7)  return `${diff}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function todayDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function personInitials(first = '', last = '') {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

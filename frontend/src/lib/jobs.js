export const STATUSES = [
  ['saved', 'Saved'],
  ['applied', 'Applied'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['rejected', 'Rejected'],
]
export const LABEL = Object.fromEntries(STATUSES)

export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
export const day = (iso) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null
export const fileName = (path) => decodeURIComponent((path || '').split('/').pop() || 'resume.pdf')

export function countByStatus(apps) {
  const c = Object.fromEntries(STATUSES.map(([key]) => [key, 0]))
  apps.forEach((a) => (c[a.status] += 1))
  return c
}

export function average(apps) {
  const scored = apps.filter((a) => a.match_score != null)
  return scored.length ? Math.round(scored.reduce((sum, a) => sum + a.match_score, 0) / scored.length) : null
}

// Days in a row, ending today or yesterday, on which a job was added.
export function streak(apps) {
  const days = new Set(apps.map((a) => new Date(a.created_at).toLocaleDateString('en-CA')))
  const d = new Date()
  if (!days.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(d.toLocaleDateString('en-CA'))) {
    n += 1
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function verdict(score) {
  if (score >= 75) return 'Strong fit'
  if (score >= 50) return 'Worth applying'
  return 'A stretch'
}

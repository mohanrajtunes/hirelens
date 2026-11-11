// The same skill list the backend scores with (backend/ai/services.py),
// so the demo on the landing page behaves like the real keyword match.
export const SKILLS = [
  'python', 'django', 'django rest framework', 'drf', 'flask', 'fastapi',
  'javascript', 'typescript', 'react', 'node.js', 'express', 'java', 'c++',
  'sql', 'postgresql', 'mysql', 'mongodb', 'sqlite', 'redis',
  'rest api', 'graphql', 'jwt', 'docker', 'kubernetes', 'aws', 'azure',
  'gcp', 'git', 'github', 'linux', 'ci/cd', 'celery', 'rabbitmq',
  'html', 'css', 'tailwind', 'pytest', 'unit testing', 'microservices',
  'machine learning', 'llm', 'rag', 'langchain', 'pandas', 'numpy',
  'agile', 'postman', 'swagger',
]

export const SAMPLE_RESUME = [
  'python', 'django', 'django rest framework', 'drf', 'rest api', 'jwt',
  'postgresql', 'sqlite', 'sql', 'react', 'javascript', 'html', 'css',
  'git', 'github', 'postman',
]

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const pattern = (words) =>
  new RegExp(`(?<![a-z0-9])(${words.map(esc).join('|')})(?![a-z0-9])`, 'gi')

export function extractSkills(text) {
  const lower = (text || '').toLowerCase()
  return SKILLS.filter((skill) => pattern([skill]).test(lower))
}

// Score a job text against a set of resume skills, the way the backend does.
export function compare(jobText, resumeSkills = SAMPLE_RESUME) {
  const have = new Set(resumeSkills)
  const asked = extractSkills(jobText)
  const matched = asked.filter((s) => have.has(s))
  const missing = asked.filter((s) => !have.has(s))
  const score = asked.length ? Math.round((matched.length / asked.length) * 100) : null
  return { asked, matched, missing, score }
}

// Cut a text into plain and marked pieces: [{ text, kind: 'hit' | 'miss' | undefined }]
export function segment(text, hits = [], misses = []) {
  const kinds = new Map()
  misses.forEach((s) => kinds.set(s.toLowerCase(), 'miss'))
  hits.forEach((s) => kinds.set(s.toLowerCase(), 'hit'))
  const words = [...kinds.keys()].sort((a, b) => b.length - a.length)
  if (!words.length || !text) return [{ text: text || '' }]
  const re = pattern(words)
  const out = []
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    out.push({ text: m[0], kind: kinds.get(m[0].toLowerCase()) })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

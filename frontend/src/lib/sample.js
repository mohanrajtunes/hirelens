import { RESUME, POSTS } from './resume.js'

// The sample match: a made-up resume against three made-up job posts.
// The results were prepared in advance, so trying it needs no account.
export const SAMPLE_RESUME = [
  RESUME.name.toUpperCase(),
  RESUME.role,
  RESUME.meta.join(' | '),
  '',
  'SUMMARY',
  RESUME.summary,
  '',
  'SKILLS',
  RESUME.skills.join(', '),
  '',
  'PROJECTS',
  ...RESUME.projects.map((p) => `${p.name}: ${p.line}`),
  '',
  'EDUCATION',
  RESUME.education,
].join('\n')

const RESULTS = {
  backend: {
    final_score: 72,
    matched_skills: ['REST API', 'Python', 'Django', 'PostgreSQL', 'JWT', 'Git'],
    missing_skills: ['Docker', 'AWS', 'Redis', 'Celery'],
    summary: 'The resume covers the core of this role: Python and Django REST APIs with JWT and PostgreSQL. It shows no container, cloud or task queue experience, which the job also asks for.',
    strengths: ['Django REST APIs secured with JWT (Orderly)', 'PostgreSQL in two projects', 'Git in everyday use'],
    tips: ['Add any Docker use, even from a personal project.', 'Mention background jobs or queues if you have built any.', 'Say where your projects are deployed.'],
    notes: {
      professional: 'Hi,\n\nI am applying for the Backend Developer role. I built Orderly, an inventory service with a Django REST API secured with JWT and backed by PostgreSQL, which is close to the work you describe.\n\nI have not used Docker or AWS in production yet and am learning both now. I would be glad to talk further.\n\nSam Carter',
      friendly: 'Hi,\n\nYour Backend Developer role caught my eye because it is the work I enjoy most. Orderly, my inventory service, runs on a Django REST API with JWT and PostgreSQL, so your stack feels familiar.\n\nDocker and AWS are new to me, and I am picking them up now. Happy to chat whenever suits you.\n\nSam Carter',
      confident: 'Hi,\n\nI build the kind of backend this role needs. Orderly is a Django REST API with JWT auth on PostgreSQL that I designed, built and shipped myself, and Bookable handles bookings and payments on the same stack.\n\nDocker and AWS are the two gaps, and I am closing them now. Let us talk.\n\nSam Carter',
    },
  },
  fullstack: {
    final_score: 68,
    matched_skills: ['React', 'Django REST Framework', 'PostgreSQL', 'HTML', 'CSS'],
    missing_skills: ['TypeScript', 'Pytest', 'CI/CD'],
    summary: 'The resume matches both halves of this role: React in front and Django REST Framework with PostgreSQL behind. It does not show TypeScript, automated tests or a deployment pipeline.',
    strengths: ['React dashboard on a Django REST API (Orderly)', 'HTML and CSS used in a shipped site (Bookable)', 'PostgreSQL across projects'],
    tips: ['Add tests to one project and say so.', 'Convert a small React component to TypeScript and mention it.', 'Describe how you deploy, even if it is manual.'],
    notes: {
      professional: 'Hi,\n\nI am applying for the Full Stack Engineer role. Orderly, my inventory service, pairs a React dashboard with a Django REST Framework API on PostgreSQL, the same split your product uses.\n\nI have not worked in TypeScript yet and am learning it now. I would be glad to talk further.\n\nSam Carter',
      friendly: 'Hi,\n\nReact in front and Django REST Framework behind is exactly how I built Orderly, my inventory service, so your Full Stack Engineer role feels like a natural fit. Bookable gave me plenty of HTML and CSS practice too.\n\nTypeScript is next on my list. Happy to chat whenever suits you.\n\nSam Carter',
      confident: 'Hi,\n\nI ship both sides of a product. Orderly has a React dashboard on a Django REST Framework API with PostgreSQL, and Bookable is a booking site I built end to end with payments.\n\nTypeScript is the one gap for this role, and I am closing it now. Let us talk.\n\nSam Carter',
    },
  },
  ai: {
    final_score: 49,
    matched_skills: ['LLM', 'Python', 'PostgreSQL', 'REST API', 'Git'],
    missing_skills: ['FastAPI', 'RAG', 'LangChain', 'MongoDB', 'Docker'],
    summary: 'The resume shows Python, REST APIs and one LLM project, which is a real start for this role. Most of the specific tools the job names are not on it yet.',
    strengths: ['An LLM assistant that answers from company docs (Helpdesk bot)', 'Python REST APIs in every project', 'PostgreSQL across projects'],
    tips: ['Explain how Helpdesk bot finds the right document. That is retrieval, which this job asks for.', 'Rebuild one small API in FastAPI.', 'Add Docker to one project.'],
    notes: {
      professional: 'Hi,\n\nI am applying for the AI Backend Engineer role. I built Helpdesk bot, a support assistant that answers from company documents using Python, an LLM and a REST API.\n\nI have not used FastAPI or LangChain yet and am learning them now. I would be glad to talk further.\n\nSam Carter',
      friendly: 'Hi,\n\nWiring LLM features into a backend is what I did with Helpdesk bot, a support assistant that answers from company docs through a Python REST API, so your role caught my eye.\n\nFastAPI and LangChain are new to me, and I am picking them up now. Happy to chat whenever suits you.\n\nSam Carter',
      confident: 'Hi,\n\nI have already put an LLM behind a REST API. Helpdesk bot answers support questions from company documents, and I built its Python backend myself, with PostgreSQL in my other projects.\n\nFastAPI and LangChain are the gaps for this role, and I am closing them now. Let us talk.\n\nSam Carter',
    },
  },
}

export const SAMPLES = POSTS.map((p) => ({ ...p, ...RESULTS[p.id] }))

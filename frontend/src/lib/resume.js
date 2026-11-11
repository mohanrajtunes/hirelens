// A made-up person, used wherever the site needs a resume to show.
export const RESUME = {
  name: 'Sam Carter',
  role: 'Python Developer',
  meta: ['Remote', 'sam.carter@example.com'],
  summary:
    'Developer who ships whole products: Python and Django REST Framework APIs with JWT auth, PostgreSQL and a React front end.',
  skills: ['Python', 'Django', 'Django REST Framework', 'REST API', 'JWT', 'PostgreSQL', 'SQLite', 'SQL', 'React', 'JavaScript', 'HTML', 'CSS', 'Git', 'GitHub', 'Postman'],
  projects: [
    { name: 'Orderly', line: 'Inventory service. Django REST API with JWT and PostgreSQL, React dashboard.' },
    { name: 'Helpdesk bot', line: 'Support assistant that answers from company docs. Python, an LLM and a REST API.' },
    { name: 'Bookable', line: 'Booking site with payments. Django, PostgreSQL, HTML and CSS.' },
  ],
  education: 'B.Sc. Computer Science.',
}

export const POSTS = [
  {
    id: 'backend',
    label: 'Backend dev',
    company: 'Northwind Labs',
    role: 'Backend Developer',
    text: 'We are hiring a Backend Developer. You will build REST API services in Python with Django and PostgreSQL, secure them with JWT, ship with Docker on AWS and keep queues healthy with Redis and Celery. Git is a must.',
  },
  {
    id: 'fullstack',
    label: 'Full stack',
    company: 'Paperplane',
    role: 'Full Stack Engineer',
    text: 'Full Stack Engineer wanted. Our product runs on React and TypeScript in front and Django REST Framework behind, with PostgreSQL. You write HTML and CSS you are proud of, test with Pytest and deploy through CI/CD.',
  },
  {
    id: 'ai',
    label: 'AI engineer',
    company: 'Lumen AI',
    role: 'AI Backend Engineer',
    text: 'AI Backend Engineer. You will wire LLM features into a Python and FastAPI backend, build RAG pipelines with LangChain, store data in PostgreSQL and MongoDB, and expose it all as a clean REST API. Docker and Git expected.',
  },
]

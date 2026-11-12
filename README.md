# HireLens

An AI job-application assistant. Upload your resume, paste a job description, and HireLens shows your match score, the skills you are missing, and a cover note written from your own experience. A built-in tracker keeps your applications in one place.

**Live:** https://hirelens-seven-smoky.vercel.app
**API:** https://hirelens-cg2m.onrender.com

> The API runs on a free tier and sleeps when idle. The first request after a while can take about 30 seconds.

<!-- Add screenshots here: landing, match result, skills gap, tracker -->

## Features

- **Match score (0–100)** for a resume against any job description
- **Skills gap**: what the job asks for that your resume does not show
- **Cover note**: 80–110 words, led by your strongest fit and one honest gap, editable before you copy it
- **Application tracker**: move applications across stages
- **Dashboard** with getting-started steps and recent activity
- **Public sample match** at `/sample`, no account needed
- **How it's built** at `/built`, an animated diagram of the API

## How the score works

```
score = round(0.4 × requirements proven + 0.6 × overall fit)
```

- **Requirements proven (40%)**: the LLM lists what the job asks for. Options like "AWS, Azure, or GCP" count as one requirement, and "nice to have" items count half. For each one it must quote the exact words from the resume that show it, and the API verifies the quote exists. No proof, no match.
- **Overall fit (60%)**: the LLM's judgement of how well the experience fits the role.

There is no fixed keyword list, so it works for any job, and the model cannot credit a skill the resume never mentions.

## Architecture

```
React (Vercel)  ──HTTPS / JWT──▶  Django REST API (Render)  ──▶  Neon Postgres
                                        │
                                        └──▶  Groq LLM
```

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, GSAP (ScrollTrigger, SplitText, Flip), Lenis |
| Backend | Django 6, Django REST Framework, SimpleJWT |
| AI | Groq API (`openai/gpt-oss-120b`), pypdf for resume text |
| Database | Neon Postgres in production, SQLite locally |
| Hosting | Vercel (frontend), Render (backend) |

### Backend notes

- JWT auth: 15-minute access tokens, 1-day refresh tokens with rotation and blacklist
- Rate limits: login 5/min, register 10/hour, upload 20/hour, AI calls 30/hour
- Resume upload: PDF only, 2 MB limit; extracted text is stored in the database
- Config is environment-driven: `DATABASE_URL`, CORS, CSRF and allowed hosts
- Static files served with WhiteNoise

## Run locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # then fill in the values
python manage.py migrate
python manage.py runserver
```

Needed in `.env`: `DJANGO_SECRET_KEY`, `GROQ_API_KEY`, and `DJANGO_DEBUG=1` for local use. See `.env.example`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` (for example `http://127.0.0.1:8000/api`) if the API is not at the default address.

## Deploy

- **Backend (Render):** root directory `backend`, build command `./build.sh`, start command `gunicorn config.wsgi`. Set `DATABASE_URL`, `DJANGO_SECRET_KEY`, `GROQ_API_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` (origins with no trailing slash).
- **Frontend (Vercel):** root directory `frontend`, env `VITE_API_URL=<backend URL>/api`.

## Project structure

```
hirelens/
├── backend/     Django project (accounts, resumes, jobs, ai)
└── frontend/    React app (public site + /app dashboard)
```

## Known limits

- Free-tier hosting: cold starts, and uploaded PDF files are cleared on redeploy (extracted text stays in the database)
- English resumes and job posts only

## Author

Built by [Mohanraj S](https://github.com/mohanrajtunes).

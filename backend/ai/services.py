import json
import os
import re

from groq import Groq

MODEL = 'openai/gpt-oss-120b'

SKILLS = [
    'python', 'django', 'django rest framework', 'drf', 'flask', 'fastapi',
    'javascript', 'typescript', 'react', 'node.js', 'express', 'java', 'c++',
    'sql', 'postgresql', 'mysql', 'mongodb', 'sqlite', 'redis',
    'rest api', 'graphql', 'jwt', 'docker', 'kubernetes', 'aws', 'azure',
    'gcp', 'git', 'github', 'linux', 'ci/cd', 'celery', 'rabbitmq',
    'html', 'css', 'tailwind', 'pytest', 'unit testing', 'microservices',
    'machine learning', 'llm', 'rag', 'langchain', 'pandas', 'numpy',
    'agile', 'postman', 'swagger', 'spring boot', 'terraform', 'jenkins', 'nginx', 'kafka',
    'elasticsearch', 'tensorflow', 'pytorch', 'scikit-learn',
    'django-filter', 'select_for_update', 'cloudinary', 'vercel', 'render',
    'next.js', 'vue', 'angular', 'golang', 'rust', 'php', 'laravel',
]


def extract_skills(text):
    text = text.lower()
    found = set()
    for skill in SKILLS:
        pattern = r'(?<![a-z0-9])' + re.escape(skill) + r'(?![a-z0-9])'
        if re.search(pattern, text):
            found.add(skill)
    return found


def keyword_match(resume_text, job_text):
    job_skills = extract_skills(job_text)
    resume_skills = extract_skills(resume_text)
    if not job_skills:
        return 0, [], []
    matched = sorted(job_skills & resume_skills)
    missing = sorted(job_skills - resume_skills)
    score = round(len(matched) / len(job_skills) * 100)
    return score, matched, missing


def llm_analysis(resume_text, job_text):
    client = Groq(api_key=os.getenv('GROQ_API_KEY'))
    system = (
        'You are a strict technical recruiter. Compare the resume with the job '
        'description. Reply ONLY with JSON in this exact shape: '
        '{"score": <0-100 integer>, "summary": "<2 sentences>", '
        '"strengths": ["..."], "missing_skills": ["..."], "tips": ["..."]}. '
        'Use only facts present in the resume. Do not invent experience.'
    )
    user = f'RESUME:\n{resume_text[:6000]}\n\nJOB DESCRIPTION:\n{job_text[:6000]}'
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user},
        ],
        response_format={'type': 'json_object'},
        temperature=0.2,
    )
    return json.loads(resp.choices[0].message.content)

def generate_cover_note(resume_text, job_description, tone='professional'):
    client = Groq(api_key=os.getenv('GROQ_API_KEY'))
    system = (
        'You write short job application notes for a fresher developer. '
        f'Tone: {tone}. Max 120 words. Start with "Hi," and end with the '
        'candidate name. Mention 2-3 relevant projects or skills from the '
        'resume that match the job. Use ONLY facts in the resume. Never '
        'invent experience or skills. No placeholders like [Company]. '
        'Reply with plain text only.'
    )
    user = f'RESUME:\n{resume_text[:6000]}\n\nJOB DESCRIPTION:\n{job_description[:6000]}'
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user},
        ],
        temperature=0.5,
    )
    return resp.choices[0].message.content.strip()
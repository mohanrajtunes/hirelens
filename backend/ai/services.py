import json
import os
import re

from groq import Groq

MODEL = 'openai/gpt-oss-120b'

def _norm(text):
    """Lowercase letters and digits only, single spaces, so quotes compare fairly."""
    return re.sub(r'[^a-z0-9+#]+', ' ', str(text).lower()).strip()


def _quoted_in(evidence, haystack):
    """True if the quoted words really appear in the resume (haystack is padded with spaces)."""
    parts = [_norm(p) for p in re.split(r'\.\.\.|…|\|', str(evidence or ''))]
    parts = [p for p in parts if len(p) >= 2]
    return bool(parts) and all(f' {p} ' in haystack for p in parts)


ANALYSIS_PROMPT = (
    'You are a strict technical recruiter comparing a resume with a job description. '
    'Reply ONLY with JSON in this exact shape: '
    '{"score": <0-100 integer, overall fit>, "summary": "<2 sentences>", '
    '"requirements": [{"options": ["..."], "importance": "required", "met": true, "evidence": "..."}], '
    '"strengths": ["..."], "tips": ["..."]}.\n\n'
    'Rules for requirements:\n'
    '- List the skills, tools, languages and domains the job asks for: at most 15, most important first. '
    'Skip years of experience, soft skills and generic words.\n'
    '- If the job accepts any one of several options (for example "Java, Scala, or Python" or '
    '"AWS, Azure, or GCP"), put them together in ONE requirement as its options. '
    'Otherwise each requirement has one option.\n'
    '- Use the job\'s own wording for options, 1 to 3 words each.\n'
    '- importance is "preferred" when the job says plus, advantage, nice to have or bonus; otherwise "required".\n'
    '- met is true only if the resume itself shows at least one option. evidence must be words copied '
    'exactly from the resume. If you cannot copy exact words, set met to false and evidence to "".\n'
    '- A related skill is not a match (JavaScript is not Java; SQL is not NoSQL).\n\n'
    'Strengths: only things the resume states in plain words. Never infer tools or practices '
    '(CI/CD, testing, monitoring) that it does not mention. Never invent experience.'
)


def analyze(resume_text, job_text):
    """One AI pass that returns the requirements the job lists and which ones the resume proves."""
    client = Groq(api_key=os.getenv('GROQ_API_KEY'))
    user = f'RESUME:\n{resume_text[:6000]}\n\nJOB DESCRIPTION:\n{job_text[:6000]}'
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {'role': 'system', 'content': ANALYSIS_PROMPT},
            {'role': 'user', 'content': user},
        ],
        response_format={'type': 'json_object'},
        temperature=0.1,
    )
    data = json.loads(resp.choices[0].message.content)

    haystack = f' {_norm(resume_text)} '
    matched, missing, total, got = [], [], 0.0, 0.0
    for req in (data.get('requirements') or [])[:15]:
        options = [str(o).strip() for o in (req.get('options') or []) if str(o).strip()][:6]
        if not options:
            continue
        weight = 0.5 if req.get('importance') == 'preferred' else 1.0
        # The AI must prove it: the quoted evidence has to exist in the resume.
        met = bool(req.get('met')) and _quoted_in(req.get('evidence'), haystack)
        total += weight
        if met:
            got += weight
            found = next((o for o in options if f' {_norm(o)} ' in haystack), options[0])
            matched.append(found.lower())
        else:
            missing += [o.lower() for o in options]

    coverage = round(got / total * 100) if total else 0
    try:
        ai_score = max(0, min(100, int(data.get('score', 0))))
    except (TypeError, ValueError):
        ai_score = 0
    return {
        'coverage': coverage,
        'ai_score': ai_score,
        'matched': list(dict.fromkeys(matched)),
        'missing': list(dict.fromkeys(missing)),
        'summary': data.get('summary', ''),
        'strengths': data.get('strengths', []),
        'tips': data.get('tips', []),
    }


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
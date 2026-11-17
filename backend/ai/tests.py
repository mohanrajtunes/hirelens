import json
from unittest import mock

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from resumes.models import Resume
from . import services

RESUME = 'Mohan Kumar. Skills: Python, Django REST Framework, PostgreSQL, React. Built a job tracker.'


def fake_groq(payload):
    """A stand-in for the Groq client that returns a fixed JSON reply."""
    reply = mock.Mock()
    reply.choices = [mock.Mock(message=mock.Mock(content=json.dumps(payload)))]
    client = mock.Mock()
    client.chat.completions.create.return_value = reply
    return mock.patch.object(services, 'Groq', return_value=client)


class EvidenceTests(SimpleTestCase):
    def test_quote_must_exist_in_resume(self):
        hay = f' {services._norm(RESUME)} '
        self.assertTrue(services._quoted_in('Django REST Framework', hay))
        self.assertFalse(services._quoted_in('Kubernetes', hay))
        self.assertFalse(services._quoted_in('', hay))

    def test_analyze_rejects_invented_evidence(self):
        payload = {
            'score': 80, 'summary': 's', 'strengths': [], 'tips': [],
            'requirements': [
                {'options': ['Python'], 'importance': 'required', 'met': True, 'evidence': 'Python'},
                # The model claims Kubernetes, but the resume never says it.
                {'options': ['Kubernetes'], 'importance': 'required', 'met': True, 'evidence': 'Kubernetes clusters'},
                {'options': ['Go'], 'importance': 'preferred', 'met': False, 'evidence': ''},
            ],
        }
        with fake_groq(payload):
            out = services.analyze(RESUME, 'job text')
        self.assertEqual(out['matched'], ['python'])
        self.assertIn('kubernetes', out['missing'])
        self.assertEqual(out['coverage'], 40)  # 1 of 2.5 weighted points
        self.assertEqual(out['ai_score'], 80)

    def test_analyze_clamps_bad_score(self):
        with fake_groq({'score': 'lots', 'requirements': []}):
            self.assertEqual(services.analyze(RESUME, 'job')['ai_score'], 0)


class MatchViewTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('asha', password='Blue-River-42')
        self.client.force_authenticate(self.user)
        self.resume = Resume.objects.create(user=self.user, file='resumes/x.pdf', text=RESUME)

    def test_requires_resume_and_job(self):
        r = self.client.post('/api/ai/match/', {'resume_id': self.resume.id})
        self.assertEqual(r.status_code, 400)

    def test_final_score_blends_keywords_and_ai(self):
        result = {'coverage': 50, 'ai_score': 100, 'matched': ['python'], 'missing': ['go'],
                  'summary': '', 'strengths': [], 'tips': []}
        with mock.patch('ai.views.analyze', return_value=result):
            r = self.client.post('/api/ai/match/', {'resume_id': self.resume.id, 'job_description': 'Python dev'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['final_score'], 80)  # 0.4*50 + 0.6*100

    def test_cannot_use_someone_elses_resume(self):
        other = User.objects.create_user('ravi', password='Blue-River-42')
        theirs = Resume.objects.create(user=other, file='resumes/y.pdf', text=RESUME)
        r = self.client.post('/api/ai/match/', {'resume_id': theirs.id, 'job_description': 'Python dev'})
        self.assertEqual(r.status_code, 404)

    def test_ai_failure_returns_502(self):
        with mock.patch('ai.views.analyze', side_effect=RuntimeError('down')):
            r = self.client.post('/api/ai/match/', {'resume_id': self.resume.id, 'job_description': 'Python dev'})
        self.assertEqual(r.status_code, 502)

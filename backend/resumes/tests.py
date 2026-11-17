import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Resume

MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA)
class ResumeUploadTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('asha', password='Blue-River-42')
        self.client.force_authenticate(self.user)

    def upload(self, name, content):
        return self.client.post('/api/resumes/', {'file': SimpleUploadedFile(name, content)}, format='multipart')

    def test_rejects_non_pdf_name(self):
        r = self.upload('resume.docx', b'hello')
        self.assertEqual(r.status_code, 400)

    def test_rejects_file_renamed_to_pdf(self):
        r = self.upload('resume.pdf', b'not really a pdf')
        self.assertEqual(r.status_code, 400)
        self.assertIn('not a real PDF', r.data['error'])

    @override_settings(MAX_RESUME_BYTES=10)
    def test_rejects_large_file(self):
        r = self.upload('resume.pdf', b'%PDF-' + b'x' * 50)
        self.assertEqual(r.status_code, 400)
        self.assertIn('too large', r.data['error'])

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/resumes/').status_code, 401)

    def test_users_cannot_see_each_others_resumes(self):
        other = User.objects.create_user('ravi', password='Blue-River-42')
        theirs = Resume.objects.create(user=other, file='resumes/x.pdf', text='Python Django')
        self.assertEqual(self.client.get(f'/api/resumes/{theirs.id}/').status_code, 404)
        self.assertEqual(self.client.delete(f'/api/resumes/{theirs.id}/').status_code, 404)
        self.assertEqual(self.client.get('/api/resumes/').data, [])
        self.assertTrue(Resume.objects.filter(pk=theirs.id).exists())

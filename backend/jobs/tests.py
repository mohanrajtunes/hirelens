from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Application


class ApplicationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('asha', password='Blue-River-42')
        self.other = User.objects.create_user('ravi', password='Blue-River-42')
        self.client.force_authenticate(self.user)

    def test_create_belongs_to_current_user(self):
        r = self.client.post('/api/jobs/', {'company': 'Acme', 'role': 'Backend Developer', 'user': self.other.id})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Application.objects.get(pk=r.data['id']).user, self.user)

    def test_list_only_shows_own_applications(self):
        Application.objects.create(user=self.user, company='Acme', role='Dev')
        Application.objects.create(user=self.other, company='Other', role='Dev')
        r = self.client.get('/api/jobs/')
        self.assertEqual([a['company'] for a in r.data], ['Acme'])

    def test_cannot_edit_someone_elses_application(self):
        theirs = Application.objects.create(user=self.other, company='Other', role='Dev')
        r = self.client.patch(f'/api/jobs/{theirs.id}/', {'status': 'offer'})
        self.assertEqual(r.status_code, 404)

    def test_filter_by_status_and_stats(self):
        Application.objects.create(user=self.user, company='A', role='Dev', status='applied')
        Application.objects.create(user=self.user, company='B', role='Dev', status='applied')
        Application.objects.create(user=self.user, company='C', role='Dev', status='interview')
        self.assertEqual(len(self.client.get('/api/jobs/?status=applied').data), 2)
        stats = self.client.get('/api/jobs/stats/').data
        self.assertEqual(stats['total'], 3)
        self.assertEqual(stats['by_status'], {'applied': 2, 'interview': 1})

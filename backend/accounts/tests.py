from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase


class AuthTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset rate-limit counters between tests

    def test_register_hashes_password(self):
        r = self.client.post('/api/auth/register/', {'username': 'asha', 'email': 'a@x.com', 'password': 'Blue-River-42'})
        self.assertEqual(r.status_code, 201)
        user = User.objects.get(username='asha')
        self.assertNotEqual(user.password, 'Blue-River-42')
        self.assertTrue(user.check_password('Blue-River-42'))
        self.assertNotIn('password', r.data)

    def test_register_rejects_weak_password(self):
        r = self.client.post('/api/auth/register/', {'username': 'asha', 'password': '12345678'})
        self.assertEqual(r.status_code, 400)
        self.assertIn('password', r.data)

    def test_login_then_me(self):
        User.objects.create_user('asha', 'a@x.com', 'Blue-River-42')
        r = self.client.post('/api/auth/login/', {'username': 'asha', 'password': 'Blue-River-42'})
        self.assertEqual(r.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + r.data['access'])
        me = self.client.get('/api/auth/me/')
        self.assertEqual(me.data['username'], 'asha')

    def test_me_requires_login(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_logout_blacklists_refresh_token(self):
        User.objects.create_user('asha', 'a@x.com', 'Blue-River-42')
        tokens = self.client.post('/api/auth/login/', {'username': 'asha', 'password': 'Blue-River-42'}).data
        self.assertEqual(self.client.post('/api/auth/logout/', {'refresh': tokens['refresh']}).status_code, 205)
        again = self.client.post('/api/auth/refresh/', {'refresh': tokens['refresh']})
        self.assertEqual(again.status_code, 401)

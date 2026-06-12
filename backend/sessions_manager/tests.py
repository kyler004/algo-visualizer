from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import CollabSession, SavedSession

class SessionsManagerTests(APITestCase):
    def setUp(self):
        self.create_session_url = reverse('create-session')
        self.saved_sessions_url = reverse('saved-sessions')
        
        self.user = User.objects.create_user(username='testuser', password='password')
        self.other_user = User.objects.create_user(username='otheruser', password='password')
        
    def test_create_collab_session(self):
        """Test creating a new collaboration session."""
        response = self.client.post(self.create_session_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('slug', response.data)
        
        # Verify it was saved in DB
        slug = response.data['slug']
        self.assertTrue(CollabSession.objects.filter(slug=slug).exists())

    def test_get_collab_session(self):
        """Test retrieving a collaboration session by slug."""
        session = CollabSession.objects.create(slug='testslug', code='print("hello")')
        url = reverse('session-detail', kwargs={'slug': session.slug})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'testslug')
        self.assertEqual(response.data['code'], 'print("hello")')

    def test_create_saved_session(self):
        """Test creating a saved session (authenticated)."""
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'My Script',
            'code': 'print("hello world")',
            'language': 'python'
        }
        response = self.client.post(self.saved_sessions_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'My Script')
        self.assertIn('id', response.data)
        
        self.assertEqual(SavedSession.objects.count(), 1)

    def test_create_saved_session_unauthenticated(self):
        """Test creating a saved session (unauthenticated) fails."""
        data = {
            'title': 'My Script',
            'code': 'print("hello world")'
        }
        response = self.client.post(self.saved_sessions_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_saved_sessions_list(self):
        """Test listing saved sessions."""
        SavedSession.objects.create(owner=self.user, title='Session 1', code='print("1")')
        SavedSession.objects.create(owner=self.other_user, title='Session 2', code='print("2")')
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.saved_sessions_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Session 1')

    def test_get_saved_session_detail(self):
        """Test getting a specific saved session."""
        session = SavedSession.objects.create(owner=self.user, title='Session 1', code='print("1")')
        url = reverse('saved-session-detail', kwargs={'pk': session.id})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Session 1')
        self.assertEqual(response.data['code'], 'print("1")')

    def test_update_saved_session(self):
        """Test updating a saved session title."""
        session = SavedSession.objects.create(owner=self.user, title='Old Title')
        url = reverse('saved-session-detail', kwargs={'pk': session.id})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(url, {'title': 'New Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'New Title')
        
        session.refresh_from_db()
        self.assertEqual(session.title, 'New Title')

    def test_delete_saved_session(self):
        """Test deleting a saved session."""
        session = SavedSession.objects.create(owner=self.user, title='Delete Me')
        url = reverse('saved-session-detail', kwargs={'pk': session.id})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SavedSession.objects.count(), 0)

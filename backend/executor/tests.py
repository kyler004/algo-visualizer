from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .runner import execute_python

class ExecutorTests(APITestCase):
    def setUp(self):
        self.execute_url = reverse('execute-code')

    def test_execute_python_valid_code(self):
        """Test the execute_python function with valid code."""
        code = "a = 5\nb = 10\nc = a + b\nprint(c)"
        result = execute_python(code)
        self.assertTrue(result['success'])
        self.assertIn('steps', result)
        self.assertTrue(len(result['steps']) > 0)
        # Final output should contain 15
        last_step = result['steps'][-1]
        self.assertTrue(any('15' in out for out in last_step.get('output', [])))

    def test_execute_python_syntax_error(self):
        """Test the execute_python function with a syntax error."""
        code = "a = 5\nprint(a"
        result = execute_python(code)
        self.assertFalse(result['success'])
        last_step = result['steps'][-1]
        self.assertIn('error', last_step)
        self.assertIn('SyntaxError', last_step['error'].get('type', ''))

    def test_execute_api_valid(self):
        """Test the API endpoint with valid python code."""
        data = {
            'code': 'print("hello world")',
            'language': 'python'
        }
        response = self.client.post(self.execute_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        last_step = response.data['steps'][-1]
        self.assertTrue(any('hello world' in out for out in last_step.get('output', [])))

    def test_execute_api_unsupported_language(self):
        """Test the API endpoint with an unsupported language."""
        data = {
            'code': 'console.log("hello world");',
            'language': 'javascript'
        }
        response = self.client.post(self.execute_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

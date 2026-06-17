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

    def test_execute_python_list_envelope(self):
        """Lists are serialized with _kind envelope."""
        code = "arr = [1, 2, 3]"
        result = execute_python(code)
        self.assertTrue(result['success'])
        steps_with_arr = [
            s for s in result['steps']
            if 'arr' in s.get('variables', {})
        ]
        self.assertTrue(len(steps_with_arr) > 0)
        arr_val = steps_with_arr[-1]['variables']['arr']
        self.assertEqual(arr_val['_kind'], 'list')
        self.assertEqual(arr_val['items'], [1, 2, 3])

    def test_execute_python_class_instance(self):
        """User class instances serialize with _kind instance and attrs."""
        code = """
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

root = TreeNode(5, TreeNode(3), TreeNode(8))
"""
        result = execute_python(code)
        self.assertTrue(result['success'])
        steps_with_root = [
            s for s in result['steps']
            if 'root' in s.get('variables', {})
        ]
        self.assertTrue(len(steps_with_root) > 0)
        root = steps_with_root[-1]['variables']['root']
        self.assertEqual(root['_kind'], 'instance')
        self.assertEqual(root['class'], 'TreeNode')
        self.assertEqual(root['attrs']['val'], 5)
        self.assertEqual(root['attrs']['left']['_kind'], 'instance')
        self.assertEqual(root['attrs']['left']['attrs']['val'], 3)

    def test_execute_python_circular_reference(self):
        """Circular references serialize as _kind ref."""
        code = """
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

node = Node(1)
node.next = node
"""
        result = execute_python(code)
        self.assertTrue(result['success'])
        steps_with_node = [
            s for s in result['steps']
            if 'node' in s.get('variables', {})
        ]
        self.assertTrue(len(steps_with_node) > 0)
        node = steps_with_node[-1]['variables']['node']
        self.assertEqual(node['_kind'], 'instance')
        self.assertEqual(node['attrs']['next']['_kind'], 'ref')
        self.assertEqual(node['attrs']['next']['class'], 'Node')

    def test_execute_python_nested_dict_in_instance(self):
        """Nested dicts inside instances use _kind dict envelope."""
        code = """
class Box:
    def __init__(self):
        self.data = {'x': 1, 'y': 2}

b = Box()
"""
        result = execute_python(code)
        self.assertTrue(result['success'])
        steps_with_b = [
            s for s in result['steps']
            if 'b' in s.get('variables', {})
        ]
        self.assertTrue(len(steps_with_b) > 0)
        b = steps_with_b[-1]['variables']['b']
        self.assertEqual(b['_kind'], 'instance')
        self.assertEqual(b['attrs']['data']['_kind'], 'dict')
        self.assertEqual(b['attrs']['data']['entries']['x'], 1)

# executor/tracer.py
import sys
import copy
import io


class AlgoTracer:
    """
    Instruments Python code using sys.settrace to capture
    a step-by-step snapshot of execution.
    """

    MAX_DEPTH = 4
    MAX_KEYS = 20

    def __init__(self, max_steps=500):
        self.steps = []
        self.call_stack = []
        self.captured_output = []   # Stores print() output
        self.max_steps = max_steps  # Safety limit — prevents infinite loops
        self._stdout_buffer = io.StringIO()

    # ------------------------------------------------------------------
    # Helper: safely convert any Python value to something JSON can hold
    # ------------------------------------------------------------------
    def _object_id(self, value) -> str:
        return hex(id(value))

    def _is_user_instance(self, value) -> bool:
        return hasattr(value, '__dict__') and not isinstance(
            value, (type, type(sys))
        )

    def _safe_repr(self, value, depth=0, seen_ids=None):
        """
        Recursively convert a value to a JSON-serializable form.
        Primitives stay raw; complex values use typed _kind envelopes.
        """
        if seen_ids is None:
            seen_ids = set()

        if depth > self.MAX_DEPTH:
            return {'_kind': 'repr', 'value': '...'}

        if isinstance(value, (int, float, str, bool, type(None))):
            return value

        if isinstance(value, (list, tuple)):
            return {
                '_kind': 'list',
                'items': [
                    self._safe_repr(v, depth + 1, seen_ids) for v in value
                ],
            }

        if isinstance(value, dict):
            return {
                '_kind': 'dict',
                'entries': {
                    str(k): self._safe_repr(v, depth + 1, seen_ids)
                    for k, v in list(value.items())[:self.MAX_KEYS]
                },
            }

        if isinstance(value, set):
            return {
                '_kind': 'set',
                'items': [
                    self._safe_repr(v, depth + 1, seen_ids) for v in value
                ],
            }

        if self._is_user_instance(value):
            obj_id = id(value)
            if obj_id in seen_ids:
                return {
                    '_kind': 'ref',
                    'id': self._object_id(value),
                    'class': type(value).__name__,
                }

            seen_ids = seen_ids | {obj_id}
            attrs = {}
            for k, v in list(value.__dict__.items())[:self.MAX_KEYS]:
                if k.startswith('__'):
                    continue
                attrs[k] = self._safe_repr(v, depth + 1, seen_ids)

            return {
                '_kind': 'instance',
                'class': type(value).__name__,
                'id': self._object_id(value),
                'attrs': attrs,
            }

        return {'_kind': 'repr', 'value': repr(value)}

    # ------------------------------------------------------------------
    # Helper: extract local variables from the current frame
    # ------------------------------------------------------------------
    def _capture_variables(self, frame):
        """
        A frame is Python's representation of a function call in progress.
        frame.f_locals holds the current local variables.
        """
        variables = {}
        for name, value in frame.f_locals.items():
            if name.startswith('__'):
                continue
            try:
                variables[name] = self._safe_repr(value)
            except Exception:
                variables[name] = {'_kind': 'repr', 'value': '<unrepresentable>'}
        return variables

    # ------------------------------------------------------------------
    # The trace function — Python calls this before every event
    # ------------------------------------------------------------------
    def _trace(self, frame, event, arg):
        """
        Python calls this function with 3 arguments:
          - frame: the current execution frame (variables, line number, etc.)
          - event: what just happened ('call', 'line', 'return', 'exception')
          - arg:   event-specific data (return value, exception info, etc.)
        """

        if frame.f_code.co_filename != '<user_code>':
            return self._trace

        if len(self.steps) >= self.max_steps:
            return None

        func_name = frame.f_code.co_name
        line_no = frame.f_lineno

        current_output = self._stdout_buffer.getvalue()
        if current_output:
            self.captured_output.append(current_output)
            self._stdout_buffer.truncate(0)
            self._stdout_buffer.seek(0)

        if event == 'call':
            self.call_stack.append({
                'function': func_name,
                'line': line_no
            })
            self.steps.append({
                'step': len(self.steps) + 1,
                'event': 'call',
                'line': line_no,
                'function': func_name,
                'variables': self._capture_variables(frame),
                'call_stack': copy.deepcopy(self.call_stack),
                'output': list(self.captured_output),
            })

        elif event == 'line':
            self.steps.append({
                'step': len(self.steps) + 1,
                'event': 'line',
                'line': line_no,
                'function': func_name,
                'variables': self._capture_variables(frame),
                'call_stack': copy.deepcopy(self.call_stack),
                'output': list(self.captured_output),
            })

        elif event == 'return':
            return_value = self._safe_repr(arg)

            self.steps.append({
                'step': len(self.steps) + 1,
                'event': 'return',
                'line': line_no,
                'function': func_name,
                'return_value': return_value,
                'variables': self._capture_variables(frame),
                'call_stack': copy.deepcopy(self.call_stack),
                'output': list(self.captured_output),
            })

            if self.call_stack:
                self.call_stack.pop()

        elif event == 'exception':
            exc_type, exc_value, _ = arg
            self.steps.append({
                'step': len(self.steps) + 1,
                'event': 'exception',
                'line': line_no,
                'function': func_name,
                'exception': {
                    'type': exc_type.__name__,
                    'message': str(exc_value),
                },
                'variables': self._capture_variables(frame),
                'call_stack': copy.deepcopy(self.call_stack),
                'output': list(self.captured_output),
            })

        return self._trace

    # ------------------------------------------------------------------
    # Public method: run user code and return steps
    # ------------------------------------------------------------------
    def run(self, code):
        """
        Executes user code with tracing enabled.
        Returns a list of step snapshots.
        """
        old_stdout = sys.stdout
        sys.stdout = self._stdout_buffer

        try:
            sys.settrace(self._trace)
            compiled = compile(code, '<user_code>', 'exec')
            exec(compiled, {})

        except Exception as e:
            self.steps.append({
                'step': len(self.steps) + 1,
                'event': 'error',
                'error': {
                    'type': type(e).__name__,
                    'message': str(e),
                },
                'call_stack': [],
                'variables': {},
                'output': [],
            })

        finally:
            sys.settrace(None)
            sys.stdout = old_stdout

        return self.steps

# executor/tracer.py
import sys
import json
import copy
import io


class AlgoTracer:
    """
    Instruments Python code using sys.settrace to capture
    a step-by-step snapshot of execution.
    """

    def __init__(self, max_steps=500):
        self.steps = []
        self.call_stack = []
        self.captured_output = []   # Stores print() output
        self.max_steps = max_steps  # Safety limit — prevents infinite loops
        self._stdout_buffer = io.StringIO()

    # ------------------------------------------------------------------
    # Helper: safely convert any Python value to something JSON can hold
    # ------------------------------------------------------------------
    def _safe_repr(self, value, depth=0):
        """
        Recursively convert a value to a JSON-serializable form.
        We limit depth to avoid blowing up on circular references.
        """
        if depth > 4:
            return '...'

        if isinstance(value, (int, float, str, bool, type(None))):
            return value

        if isinstance(value, (list, tuple)):
            return [self._safe_repr(v, depth + 1) for v in value]

        if isinstance(value, dict):
            return {
                str(k): self._safe_repr(v, depth + 1)
                for k, v in list(value.items())[:20]  # Cap at 20 keys
            }

        if isinstance(value, set):
            return list(self._safe_repr(v, depth + 1) for v in value)

        # Fallback — use Python's built-in repr()
        return repr(value)

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
            # Skip dunder names like __builtins__
            if name.startswith('__'):
                continue
            try:
                variables[name] = self._safe_repr(value)
            except Exception:
                variables[name] = '<unrepresentable>'
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

        # Only trace code the user wrote, not Django internals
        if frame.f_code.co_filename != '<user_code>':
            return self._trace

        # Safety valve — stop if we've hit the step limit
        if len(self.steps) >= self.max_steps:
            return None

        func_name = frame.f_code.co_name
        line_no = frame.f_lineno

        # Grab any print() output that happened since last step
        current_output = self._stdout_buffer.getvalue()
        if current_output:
            self.captured_output.append(current_output)
            self._stdout_buffer.truncate(0)
            self._stdout_buffer.seek(0)

        # ---- CALL: a function is being entered ----
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

        # ---- LINE: about to execute a line ----
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

        # ---- RETURN: a function is returning ----
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

            # Pop the function off the call stack as it returns
            if self.call_stack:
                self.call_stack.pop()

        # ---- EXCEPTION: something went wrong ----
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

        return self._trace  # Must return itself to keep tracing

    # ------------------------------------------------------------------
    # Public method: run user code and return steps
    # ------------------------------------------------------------------
    def run(self, code):
        """
        Executes user code with tracing enabled.
        Returns a list of step snapshots.
        """
        # Redirect stdout so we capture print() calls
        old_stdout = sys.stdout
        sys.stdout = self._stdout_buffer

        try:
            sys.settrace(self._trace)
            # compile() lets us name the "file" <user_code>
            # so our tracer knows to only trace user lines
            compiled = compile(code, '<user_code>', 'exec')
            exec(compiled, {})  # Empty globals = clean sandbox

        except Exception as e:
            # Code threw an unhandled exception — still return what we got
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
            sys.settrace(None)       # Always turn off tracing
            sys.stdout = old_stdout  # Always restore stdout

        return self.steps
from .tracer import AlgoTracer

def execute_python(code: str, max_steps: int = 500) -> dict:
    """
    Entry point forall python Request
    Returns a structured result dict.
    """
    if not code or not code.strip():
        return{
            'success': False,
            'error': 'No code provided',
            'steps': [],
        }

    # Basic length check - don't run massive scripts
    if len(code) > 10_000:
        return {
            'success': False,
            'error': 'Code too long (max 10, 000 characters)',
            'steps': [],
        }

    tracer = AlgoTracer(max_steps=max_steps)
    steps = tracer.run(code)

    # Did the execution end in an error?
    had_error = any(s['event'] in ('error', 'exception') for s in steps)

    return {
        'success': not had_error,
        'total_steps': len(steps),
        'steps': steps,
    }

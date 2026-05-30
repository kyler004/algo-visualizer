// Language type either python and javascript
export type Language = 'python' | 'javascript';

// The vents our tracer emits
export type EventType = 'line' | 'call' | 'return' | 'exception' | 'error';

// A single frame in the call stack
export interface CallFrame {
    function: string;
    line: number;
}

// One snapshot of execution state - this is what Django sends us per step
export interface Step {
    step: number;
    event: EventType;
    line: number;
    function: string;
    variables: Record<string, unknown>;
    call_stack: CallFrame[];
    output: string[];
    return_value?: unknown;
    exception?: {
        type: string;
        message: string;
    }
    error?: {
        type: string;
        message: string;
    }
}

// The full response from the POST /api/execute/
export interface ExecutionResult {
    success: boolean;
    total_steps: number;
    steps: Step[];
    error?: string;
}
// Language type either python and javascript
export type Language = "python" | "javascript";

// Re-export serialized value types
export type {
  SerializedValue,
  KindedValue,
  InstanceValue,
  RefValue,
  ListValue,
  DictValue,
  CollectedInstance,
  ReferenceEdge,
} from './value'

export type VisualizerTab = 'variables' | 'structure' | 'graph'

export type { ThemeId } from '../themes/definitions'

// The vents our tracer emits
export type EventType = "line" | "call" | "return" | "exception" | "error";

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
  };
  error?: {
    type: string;
    message: string;
  };
}

// The full response from the POST /api/execute/
export interface ExecutionResult {
  success: boolean;
  total_steps: number;
  steps: Step[];
  error?: string;
}

// ── Collaboration ────────────────────────────────────────────────────────────

// Unique colour assigned to each user in a room
export type UserColor =
  | "#4d9fff"
  | "#f59e0b"
  | "#22c55e"
  | "#a78bfa"
  | "#ef4444"
  | "#ec4899";

export interface CollabUser {
  id: string;
  name: string;
  color: UserColor;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface RemoteCursor {
  user: CollabUser;
  position: CursorPosition;
}

// Every WebSocket message follows this shape
export type WsMessageType =
  | "user_join"
  | "user_leave"
  | "room_state"
  | "code_change"
  | "cursor_change"
  | "step_change";

export interface WsMessage {
  type: WsMessageType;
  payload: Record<string, unknown>;
  user: CollabUser;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:       number
  username: string
  email:    string
}

export interface AuthTokens {
  access:  string
  refresh: string
}

// ── Saved Sessions ────────────────────────────────────────────────────────────

export interface SavedSession {
  id:           string
  title:        string
  language:     string
  code_preview?: string
  code?:        string
  created_at:   string
  updated_at:   string
}
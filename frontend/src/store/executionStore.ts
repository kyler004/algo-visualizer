import { create } from 'zustand'
import type { Step, Language } from '../types'

const DEFAULT_CODE = `def add(a, b):
    result = a + b
    return result

x = 10
y = 5
total = add(x, y)
print(total)`

// Define the full shape of our store — state + actions in one interface
interface ExecutionState {
    // ── Editor ──────────────────────────────────────────────
    code: string
    language: Language

    // ── Execution ───────────────────────────────────────────
    steps: Step[]
    currentStepIndex: number
    isLoading: boolean
    error: string | null

    // ── Playback ────────────────────────────────────────────
    isPlaying: boolean
    playbackSpeed: number

    // ── Actions ─────────────────────────────────────────────
    setCode: (code: string) => void
    setLanguage: (language: Language) => void
    setSteps: (steps: Step[]) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    nextStep: () => void
    prevStep: () => void
    goToStep: (index: number) => void
    setPlaying: (isPlaying: boolean) => void
    setPlaybackSpeed: (speed: number) => void
    reset: () => void
}

// create<T>() is Zustand's TypeScript pattern — the extra () is intentional
const useExecutionStore = create<ExecutionState>()((set, get) => ({
    code: DEFAULT_CODE,
    language: 'python',
    steps: [],
    currentStepIndex: -1,
    isLoading: false,
    error: null,
    isPlaying: false,
    playbackSpeed: 800,

    setCode: (code) => set({ code }),
    setLanguage: (language) => set({ language }),

    setSteps: (steps) => set({
        steps,
        currentStepIndex: steps.length > 0 ? 0 : -1,
    }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    nextStep: () => {
        const { currentStepIndex, steps } = get()
        if (currentStepIndex < steps.length - 1) {
            set({ currentStepIndex: currentStepIndex + 1 })
        } else {
            set({ isPlaying: false })
        }
    },

    prevStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex > 0) {
            set({ currentStepIndex: currentStepIndex - 1 })
        }
    },

    goToStep: (index) => {
        const { steps } = get()
        if (index >= 0 && index < steps.length) {
            set({ currentStepIndex: index })
        }
    },

    setPlaying: (isPlaying) => set({ isPlaying }),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    reset: () => set({
        steps: [], currentStepIndex: -1, isPlaying: false, error: null,
    }),
}))

export default useExecutionStore;
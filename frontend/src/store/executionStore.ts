import { create } from 'zustand'
import type { Step, Language, VisualizerTab } from '../types'
import { isInstanceValue } from '../utils/valueUtils'

const DEFAULT_CODE = `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

root = TreeNode(5, TreeNode(3), TreeNode(8))
print(root.val)

# Bubble sort example:
# def bubble_sort(arr):
#     n = len(arr)
#     for i in range(n):
#         for j in range(0, n - i - 1):
#             if arr[j] > arr[j + 1]:
#                 arr[j], arr[j + 1] = arr[j + 1], arr[j]
#     return arr
# arr = [5, 3, 8, 1, 9, 2, 7, 4]
# result = bubble_sort(arr)
# print(result)`

function detectActiveInstance(step: Step | undefined, prevStep: Step | undefined): string | null {
  if (!step || step.event !== 'call') return null
  const prevVars = prevStep?.variables ?? {}
  for (const [name, val] of Object.entries(step.variables)) {
    if (isInstanceValue(val) && !prevVars[name]) {
      return val.id
    }
    if (name === 'self' && isInstanceValue(val)) {
      return val.id
    }
  }
  return null
}

interface ExecutionState {
  code: string
  language: Language
  steps: Step[]
  currentStepIndex: number
  isLoading: boolean
  error: string | null
  isPlaying: boolean
  playbackSpeed: number
  activeInstanceId: string | null
  visualizerTab: VisualizerTab
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
  setActiveInstanceId: (id: string | null) => void
  setVisualizerTab: (tab: VisualizerTab) => void
  reset: () => void
}

function applyStepIndex(index: number, steps: Step[]) {
  const step = steps[index]
  const prevStep = index > 0 ? steps[index - 1] : undefined
  const activeId = detectActiveInstance(step, prevStep)
  return {
    currentStepIndex: index,
    activeInstanceId: activeId,
  }
}

const useExecutionStore = create<ExecutionState>()((set, get) => ({
  code: DEFAULT_CODE,
  language: 'python',
  steps: [],
  currentStepIndex: -1,
  isLoading: false,
  error: null,
  isPlaying: false,
  playbackSpeed: 800,
  activeInstanceId: null,
  visualizerTab: 'variables',

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),

  setSteps: (steps) => set({
    steps,
    currentStepIndex: steps.length > 0 ? 0 : -1,
    activeInstanceId: steps.length > 0
      ? detectActiveInstance(steps[0], undefined)
      : null,
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  nextStep: () => {
    const { currentStepIndex, steps } = get()
    if (currentStepIndex < steps.length - 1) {
      set(applyStepIndex(currentStepIndex + 1, steps))
    } else {
      set({ isPlaying: false })
    }
  },

  prevStep: () => {
    const { currentStepIndex, steps } = get()
    if (currentStepIndex > 0) {
      set(applyStepIndex(currentStepIndex - 1, steps))
    }
  },

  goToStep: (index) => {
    const { steps } = get()
    if (index >= 0 && index < steps.length) {
      set(applyStepIndex(index, steps))
    }
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setActiveInstanceId: (id) => set({ activeInstanceId: id }),
  setVisualizerTab: (tab) => set({ visualizerTab: tab }),

  reset: () => set({
    steps: [],
    currentStepIndex: -1,
    isPlaying: false,
    error: null,
    activeInstanceId: null,
  }),
}))

export default useExecutionStore

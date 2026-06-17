import { motion, AnimatePresence } from 'framer-motion'
import useExecutionStore from '../../store/executionStore'
import { useStepAnimation } from '../../hooks/useStepAnimation'
import type { CallFrame } from '../../types'
import { isInstanceValue } from '../../utils/valueUtils'

function getConstructorClass(
  frame: CallFrame,
  variables: Record<string, unknown>,
): string | null {
  if (frame.function !== '__init__') return null
  const self = variables['self']
  if (isInstanceValue(self)) return self.class
  return null
}

export default function CallStackPanel() {
  const { steps, currentStepIndex, activeInstanceId } = useExecutionStore()
  const { currentEvent } = useStepAnimation()
  const currentStep = steps[currentStepIndex]

  const callStack: CallFrame[] = [...(currentStep?.call_stack ?? [])].reverse()
  const variables = currentStep?.variables ?? {}

  return (
    <div className="bg-bg-panel p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
        Call Stack
      </h3>

      {callStack.length === 0 ? (
        <p className="text-text-secondary text-sm">
          {currentStep ? 'Stack is empty' : 'Run code to see the call stack'}
        </p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {callStack.map((frame, i) => {
              const isTop = i === 0
              const ctorClass = isTop ? getConstructorClass(frame, variables) : null
              const isActiveCtor =
                isTop &&
                frame.function === '__init__' &&
                activeInstanceId !== null

              const displayName =
                frame.function === '<module>'
                  ? '(module)'
                  : frame.function === '__init__' && ctorClass
                    ? `${ctorClass}.__init__()`
                    : `${frame.function}()`

              return (
                <motion.div
                  key={`${frame.function}-${frame.line}-${i}`}
                  initial={
                    isTop && currentEvent === 'call'
                      ? { opacity: 0, y: -12 }
                      : { opacity: 0, x: -8 }
                  }
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={
                    isTop && currentEvent === 'return'
                      ? { opacity: 0, y: -12 }
                      : { opacity: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono
                    ${isTop
                      ? 'bg-accent-blue/10 border border-accent-blue/20'
                      : 'bg-bg-hover'}
                    ${isActiveCtor ? 'ring-1 ring-instance/50 shadow-[0_0_12px_color-mix(in_srgb,var(--color-instance)_15%,transparent)]' : ''}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                      ${isTop ? 'bg-accent-blue' : 'bg-border-subtle'}`}
                  />
                  <span className={isTop ? 'text-accent-blue' : 'text-text-secondary'}>
                    {displayName}
                  </span>
                  <span className="ml-auto text-xs text-text-secondary">
                    line {frame.line}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

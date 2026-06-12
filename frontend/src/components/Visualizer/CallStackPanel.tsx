import { motion, AnimatePresence } from 'framer-motion'
import useExecutionStore from '../../store/executionStore'
import type { CallFrame } from '../../types'

export default function CallStackPanel() {
    const { steps, currentStepIndex } = useExecutionStore()
    const currentStep = steps[currentStepIndex]

    const callStack: CallFrame[] = [...(currentStep?.call_stack ?? [])].reverse()

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
                        {callStack.map((frame, i) => (
                            <motion.div
                                key={`${frame.function}-${i}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono
                  ${i === 0
                                    ? 'bg-accent-blue/10 border border-accent-blue/20'
                                    : 'bg-bg-hover'}`}
                            >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${i === 0 ? 'bg-accent-blue' : 'bg-border-subtle'}`}
                />
                                <span className={i === 0 ? 'text-accent-blue' : 'text-text-secondary'}>
                  {frame.function === '<module>' ? '(module)' : `${frame.function}()`}
                </span>
                                <span className="ml-auto text-xs text-text-secondary">line {frame.line}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
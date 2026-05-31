import { motion, AnimatePresence } from 'framer-motion'
import useExecutionStore from '../../store/executionStore'

type ValueType = 'number' | 'string' | 'boolean' | 'list' | 'object' | 'null' | 'undefined'

const TYPE_COLORS: Record<ValueType, string> = {
    number:    'text-yellow-400',
    string:    'text-amber-400',
    boolean:   'text-blue-400',
    list:      'text-green-400',
    object:    'text-purple-400',
    null:      'text-gray-500',
    undefined: 'text-gray-500',
}

function getType(value: unknown): ValueType {
    if (Array.isArray(value)) return 'list'
    if (value === null)       return 'null'
    if (value === undefined)  return 'undefined'
    return typeof value as ValueType
}

export default function VariablesPanel() {
    const { steps, currentStepIndex } = useExecutionStore()
    const currentStep = steps[currentStepIndex]
    const prevStep    = steps[currentStepIndex - 1]

    const variables:     Record<string, unknown> = currentStep?.variables ?? {}
    const prevVariables: Record<string, unknown> = prevStep?.variables    ?? {}
    const entries = Object.entries(variables)

    return (
        <div className="bg-bg-panel p-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Variables
            </h3>

            {entries.length === 0 ? (
                <p className="text-text-secondary text-sm">
                    {currentStep ? 'No variables in scope' : 'Run code to see variables'}
                </p>
            ) : (
                <div className="space-y-1.5">
                    <AnimatePresence initial={false}>
                        {entries.map(([name, value]) => {
                            const changed = JSON.stringify(value) !== JSON.stringify(prevVariables[name])
                            const type    = getType(value)
                            return (
                                <motion.div
                                    key={name}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`flex items-center justify-between px-3 py-1.5 rounded text-sm font-mono
                    ${changed ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-bg-hover'}`}
                                >
                                    <span className="text-text-secondary">{name}</span>
                                    <div className="flex items-center gap-2">
                    <span className={`text-xs ${TYPE_COLORS[type] ?? 'text-text-secondary'}`}>
                      {type}
                    </span>
                                        <span className="text-text-primary">{JSON.stringify(value)}</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
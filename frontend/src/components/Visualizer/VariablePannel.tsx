import { motion, AnimatePresence } from 'framer-motion'
import useExecutionStore from '../../store/executionStore'
import SmartValueRenderer from './renderers/SmartValueRenderer'

type TypeLabel = 'number' | 'string' | 'boolean' | 'list' | 'dict' | 'null' | 'unknown'

const TYPE_COLORS: Record<TypeLabel, string> = {
    number:  'text-yellow-400',
    string:  'text-amber-400',
    boolean: 'text-blue-400',
    list:    'text-green-400',
    dict:    'text-purple-400',
    null:    'text-gray-500',
    unknown: 'text-text-secondary',
}

function getTypeLabel(value: unknown): TypeLabel {
    if (Array.isArray(value))                        return 'list'
    if (value === null)                              return 'null'
    if (typeof value === 'object')                   return 'dict'
    const t = typeof value
    if (t === 'number' || t === 'string' || t === 'boolean') return t
    return 'unknown'
}

export default function VariablesPanel() {
    const { steps, currentStepIndex } = useExecutionStore()
    const currentStep = steps[currentStepIndex]
    const prevStep    = steps[currentStepIndex - 1]

    const variables     = currentStep?.variables ?? {}
    const prevVariables = prevStep?.variables    ?? {}
    const entries       = Object.entries(variables)

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
                <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                        {entries.map(([name, value]) => {
                            const type      = getTypeLabel(value)
                            const isComplex = type === 'list' || type === 'dict'

                            return (
                                <motion.div
                                    key={name}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="px-3 py-2.5 rounded bg-bg-hover"
                                >
                                    {/* Header: variable name + type badge */}
                                    <div className={`flex items-center gap-2
                    ${isComplex ? 'mb-1' : 'justify-between'}`}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-sm text-text-secondary truncate">
                        {name}
                      </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded
                        bg-bg-primary/60 shrink-0 ${TYPE_COLORS[type]}`}>
                        {type}
                      </span>
                                        </div>

                                        {/* Primitive values shown inline with the header */}
                                        {!isComplex && (
                                            <SmartValueRenderer
                                                name={name}
                                                value={value}
                                                prevValue={prevVariables[name]}
                                            />
                                        )}
                                    </div>

                                    {/* Complex values (arrays, objects) rendered below the header */}
                                    {isComplex && (
                                        <SmartValueRenderer
                                            name={name}
                                            value={value}
                                            prevValue={prevVariables[name]}
                                        />
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
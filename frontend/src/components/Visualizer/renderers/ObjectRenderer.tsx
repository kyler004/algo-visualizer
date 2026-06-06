import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    value:      Record<string, unknown>
    prevValue?: Record<string, unknown>
}

export default function ObjectRenderer({ value, prevValue }: Props) {
    const entries = Object.entries(value)

    if (entries.length === 0) {
        return <span className="font-mono text-sm text-text-secondary">{'{}'}</span>
    }

    return (
        <div className="mt-1.5 border border-border-subtle rounded overflow-hidden">
            <AnimatePresence initial={false}>
                {entries.map(([key, val], i) => {
                    const changed = JSON.stringify(val) !== JSON.stringify(prevValue?.[key])
                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono
                ${i > 0 ? 'border-t border-border-subtle' : ''}
                ${changed ? 'bg-amber-500/5' : 'bg-bg-primary/40'}`}
                        >
                            <span className="text-text-secondary">:</span>
                            <span className={changed ? 'text-amber-400' : 'text-text-primary'}>
                {JSON.stringify(val)}
              </span>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
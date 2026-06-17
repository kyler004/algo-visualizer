import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SmartValueRenderer from './SmartValueRenderer'
import { unwrapDict, diffAttrs } from '../../../utils/valueUtils'
import type { SerializedValue } from '../../../types/value'

interface Props {
  value: unknown
  prevValue?: unknown
  depth?: number
}

const MAX_VISIBLE_DEPTH = 2

export default function ObjectRenderer({ value, prevValue, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(depth < MAX_VISIBLE_DEPTH)
  const entries = Object.entries(unwrapDict(value))
  const prevEntries = unwrapDict(prevValue) as Record<string, SerializedValue>
  const currentEntries = Object.fromEntries(entries) as Record<string, SerializedValue>
  const attrDiff = diffAttrs(currentEntries, prevEntries)

  if (entries.length === 0) {
    return <span className="font-mono text-sm text-text-secondary">{'{}'}</span>
  }

  const collapsed = depth >= MAX_VISIBLE_DEPTH && !expanded

  return (
    <div className={`${depth > 0 ? 'ml-3 border-l border-border-subtle pl-2' : ''} mt-1.5`}>
      {collapsed ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-text-secondary hover:text-text-primary font-mono"
        >
          {'{'} … {entries.length} keys {'}'}
        </button>
      ) : (
        <div className="border border-border-subtle rounded overflow-hidden">
          <AnimatePresence initial={false}>
            {entries.map(([key, val], i) => {
              const change = attrDiff[key] ?? 'same'
              const isChanged = change === 'changed' || change === 'new'

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-start gap-2 px-3 py-1.5 text-xs font-mono
                    ${i > 0 ? 'border-t border-border-subtle' : ''}
                    ${isChanged ? 'bg-accent-amber/5' : 'bg-bg-primary/40'}`}
                >
                  <span className="text-accent-purple shrink-0">{key}</span>
                  <span className="text-text-secondary shrink-0">:</span>
                  <div className="flex-1 min-w-0">
                    <SmartValueRenderer
                      name={key}
                      value={val}
                      prevValue={prevEntries[key]}
                      depth={depth + 1}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
      {depth >= MAX_VISIBLE_DEPTH && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[10px] text-text-secondary hover:text-text-primary mt-1"
        >
          collapse
        </button>
      )}
    </div>
  )
}

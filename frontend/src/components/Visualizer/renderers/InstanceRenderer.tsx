import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SerializedValue } from '../../../types/value'
import {
  isInstanceValue,
  isRefValue,
  diffAttrs,
} from '../../../utils/valueUtils'
import { useStepAnimation } from '../../../hooks/useStepAnimation'
import SmartValueRenderer from './SmartValueRenderer'

interface Props {
  value: SerializedValue
  prevValue?: SerializedValue
  name?: string
  depth?: number
}

const MAX_DEPTH = 3

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04 },
  }),
  exit: { opacity: 0, scale: 0.95 },
}

export default function InstanceRenderer({
  value,
  prevValue,
  name,
  depth = 0,
}: Props) {
  const { currentEvent } = useStepAnimation()
  const [expanded, setExpanded] = useState(depth < MAX_DEPTH)

  if (isRefValue(value)) {
    return (
      <motion.div
        layoutId={`instance-${value.id}`}
        className="mt-1.5 px-3 py-2 rounded border border-dashed border-purple-500/40
          bg-purple-500/5 text-xs font-mono text-purple-300"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-purple-400">{value.class}</span>
        <span className="text-text-secondary ml-2">@ {value.id}</span>
      </motion.div>
    )
  }

  if (!isInstanceValue(value)) return null

  const prevInstance = isInstanceValue(prevValue) ? prevValue : undefined
  const attrDiff = diffAttrs(value.attrs, prevInstance?.attrs)
  const attrEntries = Object.entries(value.attrs)

  return (
    <motion.div
      layoutId={`instance-${value.id}`}
      className={`mt-1.5 rounded border overflow-hidden
        ${name === undefined ? '' : ''}
        border-purple-500/30 bg-purple-500/5`}
      initial={currentEvent === 'call' ? { scale: 0.92, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5
        bg-purple-500/10 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-purple-300 font-mono">
            {value.class}
          </span>
          <span className="text-[10px] text-text-secondary font-mono">
            {value.id}
          </span>
        </div>
        {depth >= MAX_DEPTH && attrEntries.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] text-text-secondary hover:text-text-primary px-1"
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
      </div>

      {/* Attributes */}
      {expanded && (
        <motion.div
          initial="hidden"
          animate="visible"
          className="divide-y divide-border-subtle/50"
        >
          <AnimatePresence initial={false}>
            {attrEntries.map(([key, val], i) => {
              const change = attrDiff[key] ?? 'same'
              const isChanged = change === 'changed' || change === 'new'

              return (
                <motion.div
                  key={key}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  exit="exit"
                  className={`flex items-start gap-2 px-3 py-1.5 text-xs font-mono
                    ${isChanged ? 'bg-amber-500/8' : ''}`}
                  animate={
                    isChanged && currentEvent === 'line'
                      ? {
                          opacity: 1,
                          x: 0,
                          boxShadow: [
                            '0 0 0 0 rgba(245,158,11,0)',
                            '0 0 0 3px rgba(245,158,11,0.25)',
                            '0 0 0 0 rgba(245,158,11,0)',
                          ],
                        }
                      : 'visible'
                  }
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-text-secondary shrink-0 w-16 truncate">
                    {key}
                  </span>
                  <span className="text-text-secondary shrink-0">:</span>
                  <div className="flex-1 min-w-0">
                    {depth < MAX_DEPTH ? (
                      <SmartValueRenderer
                        name={key}
                        value={val}
                        prevValue={prevInstance?.attrs[key]}
                        depth={depth + 1}
                      />
                    ) : (
                      <span className="text-text-secondary truncate block">
                        {typeof val === 'object' && val !== null && '_kind' in val
                          ? (val as { _kind: string })._kind
                          : String(val)}
                      </span>
                    )}
                  </div>
                  {change === 'new' && (
                    <span className="text-[9px] text-green-400 shrink-0">new</span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}

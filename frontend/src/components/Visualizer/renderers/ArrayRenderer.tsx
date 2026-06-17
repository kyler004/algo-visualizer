import { motion, LayoutGroup } from 'framer-motion'
import { unwrapList } from '../../../utils/valueUtils'
import { computeBarOffsets } from '../../../utils/arrayDiff'

interface Props {
  name: string
  value: unknown
  prevValue?: unknown
}

const MAX_ITEMS = 20
const CHART_HEIGHT = 72

export default function ArrayRenderer({ value, prevValue }: Props) {
  const items = unwrapList(value).slice(0, MAX_ITEMS)
  const prevItems = unwrapList(prevValue)
  const totalLength = unwrapList(value).length

  const allNumbers = items.every((v): v is number => typeof v === 'number')

  if (allNumbers && items.length > 1) {
    return (
      <BarChart
        items={items as number[]}
        prevItems={prevItems as number[] | undefined}
        totalLength={totalLength}
      />
    )
  }

  return (
    <BoxView
      items={items}
      prevItems={prevItems}
      totalLength={totalLength}
    />
  )
}

interface BarChartProps {
  items: number[]
  prevItems?: number[]
  totalLength: number
}

function BarChart({ items, prevItems, totalLength }: BarChartProps) {
  const maxVal = Math.max(...items, 1)
  const offsets = computeBarOffsets(prevItems, items)

  return (
    <div className="mt-2 w-full">
      <div
        className="flex items-end gap-0.5 w-full"
        style={{ height: CHART_HEIGHT }}
      >
        {items.map((val, i) => {
          const barHeight = Math.max((val / maxVal) * CHART_HEIGHT, 3)
          const changed = val !== prevItems?.[i]
          const offset = offsets[i]

          return (
            <motion.div
              key={i}
              className={`flex-1 rounded-t-sm flex items-start justify-center pt-0.5
                ${changed ? 'bg-amber-400/90' : 'bg-accent-blue/70'}
                ${offset.swapped ? 'ring-1 ring-white/40' : ''}`}
              initial={{ height: 0, x: offset.x }}
              animate={{ height: barHeight, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              title={`[${i}] = ${val}`}
            >
              {items.length <= 10 && (
                <span className="text-[9px] text-white/75 font-mono leading-none select-none">
                  {val}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {items.length <= 14 && (
        <div className="flex gap-0.5 mt-1">
          {items.map((_, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[9px] text-text-secondary font-mono select-none"
            >
              {i}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <span className="text-[10px] text-text-secondary font-mono">len={totalLength}</span>
        {totalLength > MAX_ITEMS && (
          <span className="text-[10px] text-text-secondary">+{totalLength - MAX_ITEMS} hidden</span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-amber-400/80">
          <span className="w-2 h-2 rounded-sm bg-amber-400/90 inline-block" /> changed
        </span>
        <span className="flex items-center gap-1 text-[10px] text-accent-blue/80">
          <span className="w-2 h-2 rounded-sm bg-accent-blue/70 inline-block" /> unchanged
        </span>
      </div>
    </div>
  )
}

interface BoxViewProps {
  items: unknown[]
  prevItems: unknown[]
  totalLength: number
}

function BoxView({ items, prevItems, totalLength }: BoxViewProps) {
  return (
    <div className="mt-1.5">
      <LayoutGroup>
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => {
            const changed = JSON.stringify(item) !== JSON.stringify(prevItems?.[i])
            return (
              <motion.div
                key={i}
                layout
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`min-w-9 h-8 px-2 flex items-center justify-center
                    border rounded font-mono text-xs transition-colors
                    ${changed
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-border-subtle bg-bg-primary text-text-primary'}`}
                >
                  {typeof item === 'string' ? `"${item}"` : JSON.stringify(item)}
                </div>
                <span className="text-[9px] text-text-secondary mt-0.5 font-mono select-none">
                  {i}
                </span>
              </motion.div>
            )
          })}

          {totalLength > MAX_ITEMS && (
            <div className="flex flex-col items-center">
              <div className="min-w-9 h-8 px-2 flex items-center justify-center
                border border-dashed border-border-subtle rounded text-text-secondary text-xs">
                +{totalLength - MAX_ITEMS}
              </div>
            </div>
          )}
        </div>
      </LayoutGroup>
      <span className="text-[10px] text-text-secondary font-mono mt-1 block">
        len={totalLength}
      </span>
    </div>
  )
}

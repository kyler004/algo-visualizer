import { motion } from 'framer-motion'

interface Props {
    name:      string
    value:     unknown[]
    prevValue?: unknown[]
}

const MAX_ITEMS    = 20
const CHART_HEIGHT = 72 // px — fixed height for the bar chart

export default function ArrayRenderer({ value, prevValue }: Props) {
    const items = value.slice(0, MAX_ITEMS)

    // Type predicate: tells TypeScript that if this returns true,
    // every element in `items` is definitely a number
    const allNumbers = items.every((v): v is number => typeof v === 'number')

    if (allNumbers && items.length > 1) {
        return (
            <BarChart
                items={items}
                prevItems={prevValue as number[] | undefined}
                totalLength={value.length}
            />
        )
    }

    return (
        <BoxView
            items={items}
            prevItems={prevValue}
            totalLength={value.length}
        />
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bar Chart — rendered for purely numeric arrays (e.g. sorting algorithms)
// ─────────────────────────────────────────────────────────────────────────────

interface BarChartProps {
    items:       number[]
    prevItems?:  number[]
    totalLength: number
}

function BarChart({ items, prevItems, totalLength }: BarChartProps) {
    const maxVal = Math.max(...items, 1) // avoid division by zero

    return (
        <div className="mt-2 w-full">

            {/* The bars */}
            <div
                className="flex items-end gap-0.5 w-full"
                style={{ height: CHART_HEIGHT }}
            >
                {items.map((val, i) => {
                    const barHeight = Math.max((val / maxVal) * CHART_HEIGHT, 3)
                    const changed   = val !== prevItems?.[i]

                    return (
                        <motion.div
                            key={i}
                            className={`flex-1 rounded-t-sm flex items-start justify-center pt-0.5
                ${changed ? 'bg-amber-400/90' : 'bg-accent-blue/70'}`}
                            animate={{ height: barHeight }}
                            initial={{ height: 0 }}
                            // Spring physics make this feel organic, not robotic
                            transition={{ type: 'spring', stiffness: 260, damping: 22, duration: 0.3 }}
                            title={`[${i}] = ${val}`}
                        >
                            {/* Only show value label if there's enough room */}
                            {items.length <= 10 && (
                                <span className="text-[9px] text-white/75 font-mono leading-none select-none">
                  {val}
                </span>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Index labels below bars */}
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

            {/* Metadata row */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Box View — rendered for mixed / string / nested arrays
// ─────────────────────────────────────────────────────────────────────────────

interface BoxViewProps {
    items:       unknown[]
    prevItems?:  unknown[]
    totalLength: number
}

function BoxView({ items, prevItems, totalLength }: BoxViewProps) {
    return (
        <div className="mt-1.5">
            <div className="flex flex-wrap gap-1">
                {items.map((item, i) => {
                    const changed = JSON.stringify(item) !== JSON.stringify(prevItems?.[i])
                    return (
                        <motion.div
                            key={i}
                            layout
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`min-w-9 h-8 px-2 flex items-center justify-center
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
            <span className="text-[10px] text-text-secondary font-mono mt-1 block">
        len={totalLength}
      </span>
        </div>
    )
}
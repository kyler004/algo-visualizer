import { motion } from 'framer-motion'

type PrimitiveValue = string | number | boolean | null | undefined

interface Props {
  value: PrimitiveValue
  changed?: boolean
  isRepr?: boolean
}

const TYPE_COLOR: Record<string, string> = {
  number: 'text-yellow-400',
  string: 'text-amber-400',
  boolean: 'text-blue-400',
  null: 'text-gray-500',
  undefined: 'text-gray-500',
}

export default function PrimitiveRenderer({ value, changed, isRepr }: Props) {
  const type = value === null ? 'null' : typeof value
  const display = typeof value === 'string' ? `"${value}"` : String(value)

  return (
    <motion.span
      className={`font-mono text-sm inline-block
        ${isRepr ? 'text-text-secondary italic' : (TYPE_COLOR[type] ?? 'text-text-primary')}
        ${changed ? 'bg-amber-500/15 rounded px-1 py-0.5' : ''}`}
      animate={changed ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {display}
    </motion.span>
  )
}

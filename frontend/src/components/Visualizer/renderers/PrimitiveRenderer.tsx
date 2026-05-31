type PrimitiveValue = string | number | boolean | null | undefined

interface Props {
    value: PrimitiveValue
    changed?: boolean
}

// Each type gets its own colour so values are scannable at a glance
const TYPE_COLOR: Record<string, string> = {
    number:    'text-yellow-400',
    string:    'text-amber-400',
    boolean:   'text-blue-400',
    null:      'text-gray-500',
    undefined: 'text-gray-500',
}

export default function PrimitiveRenderer({ value, changed }: Props) {
    const type    = value === null ? 'null' : typeof value
    const display = typeof value === 'string' ? `"${value}"` : String(value)

    return (
        <span className={`font-mono text-sm ${TYPE_COLOR[type] ?? 'text-text-primary'}
      ${changed ? 'bg-amber-500/15 rounded px-1 py-0.5' : ''}`}>
      {display}
    </span>
    )
}
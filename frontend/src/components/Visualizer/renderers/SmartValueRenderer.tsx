import ArrayRenderer     from './ArrayRenderer'
import ObjectRenderer    from './ObjectRenderer'
import PrimitiveRenderer from './PrimitiveRenderer'

interface Props {
    name:       string
    value:      unknown
    prevValue?: unknown
}

type Category = 'array' | 'object' | 'primitive'

// Pure function: no side effects, always returns the same output for the same input
function categorize(value: unknown): Category {
    if (Array.isArray(value))                          return 'array'
    if (value !== null && typeof value === 'object')   return 'object'
    return 'primitive'
}

export default function SmartValueRenderer({ name, value, prevValue }: Props) {
    const changed  = JSON.stringify(value) !== JSON.stringify(prevValue)
    const category = categorize(value)

    switch (category) {
        case 'array':
            return (
                <ArrayRenderer
                    name={name}
                    value={value as unknown[]}
                    prevValue={prevValue as unknown[] | undefined}
                />
            )
        case 'object':
            return (
                <ObjectRenderer
                    value={value as Record<string, unknown>}
                    prevValue={prevValue as Record<string, unknown> | undefined}
                />
            )
        default:
            return (
                <PrimitiveRenderer
                    value={value as string | number | boolean | null}
                    changed={changed}
                />
            )
    }
}
import ArrayRenderer from './ArrayRenderer'
import ObjectRenderer from './ObjectRenderer'
import PrimitiveRenderer from './PrimitiveRenderer'
import InstanceRenderer from './InstanceRenderer'
import {
  isInstanceValue,
  isRefValue,
  isListValue,
  isDictValue,
  isReprValue,
  isPrimitiveValue,
  valuesEqual,
} from '../../../utils/valueUtils'
import type { SerializedValue } from '../../../types/value'

interface Props {
  name: string
  value: unknown
  prevValue?: unknown
  depth?: number
}

type Category = 'array' | 'object' | 'instance' | 'primitive' | 'repr'

function categorize(value: unknown): Category {
  if (isInstanceValue(value) || isRefValue(value)) return 'instance'
  if (isListValue(value) || Array.isArray(value)) return 'array'
  if (isDictValue(value)) return 'object'
  if (typeof value === 'object' && value !== null && !isReprValue(value)) return 'object'
  if (isReprValue(value)) return 'repr'
  return 'primitive'
}

export default function SmartValueRenderer({ name, value, prevValue, depth = 0 }: Props) {
  const changed = !valuesEqual(value, prevValue)
  const category = categorize(value)

  switch (category) {
    case 'array':
      return (
        <ArrayRenderer
          name={name}
          value={value}
          prevValue={prevValue}
        />
      )
    case 'object':
      return (
        <ObjectRenderer
          value={value}
          prevValue={prevValue}
          depth={depth}
        />
      )
    case 'instance':
      return (
        <InstanceRenderer
          value={value as SerializedValue}
          prevValue={prevValue as SerializedValue | undefined}
          name={name}
          depth={depth}
        />
      )
    case 'repr':
      return (
        <PrimitiveRenderer
          value={(value as { value: string }).value}
          changed={changed}
          isRepr
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

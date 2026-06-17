import type {
  SerializedValue,
  KindedValue,
  InstanceValue,
  RefValue,
  CollectedInstance,
  ReferenceEdge,
  REFERENCE_FIELDS,
} from '../types/value'

export function isKindedValue(v: unknown): v is KindedValue {
  return (
    typeof v === 'object' &&
    v !== null &&
    '_kind' in v &&
    typeof (v as KindedValue)._kind === 'string'
  )
}

export function isInstanceValue(v: unknown): v is InstanceValue {
  return isKindedValue(v) && v._kind === 'instance'
}

export function isRefValue(v: unknown): v is RefValue {
  return isKindedValue(v) && v._kind === 'ref'
}

export function isListValue(v: unknown): v is { _kind: 'list'; items: SerializedValue[] } {
  return isKindedValue(v) && v._kind === 'list'
}

export function isDictValue(v: unknown): v is { _kind: 'dict'; entries: Record<string, SerializedValue> } {
  return isKindedValue(v) && v._kind === 'dict'
}

export function isReprValue(v: unknown): v is { _kind: 'repr'; value: string } {
  return isKindedValue(v) && v._kind === 'repr'
}

export function isPrimitiveValue(v: unknown): v is number | string | boolean | null {
  return v === null || ['number', 'string', 'boolean'].includes(typeof v)
}

export function unwrapList(v: unknown): unknown[] {
  if (isListValue(v)) return v.items
  if (Array.isArray(v)) return v
  return []
}

export function unwrapDict(v: unknown): Record<string, unknown> {
  if (isDictValue(v)) return v.entries
  if (typeof v === 'object' && v !== null && !isKindedValue(v)) {
    return v as Record<string, unknown>
  }
  return {}
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  return JSON.stringify(a) === JSON.stringify(b)
}

export function diffAttrs(
  current: Record<string, SerializedValue>,
  prev?: Record<string, SerializedValue>,
): Record<string, 'new' | 'changed' | 'removed' | 'same'> {
  const result: Record<string, 'new' | 'changed' | 'removed' | 'same'> = {}
  const prevKeys = new Set(Object.keys(prev ?? {}))
  const currKeys = new Set(Object.keys(current))

  for (const key of currKeys) {
    if (!prevKeys.has(key)) {
      result[key] = 'new'
    } else if (!valuesEqual(current[key], prev![key])) {
      result[key] = 'changed'
    } else {
      result[key] = 'same'
    }
  }

  for (const key of prevKeys) {
    if (!currKeys.has(key)) {
      result[key] = 'removed'
    }
  }

  return result
}

export function getTypeLabel(v: unknown): string {
  if (isInstanceValue(v) || isRefValue(v)) return 'instance'
  if (isListValue(v) || Array.isArray(v)) return 'list'
  if (isDictValue(v)) return 'dict'
  if (isReprValue(v)) return 'repr'
  if (v === null) return 'null'
  if (typeof v === 'object') return 'dict'
  return typeof v
}

function collectFromValue(
  v: SerializedValue,
  seen: Set<string>,
  variableName?: string,
): CollectedInstance[] {
  const results: CollectedInstance[] = []

  if (isInstanceValue(v)) {
    if (!seen.has(v.id)) {
      seen.add(v.id)
      results.push({
        id: v.id,
        class: v.class,
        attrs: v.attrs,
        variableName,
        isRef: false,
      })
      for (const attr of Object.values(v.attrs)) {
        results.push(...collectFromValue(attr, seen))
      }
    }
  } else if (isRefValue(v)) {
    if (!seen.has(v.id)) {
      seen.add(v.id)
      results.push({
        id: v.id,
        class: v.class,
        attrs: {},
        variableName,
        isRef: true,
      })
    }
  } else if (isListValue(v)) {
    for (const item of v.items) {
      results.push(...collectFromValue(item, seen))
    }
  } else if (isDictValue(v)) {
    for (const val of Object.values(v.entries)) {
      results.push(...collectFromValue(val, seen))
    }
  }

  return results
}

export function collectInstances(
  variables: Record<string, unknown>,
): CollectedInstance[] {
  const seen = new Set<string>()
  const results: CollectedInstance[] = []

  for (const [name, value] of Object.entries(variables)) {
    results.push(...collectFromValue(value as SerializedValue, seen, name))
  }

  return results
}

export function detectReferenceFields(
  attrs: Record<string, SerializedValue>,
): ReferenceEdge[] {
  const edges: ReferenceEdge[] = []
  const refFields = REFERENCE_FIELDS as readonly string[]

  for (const [field, val] of Object.entries(attrs)) {
    if (!refFields.includes(field)) continue

    let targetId: string | null = null
    if (isInstanceValue(val) || isRefValue(val)) {
      targetId = val.id
    }

    edges.push({
      sourceId: '',
      targetId,
      field,
      label: field,
    })
  }

  return edges
}

export function hasStructureFields(variables: Record<string, unknown>): boolean {
  const instances = collectInstances(variables)
  const refFields = REFERENCE_FIELDS as readonly string[]

  return instances.some((inst) =>
    Object.keys(inst.attrs).some((k) => refFields.includes(k)),
  )
}

export function getInstanceLabel(v: InstanceValue | RefValue): string {
  if (isRefValue(v)) return `${v.class} @ ${v.id}`
  const valAttr = v.attrs.val ?? v.attrs.value ?? v.attrs.data
  if (valAttr !== undefined && isPrimitiveValue(valAttr)) {
    return `${v.class}(${String(valAttr)})`
  }
  return v.class
}

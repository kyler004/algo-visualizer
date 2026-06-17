export type PrimitiveValue = number | string | boolean | null

export interface ListValue {
  _kind: 'list'
  items: SerializedValue[]
}

export interface DictValue {
  _kind: 'dict'
  entries: Record<string, SerializedValue>
}

export interface SetValue {
  _kind: 'set'
  items: SerializedValue[]
}

export interface InstanceValue {
  _kind: 'instance'
  class: string
  id: string
  attrs: Record<string, SerializedValue>
}

export interface RefValue {
  _kind: 'ref'
  id: string
  class: string
}

export interface ReprValue {
  _kind: 'repr'
  value: string
}

export type KindedValue =
  | ListValue
  | DictValue
  | SetValue
  | InstanceValue
  | RefValue
  | ReprValue

export type SerializedValue = PrimitiveValue | KindedValue

export const REFERENCE_FIELDS = [
  'left',
  'right',
  'next',
  'prev',
  'parent',
  'child',
  'head',
  'tail',
] as const

export type ReferenceField = (typeof REFERENCE_FIELDS)[number]

export interface CollectedInstance {
  id: string
  class: string
  attrs: Record<string, SerializedValue>
  variableName?: string
  isRef: boolean
}

export interface ReferenceEdge {
  sourceId: string
  targetId: string | null
  field: string
  label: string
}

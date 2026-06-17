import { useMemo } from 'react'
import { motion } from 'framer-motion'
import useExecutionStore from '../../store/executionStore'
import {
  collectInstances,
  isInstanceValue,
  isRefValue,
  isPrimitiveValue,
} from '../../utils/valueUtils'
import { REFERENCE_FIELDS } from '../../types/value'
import type { SerializedValue } from '../../types/value'

const NODE_W = 80
const NODE_H = 36
const H_GAP = 24
const V_GAP = 56

interface TreeNode {
  id: string
  label: string
  x: number
  y: number
  children: TreeNode[]
}

function getRefTargetId(val: SerializedValue): string | null {
  if (isInstanceValue(val) || isRefValue(val)) return val.id
  return null
}

function getLabel(attrs: Record<string, SerializedValue>, cls: string): string {
  const v = attrs.val ?? attrs.value
  if (v !== undefined && isPrimitiveValue(v)) return `${cls}(${v})`
  return cls
}

function buildTree(
  instanceId: string,
  instances: Map<string, { class: string; attrs: Record<string, SerializedValue> }>,
  refFields: readonly string[],
  seen: Set<string>,
  depth: number,
): TreeNode | null {
  if (seen.has(instanceId)) return null
  seen.add(instanceId)

  const inst = instances.get(instanceId)
  if (!inst) return null

  const children: TreeNode[] = []
  for (const field of refFields) {
    const val = inst.attrs[field]
    if (val === undefined || val === null) continue
    const targetId = getRefTargetId(val)
    if (targetId) {
      const child = buildTree(targetId, instances, refFields, new Set(seen), depth + 1)
      if (child) children.push(child)
    }
  }

  return {
    id: instanceId,
    label: getLabel(inst.attrs, inst.class),
    x: 0,
    y: depth * V_GAP,
    children,
  }
}

function layoutTree(node: TreeNode, x = 0): { tree: TreeNode; width: number } {
  if (node.children.length === 0) {
    return { tree: { ...node, x }, width: NODE_W }
  }

  let offset = x
  const laidChildren: TreeNode[] = []
  let totalWidth = 0

  for (const child of node.children) {
    const { tree: laid, width } = layoutTree(child, offset)
    laidChildren.push(laid)
    offset += width + H_GAP
    totalWidth += width + H_GAP
  }
  totalWidth -= H_GAP

  const centerX = x + totalWidth / 2 - NODE_W / 2

  return {
    tree: { ...node, x: centerX, children: laidChildren },
    width: Math.max(NODE_W, totalWidth),
  }
}

function flattenTree(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(flattenTree)]
}

function collectEdges(node: TreeNode): { x1: number; y1: number; x2: number; y2: number }[] {
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (const child of node.children) {
    edges.push({
      x1: node.x + NODE_W / 2,
      y1: node.y + NODE_H,
      x2: child.x + NODE_W / 2,
      y2: child.y,
    })
    edges.push(...collectEdges(child))
  }
  return edges
}

export default function StructureGraphPanel() {
  const { steps, currentStepIndex, setActiveInstanceId } = useExecutionStore()
  const currentStep = steps[currentStepIndex]
  const graph = useMemo(() => {
    const variables = currentStep?.variables ?? {}
    const collected = collectInstances(variables)
    const instanceMap = new Map(
      collected.filter((i) => !i.isRef).map((i) => [i.id, { class: i.class, attrs: i.attrs }]),
    )

    const roots = collected.filter((i) => i.variableName && !i.isRef)
    if (roots.length === 0) return null

    const root = roots[0]
    const rawTree = buildTree(root.id, instanceMap, REFERENCE_FIELDS, new Set(), 0)
    if (!rawTree) return null

    const { tree } = layoutTree(rawTree)
    const nodes = flattenTree(tree)
    const edges = collectEdges(tree)
    const svgW = Math.max(...nodes.map((n) => n.x + NODE_W), 200) + 40
    const svgH = Math.max(...nodes.map((n) => n.y + NODE_H), 100) + 40

    return { nodes, edges, svgW, svgH }
  }, [currentStep])

  if (!currentStep) {
    return (
      <div className="bg-bg-panel p-4">
        <p className="text-text-secondary text-sm">Run code to see structure</p>
      </div>
    )
  }

  if (!graph) {
    return (
      <div className="bg-bg-panel p-4">
        <p className="text-text-secondary text-sm">
          No tree/linked structure detected. Use instances with left, right, next, or prev fields.
        </p>
      </div>
    )
  }

  const { nodes, edges, svgW, svgH } = graph

  return (
    <div className="bg-bg-panel p-4 overflow-auto">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
        Structure
      </h3>
      <svg
        width={svgW}
        height={svgH}
        className="mx-auto"
        style={{ minWidth: svgW }}
      >
        {edges.map((e, i) => (
          <motion.line
            key={i}
            x1={e.x1 + 20}
            y1={e.y1 + 16}
            x2={e.x2 + 20}
            y2={e.y2 + 16}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-edge/50"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          />
        ))}

        {nodes.map((node) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveInstanceId(node.id)}
          >
            <rect
              x={node.x + 20}
              y={node.y + 16}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              className="fill-instance/15 stroke-instance/40"
              strokeWidth={1}
            />
            <text
              x={node.x + 20 + NODE_W / 2}
              y={node.y + 16 + NODE_H / 2 + 4}
              textAnchor="middle"
              className="fill-instance text-[10px] font-mono"
              style={{ fontSize: 10 }}
            >
              {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

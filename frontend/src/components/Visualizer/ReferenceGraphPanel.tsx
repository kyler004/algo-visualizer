import { useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useExecutionStore from '../../store/executionStore'
import {
  collectInstances,
  isInstanceValue,
  isRefValue,
  isPrimitiveValue,
} from '../../utils/valueUtils'
import { REFERENCE_FIELDS } from '../../types/value'
import type { SerializedValue } from '../../types/value'

function getLabel(attrs: Record<string, SerializedValue>, cls: string): string {
  const v = attrs.val ?? attrs.value
  if (v !== undefined && isPrimitiveValue(v)) return `${cls}(${v})`
  return cls
}

function buildFlowData(variables: Record<string, unknown>): {
  nodes: Node[]
  edges: Edge[]
} {
  const instances = collectInstances(variables)
  const nodes: Node[] = []
  const edges: Edge[] = []
  const refFields = REFERENCE_FIELDS as readonly string[]

  instances.forEach((inst, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const label = inst.isRef
      ? `${inst.class} @ ${inst.id}`
      : getLabel(inst.attrs, inst.class)

    nodes.push({
      id: inst.id,
      position: { x: col * 200, y: row * 120 },
      data: {
        label: (
          <div className="text-xs font-mono">
            <div className="font-semibold text-purple-300">{inst.class}</div>
            <div className="text-text-secondary">{label}</div>
            {inst.variableName && (
              <div className="text-[10px] text-accent-blue mt-0.5">{inst.variableName}</div>
            )}
          </div>
        ),
      },
      style: {
        background: inst.isRef ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.15)',
        border: inst.isRef
          ? '1px dashed rgba(168,85,247,0.4)'
          : '1px solid rgba(168,85,247,0.35)',
        borderRadius: 8,
        padding: 8,
        minWidth: 120,
        color: '#e2e8f0',
      },
    })

    if (!inst.isRef) {
      for (const field of refFields) {
        const val = inst.attrs[field]
        if (val === undefined) continue
        let targetId: string | null = null
        if (isInstanceValue(val) || isRefValue(val)) targetId = val.id

        edges.push({
          id: `${inst.id}-${field}-${targetId ?? 'null'}`,
          source: inst.id,
          target: targetId ?? `${inst.id}-null-${field}`,
          label: field,
          animated: targetId !== null,
          style: { stroke: 'rgba(168,85,247,0.5)' },
          labelStyle: { fill: '#94a3b8', fontSize: 10 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(168,85,247,0.5)' },
        })

        if (!targetId) {
          nodes.push({
            id: `${inst.id}-null-${field}`,
            position: { x: col * 200 + 100, y: row * 120 + 60 },
            data: { label: <span className="text-xs text-text-secondary font-mono">null</span> },
            style: {
              background: 'rgba(100,100,100,0.1)',
              border: '1px dashed rgba(100,100,100,0.3)',
              borderRadius: 6,
              padding: 4,
              fontSize: 10,
              color: '#94a3b8',
            },
          })
        }
      }
    }
  })

  return { nodes, edges }
}

export default function ReferenceGraphPanel() {
  const { steps, currentStepIndex } = useExecutionStore()
  const currentStep = steps[currentStepIndex]
  const variables = currentStep?.variables ?? {}

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowData(variables),
    [variables],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  if (!currentStep) {
    return (
      <div className="bg-bg-panel p-4 h-full">
        <p className="text-text-secondary text-sm">Run code to see object graph</p>
      </div>
    )
  }

  if (initialNodes.length === 0) {
    return (
      <div className="bg-bg-panel p-4 h-full">
        <p className="text-text-secondary text-sm">
          No class instances in scope. Create objects to see the reference graph.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-bg-panel h-full min-h-[300px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background gap={16} color="rgba(255,255,255,0.04)" />
        <Controls />
        <MiniMap
          nodeColor="rgba(168,85,247,0.4)"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  )
}

import { useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useExecutionStore from '../../store/executionStore'
import useThemeStore from '../../store/themeStore'
import { getTheme } from '../../themes/definitions'
import {
  collectInstances,
  isInstanceValue,
  isRefValue,
  isPrimitiveValue,
} from '../../utils/valueUtils'
import { layoutGraphNodes } from '../../utils/graphLayout'
import { REFERENCE_FIELDS } from '../../types/value'
import type { SerializedValue } from '../../types/value'
import type { ThemeDefinition } from '../../themes/definitions'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLabel(attrs: Record<string, SerializedValue>, cls: string): string {
  const v = attrs.val ?? attrs.value
  if (v !== undefined && isPrimitiveValue(v)) return `${cls}(${v})`
  return cls
}

function buildFlowData(
  variables: Record<string, unknown>,
  theme: ThemeDefinition,
): { nodes: Node[]; edges: Edge[] } {
  const { colors: c } = theme
  const instances = collectInstances(variables)
  const nodes: Node[] = []
  const edges: Edge[] = []
  const refFields = REFERENCE_FIELDS as readonly string[]

  instances.forEach((inst) => {
    const label = inst.isRef
      ? `${inst.class} @ ${inst.id}`
      : getLabel(inst.attrs, inst.class)

    nodes.push({
      id: inst.id,
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div className="text-xs font-mono">
            <div className="font-semibold text-instance">{inst.class}</div>
            <div className="text-text-secondary">{label}</div>
            {inst.variableName && (
              <div className="text-[10px] text-accent-blue mt-0.5">{inst.variableName}</div>
            )}
          </div>
        ),
      },
      style: {
        background: inst.isRef
          ? hexToRgba(c.instance, 0.08)
          : hexToRgba(c.instance, 0.15),
        border: inst.isRef
          ? `1px dashed ${hexToRgba(c.instance, 0.4)}`
          : `1px solid ${hexToRgba(c.instance, 0.35)}`,
        borderRadius: 8,
        padding: 8,
        minWidth: 120,
        color: c.textPrimary,
      },
    })

    if (!inst.isRef) {
      for (const field of refFields) {
        const val = inst.attrs[field]
        if (val === undefined) continue
        let targetId: string | null = null
        if (isInstanceValue(val) || isRefValue(val)) targetId = val.id

        const edgeColor = hexToRgba(c.edge, 0.5)

        edges.push({
          id: `${inst.id}-${field}-${targetId ?? 'null'}`,
          source: inst.id,
          target: targetId ?? `${inst.id}-null-${field}`,
          label: field,
          animated: targetId !== null,
          style: { stroke: edgeColor },
          labelStyle: { fill: c.textSecondary, fontSize: 10 },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        })

        if (!targetId) {
          nodes.push({
            id: `${inst.id}-null-${field}`,
            position: { x: 0, y: 0 },
            data: {
              label: <span className="text-xs text-text-secondary font-mono">null</span>,
            },
            style: {
              background: hexToRgba(c.borderSubtle, 0.3),
              border: `1px dashed ${hexToRgba(c.textSecondary, 0.4)}`,
              borderRadius: 6,
              padding: 4,
              fontSize: 10,
              color: c.textSecondary,
            },
          })
        }
      }
    }
  })

  return { nodes, edges }
}

function ReferenceGraphFlow({
  initialNodes,
  initialEdges,
  theme,
}: {
  initialNodes: Node[]
  initialEdges: Edge[]
  theme: ThemeDefinition
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { fitView } = useReactFlow()

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 250 })
    })
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView])

  const gridColor =
    theme.category === 'light'
      ? 'rgba(0, 0, 0, 0.06)'
      : 'rgba(255, 255, 255, 0.04)'

  const maskColor =
    theme.category === 'light'
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(0, 0, 0, 0.6)'

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      proOptions={{ hideAttribution: true }}
      colorMode={theme.category}
    >
      <Background gap={16} color={gridColor} />
      <Controls />
      <MiniMap
        nodeColor={hexToRgba(theme.colors.instance, 0.4)}
        maskColor={maskColor}
      />
    </ReactFlow>
  )
}

export default function ReferenceGraphPanel() {
  const { steps, currentStepIndex } = useExecutionStore()
  const themeId = useThemeStore((s) => s.themeId)
  const theme = getTheme(themeId)
  const currentStep = steps[currentStepIndex]

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const variables = currentStep?.variables ?? {}
    const { nodes, edges } = buildFlowData(variables, theme)
    return { nodes: layoutGraphNodes(nodes, edges), edges }
  }, [currentStep, theme])

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
      <ReactFlowProvider>
        <ReferenceGraphFlow
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          theme={theme}
        />
      </ReactFlowProvider>
    </div>
  )
}

import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'

const INSTANCE_NODE_W = 150
const INSTANCE_NODE_H = 76
const NULL_NODE_W = 56
const NULL_NODE_H = 32

function getNodeSize(node: Node): { width: number; height: number } {
  if (node.id.includes('-null-')) {
    return { width: NULL_NODE_W, height: NULL_NODE_H }
  }
  return { width: INSTANCE_NODE_W, height: INSTANCE_NODE_H }
}

/** Apply a hierarchical dagre layout so reference graphs read top-to-bottom. */
export function layoutGraphNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: 52,
    ranksep: 80,
    marginx: 32,
    marginy: 32,
  })

  for (const node of nodes) {
    const { width, height } = getNodeSize(node)
    g.setNode(node.id, { width, height })
  }

  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const { width, height } = getNodeSize(node)
    const pos = g.node(node.id)
    if (!pos) return node

    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    }
  })
}

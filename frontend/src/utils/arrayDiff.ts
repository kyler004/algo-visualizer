export interface BarOffset {
  x: number
  swapped: boolean
}

/**
 * Compute per-index horizontal offsets for FLIP-style bar swap animation.
 * Detects indices whose values changed vs the previous step and assigns
 * a brief translateX nudge toward the direction of the swap partner.
 */
export function computeBarOffsets(
  prev: number[] | undefined,
  curr: number[],
  barWidth = 24,
): BarOffset[] {
  if (!prev || prev.length !== curr.length) {
    return curr.map(() => ({ x: 0, swapped: false }))
  }

  const changedIndices: number[] = []
  for (let i = 0; i < curr.length; i++) {
    if (prev[i] !== curr[i]) changedIndices.push(i)
  }

  if (changedIndices.length !== 2) {
    return curr.map((_, i) => ({
      x: 0,
      swapped: changedIndices.includes(i),
    }))
  }

  const [a, b] = changedIndices
  const offsets = curr.map(() => ({ x: 0, swapped: false }))
  offsets[a] = { x: (b - a) * barWidth, swapped: true }
  offsets[b] = { x: (a - b) * barWidth, swapped: true }
  return offsets
}

export function getSwapIndices(
  prev: number[] | undefined,
  curr: number[],
): number[] {
  if (!prev || prev.length !== curr.length) return []
  const changed: number[] = []
  for (let i = 0; i < curr.length; i++) {
    if (prev[i] !== curr[i]) changed.push(i)
  }
  return changed.length === 2 ? changed : []
}

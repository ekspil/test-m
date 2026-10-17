import type { Position } from '../core/core.types'

export function distance(first: Position, second: Position): number {
  const dx = first[0] - second[0]
  const dy = first[1] - second[1]
  return Math.sqrt(dx * dx + dy * dy)
}

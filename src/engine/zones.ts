import type { Point } from "./geometry"

/**
 * Shapes used for both launch zones (where an action can be aimed)
 * and target zones (cells affected around the aimed cell).
 *
 * - point:    only the center
 * - square:   full square of radius `max`
 * - diamond:  Manhattan circle ("normal" zone)
 * - line:     orthogonal cross "+"
 * - diagonal: diagonal cross "×"
 */
export type ZoneShape = "point" | "square" | "diamond" | "line" | "diagonal"

export interface ZoneSpec {
  shape: ZoneShape
  /** Minimal distance from the center (0 includes the center itself). */
  min?: number
  /** Maximal distance from the center. */
  max: number
}

export const POINT: ZoneSpec = { shape: "point", max: 0 }

/** Cells of a zone around `center` (not clipped to the board). */
export function zoneCells(center: Point, spec: ZoneSpec): Point[] {
  const min = spec.min ?? 0
  const max = spec.shape === "point" ? 0 : spec.max
  const cells: Point[] = []

  for (let dy = -max; dy <= max; dy++) {
    for (let dx = -max; dx <= max; dx++) {
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      let distance: number

      switch (spec.shape) {
        case "point":
          distance = 0
          break
        case "square":
          distance = Math.max(ax, ay)
          break
        case "diamond":
          distance = ax + ay
          break
        case "line":
          if (ax !== 0 && ay !== 0) continue
          distance = ax + ay
          break
        case "diagonal":
          if (ax !== ay) continue
          distance = ax
          break
      }

      if (distance >= min && distance <= max) {
        cells.push({ x: center.x + dx, y: center.y + dy })
      }
    }
  }

  return cells
}

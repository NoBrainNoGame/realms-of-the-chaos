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

/**
 * Distance of `p` from `center` measured in the zone's shape, or null when
 * `p` is not on the shape at all (e.g. off the cross of a line zone).
 */
export function zoneDistance(
  center: Point,
  p: Point,
  shape: ZoneShape,
): number | null {
  const ax = Math.abs(p.x - center.x)
  const ay = Math.abs(p.y - center.y)
  switch (shape) {
    case "point":
      return ax === 0 && ay === 0 ? 0 : null
    case "square":
      return Math.max(ax, ay)
    case "diamond":
      return ax + ay
    case "line":
      return ax !== 0 && ay !== 0 ? null : ax + ay
    case "diagonal":
      return ax !== ay ? null : ax
  }
}

/** Whether `p` belongs to the zone (same cells as zoneCells). */
export function inZone(center: Point, p: Point, spec: ZoneSpec): boolean {
  const distance = zoneDistance(center, p, spec.shape)
  if (distance === null) return false
  const max = spec.shape === "point" ? 0 : spec.max
  return distance >= (spec.min ?? 0) && distance <= max
}

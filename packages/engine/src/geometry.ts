/**
 * Pure grid geometry helpers. Coordinates are (x = column, y = row).
 */

export interface Point {
  readonly x: number
  readonly y: number
}

export const keyOf = (p: Point) => `${p.x},${p.y}`

export const equals = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const add = (a: Point, b: Point): Point => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

export const manhattan = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** The four orthogonal directions (no diagonal movement). */
export const DIRECTIONS: readonly Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/**
 * Unit step from `from` towards `to` along the dominant axis
 * (used for push-backs). Returns null when both points are equal.
 */
export function dominantDirection(from: Point, to: Point): Point | null {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return null
  if (Math.abs(dx) >= Math.abs(dy)) return { x: Math.sign(dx), y: 0 }
  return { x: 0, y: Math.sign(dy) }
}

/**
 * Cells crossed by a straight segment between two cell centers
 * (supercover line, both ends included). Used for line of sight.
 */
export function lineBetween(a: Point, b: Point): Point[] {
  const cells: Point[] = [a]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const nx = Math.abs(dx)
  const ny = Math.abs(dy)
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)
  let x = a.x
  let y = a.y
  let ix = 0
  let iy = 0

  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx
    if (decision === 0) {
      // exactly through a corner: step diagonally
      x += sx
      y += sy
      ix++
      iy++
    } else if (decision < 0) {
      x += sx
      ix++
    } else {
      y += sy
      iy++
    }
    cells.push({ x, y })
  }

  return cells
}

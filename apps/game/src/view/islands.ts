import type { Graphics } from "pixi.js"

import {
  type Camera,
  camera,
  cellNoise,
  depthAlong,
  diamond,
  ELEVATION_HEIGHT,
  frontCorner,
  GROUND_TOP,
  ISO,
  STRATA,
  shade,
  toScreen,
  verticalScale,
  visibleFaces,
} from "./theme"

/**
 * Floating islands are built like the board: terrain columns, and under
 * them a fake stack of terrain blocks narrowing into an irregular inverted
 * pyramid (same strata, same blocks, same theme as the terrain).
 */

/** Height of one block of the underside. */
export const BLOCK_HEIGHT = ELEVATION_HEIGHT

/**
 * Number of blocks stacked under each cell: deep in the middle, shallow on
 * the edges, with noise so the pyramid is irregular. Deterministic.
 */
export function undersideDepths(
  width: number,
  height: number,
  seed: number,
  step = 3,
): number[][] {
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  // rings around the middle (0 in the middle, `rings` on the edge)
  const rings = Math.ceil(Math.max(cx, cy))
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      // (normalized by each half-axis: on a rectangle the whole perimeter
      // is on the last ring, so the front edge stays level instead of
      // climbing step by step towards the ends of the long side)
      const nx = cx > 0 ? (Math.abs(x - cx) / cx) * rings : 0
      const ny = cy > 0 ? (Math.abs(y - cy) / cy) * rings : 0
      const ring = Math.ceil(Math.max(nx, ny) - 1e-9)
      // each ring towards the edge loses about `step` blocks: a stepped
      // pyramid that narrows down to the middle column, its tip
      const base = (rings - ring) * step + 1
      // irregular: a block more or less here and there
      // (but not on the outer ring: a level rim, no ragged front edge)
      const noise =
        ring === rings ? 0 : Math.floor(cellNoise({ x, y }, seed, 11) * 3) - 1
      return Math.max(1, base + (ring === 0 ? 1 : noise))
    }),
  )
}

/**
 * Strata color of a block of the underside: the deeper, the darker (and
 * the more "deep rock" strata).
 */
export function blockColor(depth: number) {
  const index = Math.min(4, 1 + Math.floor(depth * 0.5))
  return shade(STRATA[index], 1.12)
}

/**
 * The visible faces of one block (screen-space origin = the cell's top
 * center, `y0` = top of the block, in pixels of the classic view).
 */
export function drawBlock(
  g: Graphics,
  origin: { x: number; y: number },
  y0: number,
  depth: number,
  c: Readonly<Camera> = camera,
  /** Faces against a neighbor block are hidden: not drawn. */
  hidden?: (dir: { x: number; y: number }) => boolean,
) {
  const faces = visibleFaces(c).filter((f) => !hidden?.(f.dir))
  if (faces.length === 0) return
  const color = blockColor(depth)
  const v = verticalScale(c)
  const { x, y } = origin
  const top = y + y0 * v
  const bottom = y + (y0 + BLOCK_HEIGHT) * v
  for (const { a, b, light } of faces) {
    g.poly([
      x + a.x,
      top + a.y,
      x + b.x,
      top + b.y,
      x + b.x,
      bottom + b.y,
      x + a.x,
      bottom + a.y,
    ]).fill(shade(color, light < 1 ? 0.9 : 1))
  }
  // block seams (the top edges of the faces) and the front edge, in one
  // stroke: a stroke is costly to build
  for (const { a, b } of faces) {
    g.moveTo(x + a.x, top + a.y).lineTo(x + b.x, top + b.y)
  }
  const f = frontCorner(c)
  g.moveTo(x + f.x, top + f.y)
    .lineTo(x + f.x, bottom + f.y)
    .stroke({ width: 1, color: 0x000000, alpha: 0.12 })
}

/**
 * A whole floating island of `size` × `size` cells, centered on (0, 0): a
 * grassy top with a little relief, columns, and the block pyramid under
 * it. Used for the distant islands of the backdrop, seen by the same
 * camera as the board.
 */
export function drawFloatingIsland(
  g: Graphics,
  size: number,
  seed: number,
  c: Readonly<Camera> = ISO,
) {
  const depths = undersideDepths(size, size, seed, size + 2)
  const center = toScreen({ x: (size - 1) / 2, y: (size - 1) / 2 }, 0, c)
  const cells: { x: number; y: number; elevation: number; skip: boolean }[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const corner = (x === 0 || x === size - 1) && (y === 0 || y === size - 1)
      cells.push({
        x,
        y,
        elevation: cellNoise({ x, y }, seed, 3) > 0.7 ? 1 : 0,
        // irregular outline: some corners are missing
        skip: corner && cellNoise({ x, y }, seed, 5) > 0.45,
      })
    }
  }
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size ? cells[y * size + x] : null
  // painter's order: back to front
  const order = [...cells].sort((a, b) => depthAlong(a, c) - depthAlong(b, c))
  for (const cell of order) {
    if (cell.skip) continue
    const p = toScreen(cell, 0, c)
    const origin = { x: p.x - center.x, y: p.y - center.y }
    const top = -cell.elevation * ELEVATION_HEIGHT
    // the column: from its top to the floor of the island
    // (the faces against a neighbor's block are hidden)
    const next = (d: { x: number; y: number }) => {
      const n = at(cell.x + d.x, cell.y + d.y)
      return n && !n.skip ? n : null
    }
    for (let level = cell.elevation; level > -1; level--) {
      drawBlock(g, origin, -level * ELEVATION_HEIGHT, 0, c, (d) => {
        const n = next(d)
        return !!n && n.elevation >= level
      })
    }
    // the inverted pyramid under it
    const depth = depths[cell.y][cell.x]
    for (let k = 0; k < depth; k++) {
      drawBlock(
        g,
        origin,
        ELEVATION_HEIGHT + k * BLOCK_HEIGHT,
        k + 1,
        c,
        (d) => {
          const n = next(d)
          return !!n && depths[n.y][n.x] > k
        },
      )
    }
    const grass = shade(
      GROUND_TOP[cell.elevation] ?? GROUND_TOP[0],
      0.92 + cellNoise(cell, seed, 7) * 0.14,
    )
    g.poly(
      diamond(0, c).map((v, i) =>
        i % 2 === 0 ? v + origin.x : v + origin.y + top,
      ),
    ).fill(grass)
  }
}

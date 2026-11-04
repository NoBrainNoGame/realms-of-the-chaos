import type { Graphics } from "pixi.js"

import {
  cellNoise,
  diamond,
  ELEVATION_HEIGHT,
  GROUND_TOP,
  STRATA,
  shade,
  TILE_HEIGHT,
  TILE_WIDTH,
  toScreen,
} from "./theme"

/**
 * Floating islands are built like the board: terrain columns, and under
 * them a fake stack of terrain blocks narrowing into an irregular inverted
 * pyramid (same strata, same blocks, same theme as the terrain).
 */

const W = TILE_WIDTH / 2
const H = TILE_HEIGHT / 2
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
  maxDepth = 12,
): number[][] {
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const reach = Math.max(cx, cy, 1)
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const distance = Math.max(Math.abs(x - cx), Math.abs(y - cy)) / reach
      // each ring towards the edge loses a few blocks: visible steps
      const base = (1 - distance) ** 0.7 * maxDepth
      const factor = 0.7 + cellNoise({ x, y }, seed, 11) * 0.5
      const edge = distance >= 1 ? Math.round(cellNoise({ x, y }, seed, 13)) : 0
      return Math.max(0, Math.round(base * factor) + edge)
    }),
  )
}

/**
 * Strata color of a block of the underside: the deeper, the darker (and
 * the more "deep rock" strata).
 */
export function blockColor(depth: number) {
  const index = Math.min(STRATA.length - 1, 2 + Math.floor(depth * 0.8))
  return shade(STRATA[index], 1 - Math.min(0.35, depth * 0.04))
}

/**
 * The two visible faces of one block (screen-space origin = the cell's
 * top corner position, `y0` = top of the block).
 */
export function drawBlock(
  g: Graphics,
  origin: { x: number; y: number },
  y0: number,
  depth: number,
) {
  const color = blockColor(depth)
  const { x, y } = origin
  const y1 = y0 + BLOCK_HEIGHT
  g.poly([x - W, y + y0, x, y + y0 + H, x, y + y1 + H, x - W, y + y1]).fill(
    shade(color, 0.72),
  )
  g.poly([x + W, y + y0, x, y + y0 + H, x, y + y1 + H, x + W, y + y1]).fill(
    color,
  )
  // block seams: the top edges of the faces and the front edge
  g.moveTo(x - W, y + y0)
    .lineTo(x, y + y0 + H)
    .lineTo(x + W, y + y0)
    .stroke({ width: 1, color: 0x000000, alpha: 0.28 })
  g.moveTo(x, y + y0 + H)
    .lineTo(x, y + y1 + H)
    .stroke({ width: 1, color: 0x000000, alpha: 0.2 })
}

/**
 * A whole floating island of `size` × `size` cells, centered on (0, 0): a
 * grassy top with a little relief, columns, and the block pyramid under
 * it. Used for the distant islands of the backdrop.
 */
export function drawFloatingIsland(g: Graphics, size: number, seed: number) {
  const depths = undersideDepths(size, size, seed, size + 2)
  const center = toScreen({ x: (size - 1) / 2, y: (size - 1) / 2 })
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
  // painter's order: back to front
  cells.sort((a, b) => a.x + a.y - (b.x + b.y))
  for (const cell of cells) {
    if (cell.skip) continue
    const p = toScreen(cell)
    const origin = { x: p.x - center.x, y: p.y - center.y }
    const top = -cell.elevation * ELEVATION_HEIGHT
    // the column: from its top to the floor of the island
    for (let level = cell.elevation; level > -1; level--) {
      drawBlock(g, origin, -level * ELEVATION_HEIGHT, 0)
    }
    // the inverted pyramid under it
    const depth = depths[cell.y][cell.x]
    for (let k = 0; k < depth; k++) {
      drawBlock(g, origin, ELEVATION_HEIGHT + k * BLOCK_HEIGHT, k + 1)
    }
    const grass = shade(
      GROUND_TOP[cell.elevation] ?? GROUND_TOP[0],
      0.92 + cellNoise(cell, seed, 7) * 0.14,
    )
    g.poly(
      diamond().map((v, i) =>
        i % 2 === 0 ? v + origin.x : v + origin.y + top,
      ),
    ).fill(grass)
  }
}

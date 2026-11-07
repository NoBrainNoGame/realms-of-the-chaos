/**
 * The baked distant islets (assets/islets/islet-N.png): which seed and
 * size each one is drawn with, and the canvas they share. Used by the
 * baking script and by the Backdrop (to pick one by size).
 */

/** Size of the cells (a square island of N × N) of each baked islet. */
export const ISLET_CELLS = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5]

/** Seed of each baked islet (a different outline and relief each). */
export const ISLET_SEEDS = [11, 23, 37, 41, 53, 67, 79, 83, 97, 109]

/** Logical size of the canvas of every islet, and where its centre is. */
export const ISLET_CANVAS = { width: 336, height: 392, ax: 0.5, ay: 0.25 }

/** Pixels per logical pixel in the PNGs (2: sharp on dense screens). */
export const ISLET_RESOLUTION = 2

/**
 * The pitches (°) the islets are baked at, with the canvas of each (the
 * Backdrop picks the nearest one, then stretches it to the exact pitch).
 * The first, 30, is the classic view: files `islet-N.png`; the others are
 * `islet-N-pPITCH.png`.
 */
export const ISLET_VIEWS = [
  { pitch: 30, ...ISLET_CANVAS },
  { pitch: 50, width: 336, height: 380, ax: 0.5, ay: 150 / 380 },
  { pitch: 72, width: 336, height: 350, ax: 0.5, ay: 180 / 350 },
]

/** File name of the islet `index` baked at a view's pitch. */
export function isletFile(index: number, pitch: number) {
  return pitch === ISLET_VIEWS[0].pitch
    ? `islet-${index}.png`
    : `islet-${index}-p${pitch}.png`
}

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

import { MIN_ELEVATION, type Point } from "@realms/engine"

export const FONT = "Pixelify Sans, monospace"

export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32
/** Pixel height of one elevation level. */
export const ELEVATION_HEIGHT = 16
/** Extra thickness under the lowest level (the island crust). */
export const TILE_DEPTH = 12
/** Level of the bottom of every terrain column. */
export const FLOOR_LEVEL = MIN_ELEVATION
/** Size of the characters on the board (puppet scale). */
export const PUPPET_SCALE = 0.74

export const COLORS = {
  background: 0x15121f,
  panel: 0x231d33,
  panelBorder: 0x4c3f6b,
  text: 0xf1ecff,
  muted: 0x9d92b8,
  hp: 0xe03131,
  hpBack: 0x3a1420,
  /** Max hit points lost for good (erosion). */
  eroded: 0x6b6470,
  heal: 0x51cf66,
  energy: 0xb197fc,
  reachable: 0x4dabf7,
  path: 0xffe066,
  launch: 0xff922b,
  target: 0xff6b6b,
  area: 0xf03e3e,
  divine: 0xb197fc,
  combo: 0x63e6be,
}

/**
 * Meaning colors, used everywhere the game explains an effect (moves,
 * spells, tooltips): one color, one kind of thing.
 */
export const MEANING = {
  damage: 0xff6b6b,
  heal: 0x69db7c,
  move: 0x4dabf7,
  poison: 0xcc5de8,
  time: 0xffd43b,
  shield: 0x99e9f2,
  elan: 0xb197fc,
}

export const TEAM_COLORS = [0x4dabf7, 0xff6b6b, 0x69db7c, 0xda77f2]

/** Top color of dry ground by elevation (-3 … 3): dirt pits to sunny hills. */
export const GROUND_TOP: Record<number, number> = {
  [-3]: 0x5a4a34,
  [-2]: 0x6b5a3e,
  [-1]: 0x7d6a48,
  0: 0x5e9a3c,
  1: 0x6eab45,
  2: 0x84bb52,
  3: 0x9ccb62,
}

/** Rock strata of the column sides, from the surface down. */
export const STRATA = [
  0x7a5c3e, 0x6a4f36, 0x5c4532, 0x4f3c2e, 0x45352a, 0x3b2e26, 0x332821,
]

export const WATER = {
  surface: 0x3f9be0,
  deep: 0x123a6b,
  foam: 0xe7f5ff,
  bed: 0x8a7a55,
}

/** Screen position of the top-center of a cell standing at `elevation`. */
export function toScreen(p: Point, elevation = 0): { x: number; y: number } {
  return {
    x: (p.x - p.y) * (TILE_WIDTH / 2),
    y: (p.x + p.y) * (TILE_HEIGHT / 2) - elevation * ELEVATION_HEIGHT,
  }
}

/** Diamond polygon of a tile top, relative to its center. */
export function diamond(inset = 0): number[] {
  const w = TILE_WIDTH / 2 - inset
  const h = TILE_HEIGHT / 2 - inset / 2
  return [0, -h, w, 0, 0, h, -w, 0]
}

/** Blend two colors (t = 0 → a, t = 1 → b). */
export function mix(a: number, b: number, t: number) {
  const channel = (shift: number) =>
    Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t)
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

/** Multiply a color's brightness. */
export function shade(color: number, factor: number) {
  const channel = (shift: number) =>
    Math.min(255, Math.round(((color >> shift) & 0xff) * factor))
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

/** Deterministic pseudo-random number in [0, 1) for a cell (decorations). */
export function cellNoise(p: Point, seed: number, salt = 0) {
  let h =
    (p.x * 374761393 +
      p.y * 668265263 +
      seed * 2246822519 +
      salt * 3266489917) |
    0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

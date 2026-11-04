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
  /** Damage dealt, attack stats. */
  damage: 0xff6b6b,
  /** Healing, hit points. */
  heal: 0x69db7c,
  /** Moves: cells walked, pushes, jumps. */
  move: 0x4dabf7,
  poison: 0xcc5de8,
  /** Time: costs, waits, turns, cooldowns, speed, slow and haste. */
  time: 0xffd43b,
  /** Shields, defense stats. */
  shield: 0x99e9f2,
  /** The Ghom's energy. */
  elan: 0xb197fc,
  /** Reach: range, line of sight, area. */
  range: 0xffa94d,
  /** Luck and critical hits. */
  luck: 0xf783ac,
  /** Water: swimming, aquatic traits. */
  water: 0x66d9e8,
}

export type Meaning = keyof typeof MEANING

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

// ─── Camera ────────────────────────────────────────────────────────────────

/** Pitch of the classic isometric view (tiles twice as wide as tall). */
export const ISO_PITCH = 30
/** Steepest pitch: almost a top-down view of the board. */
export const MAX_PITCH = 72
/** Free horizontal rotation around the current quarter turn, in degrees. */
export const MAX_YAW = 15

/**
 * How the board is looked at: a quarter turn (0–3, 90° each), a small
 * horizontal rotation on top of it (degrees) and the pitch (degrees,
 * 30 = classic isometric, up to almost top-down).
 */
export interface Camera {
  quarter: number
  yaw: number
  pitch: number
}

/** The classic isometric view (distant islands always use it). */
export const ISO: Readonly<Camera> = { quarter: 0, yaw: 0, pitch: ISO_PITCH }

/** The board's camera, shared by every drawing of the fight. */
export const camera: Camera = { ...ISO }

export function resetCamera() {
  Object.assign(camera, ISO)
}

/** Grid size of a cell on screen (its diagonal is TILE_WIDTH at 45°). */
const CELL = TILE_WIDTH / Math.SQRT2
const RAD = Math.PI / 180
/** Rounded, without -0 (exact values for the classic view). */
const clean = (v: number) => Math.round(v * 1e6) / 1e6 + 0

function basis(c: Readonly<Camera>) {
  const t = (45 + 90 * c.quarter + c.yaw) * RAD
  const sin = Math.sin(t)
  const cos = Math.cos(t)
  return {
    sin,
    cos,
    squash: Math.sin(c.pitch * RAD),
    level:
      (ELEVATION_HEIGHT * Math.cos(c.pitch * RAD)) / Math.cos(ISO_PITCH * RAD),
  }
}

/** Screen offset of a vector of the grid (on the ground plane). */
export function project(
  gx: number,
  gy: number,
  c: Readonly<Camera> = camera,
): { x: number; y: number } {
  const { sin, cos, squash } = basis(c)
  return {
    x: clean((gx * cos - gy * sin) * CELL),
    y: clean((gx * sin + gy * cos) * CELL * squash),
  }
}

/** Pixel height of one elevation level (shorter as the view tilts down). */
export function levelHeight(c: Readonly<Camera> = camera) {
  return clean(basis(c).level)
}

/**
 * Distance of a grid point towards the viewer (painter's order): x + y
 * in the classic view.
 */
export function depthAlong(p: Point, c: Readonly<Camera> = camera) {
  const { sin, cos } = basis(c)
  return clean((p.x * sin + p.y * cos) * Math.SQRT2)
}

/** Screen position of the top-center of a cell standing at `elevation`. */
export function toScreen(
  p: Point,
  elevation = 0,
  c: Readonly<Camera> = camera,
): { x: number; y: number } {
  const o = project(p.x, p.y, c)
  return { x: o.x, y: clean(o.y - elevation * levelHeight(c)) }
}

/** Tile top corners, relative to its center (scaled by `k`). */
export function tileCorners(k = 1, c: Readonly<Camera> = camera) {
  return [
    project(-0.5 * k, -0.5 * k, c),
    project(0.5 * k, -0.5 * k, c),
    project(0.5 * k, 0.5 * k, c),
    project(-0.5 * k, 0.5 * k, c),
  ]
}

/** Tile top polygon, relative to its center; an inset shrinks it. */
export function diamond(inset = 0, c: Readonly<Camera> = camera): number[] {
  const k = 1 - inset / (TILE_WIDTH / 2)
  return tileCorners(k, c).flatMap((p) => [p.x, p.y])
}

/** One side face of a column, seen by the camera. */
export interface Face {
  /** Grid direction the face looks to. */
  dir: Point
  /** Its top edge, from its left end to its right end on screen. */
  a: { x: number; y: number }
  b: { x: number; y: number }
  /** Light from the top-left: the face turned left is darker. */
  light: number
}

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]

/** Vertical pixels of the classic view, scaled for the camera's pitch. */
export function verticalScale(c: Readonly<Camera> = camera) {
  return levelHeight(c) / ELEVATION_HEIGHT
}

/** Top edge of the side of a tile looking along `dir` (grid offsets). */
export function edgeOf(dir: Point, c: Readonly<Camera> = camera, k = 1) {
  return [
    project(((dir.x - dir.y) / 2) * k, ((dir.y + dir.x) / 2) * k, c),
    project(((dir.x + dir.y) / 2) * k, ((dir.y - dir.x) / 2) * k, c),
  ]
}

/** The tile corner nearest to the viewer (lowest on screen). */
export function frontCorner(c: Readonly<Camera> = camera) {
  return tileCorners(1, c).reduce((a, b) => (b.y > a.y ? b : a))
}

/** Side faces of a column turned towards the viewer (usually two). */
export function visibleFaces(c: Readonly<Camera> = camera): Face[] {
  const faces: Face[] = []
  for (const dir of DIRS) {
    const toward = project(dir.x, dir.y, c)
    if (toward.y <= 0) continue
    const p = project(dir.x / 2 - dir.y / 2, dir.y / 2 + dir.x / 2, c)
    const q = project(dir.x / 2 + dir.y / 2, dir.y / 2 - dir.x / 2, c)
    const [a, b] = p.x <= q.x ? [p, q] : [q, p]
    faces.push({ dir, a, b, light: toward.x < 0 ? 0.78 : 1 })
  }
  return faces
}

/** Facings of the puppets, named after the classic view. */
type ScreenFacing = "SE" | "SW" | "NE" | "NW"
const FACING_DIR: Record<ScreenFacing, Point> = {
  SE: { x: 1, y: 0 },
  SW: { x: 0, y: 1 },
  NE: { x: 0, y: -1 },
  NW: { x: -1, y: 0 },
}

/**
 * How a fighter looking along a grid direction (named after the classic
 * view) is drawn with the camera turned.
 */
export function screenFacing<F extends ScreenFacing>(
  facing: F,
  c: Readonly<Camera> = camera,
): ScreenFacing {
  const d = FACING_DIR[facing]
  const v = project(d.x, d.y, c)
  if (v.y >= 0) return v.x >= 0 ? "SE" : "SW"
  return v.x >= 0 ? "NE" : "NW"
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

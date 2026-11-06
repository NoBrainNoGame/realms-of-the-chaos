import { add, DIRECTIONS, keyOf, lineBetween, type Point } from "./geometry"
import type { Rng } from "./random"

/**
 * - ground: normal cell, at its own elevation (hills, cliffs and dry pits)
 * - water:  a flooded hole. Shallow water (depth 1) can be waded through;
 *           deep water (depth 2+) needs to swim, at the surface (level 0).
 */
export type Terrain = "ground" | "water"

/**
 * How a character moves in water:
 * - walker:  wades in shallow water (slow), never enters deep water
 * - swimmer: also swims in deep water, slowly and tiringly
 * - aquatic: at home in any water, no penalty at all
 */
export type Locomotion = "walker" | "swimmer" | "aquatic"

export interface Cell extends Point {
  terrain: Terrain
  /** Height of the ground (or of the water bed), from -3 to 3. */
  elevation: number
}

export const MIN_ELEVATION = -3
export const MAX_ELEVATION = 3
/** Highest difference of level a walker can climb or jump down in one step. */
export const MAX_STEP = 1
/** Cheapest step (going down onto ground is quick, never free). */
export const MIN_STEP_COST = 0.5
/** Water surface level. */
export const WATER_LEVEL = 0

/** Water at least this deep (in levels) must be swum. */
export const DEEP_WATER = 2

export const MOVE_COST = {
  ground: 1,
  /** Wading through shallow water (walkers and swimmers). */
  wade: 2,
  /** Swimming in deep water (swimmers). */
  swim: 3,
  /** Aquatic characters move in water as on land. */
  aquatic: 1,
}

export interface PathNode {
  cost: number
  previous: string | null
  point: Point
}

/** Minimal binary heap keyed by a numeric priority. */
class MinHeap<T> {
  private _items: { priority: number; value: T }[] = []

  get size() {
    return this._items.length
  }

  push(value: T, priority: number) {
    const items = this._items
    items.push({ priority, value })
    let i = items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (items[parent].priority <= items[i].priority) break
      ;[items[parent], items[i]] = [items[i], items[parent]]
      i = parent
    }
  }

  pop(): T | undefined {
    const items = this._items
    if (items.length === 0) return undefined
    const top = items[0]
    const last = items.pop()!
    if (items.length > 0) {
      items[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let smallest = i
        if (l < items.length && items[l].priority < items[smallest].priority)
          smallest = l
        if (r < items.length && items[r].priority < items[smallest].priority)
          smallest = r
        if (smallest === i) break
        ;[items[smallest], items[i]] = [items[i], items[smallest]]
        i = smallest
      }
    }
    return top.value
  }
}

const ASCII: Record<string, { terrain: Terrain; elevation: number }> = {
  ".": { terrain: "ground", elevation: 0 },
  "1": { terrain: "ground", elevation: 1 },
  "^": { terrain: "ground", elevation: 1 },
  "2": { terrain: "ground", elevation: 2 },
  "3": { terrain: "ground", elevation: 3 },
  "#": { terrain: "ground", elevation: 3 },
  a: { terrain: "ground", elevation: -1 },
  b: { terrain: "ground", elevation: -2 },
  c: { terrain: "ground", elevation: -3 },
  "~": { terrain: "water", elevation: -1 },
  w: { terrain: "water", elevation: -2 },
  W: { terrain: "water", elevation: -3 },
}

export class Board {
  private readonly _cells: Cell[]

  constructor(
    public readonly width: number,
    public readonly height: number,
    cells?: Cell[],
  ) {
    this._cells =
      cells ??
      Array.from({ length: width * height }, (_, i) => ({
        x: i % width,
        y: Math.floor(i / width),
        terrain: "ground" as Terrain,
        elevation: 0,
      }))
  }

  /**
   * Build a board from rows of characters:
   * `.` level 0 · `1` `2` `3` (or `^` = 1, `#` = 3) hills ·
   * `a` `b` `c` dry pits (-1 to -3) · `~` `w` `W` water (depth 1 to 3).
   */
  static fromAscii(rows: string[]): Board {
    const cells: Cell[] = []
    rows.forEach((row, y) => {
      ;[...row].forEach((char, x) => {
        const def = ASCII[char]
        if (!def) throw new Error(`Unknown map character "${char}"`)
        cells.push({ x, y, ...def })
      })
    })
    return new Board(rows[0].length, rows.length, cells)
  }

  /** ASCII representation (inverse of {@link fromAscii}). */
  toAscii(): string[] {
    const rows: string[] = []
    for (let y = 0; y < this.height; y++) {
      let row = ""
      for (let x = 0; x < this.width; x++) {
        const { terrain, elevation } = this.get({ x, y })!
        if (terrain === "water")
          row += elevation === -1 ? "~" : elevation === -2 ? "w" : "W"
        else if (elevation > 0) row += String(elevation)
        else if (elevation < 0) row += "abc"[-elevation - 1]
        else row += "."
      }
      rows.push(row)
    }
    return rows
  }

  /**
   * Procedural arena: smooth hills and flooded holes (ponds and lakes), point-symmetric
   * so both sides are fair, with walkable spawn edges.
   */
  static generate(rng: Rng, width = 9, height = 9): Board {
    for (let attempt = 0; attempt < 120; attempt++) {
      const board = Board._randomRelief(rng, width, height)
      if (board._isPlayable()) return board
    }
    return new Board(width, height)
  }

  private static _randomRelief(rng: Rng, width: number, height: number) {
    const board = new Board(width, height)
    const mirror = (p: Point) => ({ x: width - 1 - p.x, y: height - 1 - p.y })

    // a few gaussian bumps (hills) and dips (holes), mirrored
    const bumps = Array.from({ length: rng.int(4, 7) }, () => ({
      x: rng.int(0, width - 1),
      y: rng.int(0, height - 1),
      radius: 0.9 + rng.next() * 1.6,
      amplitude: rng.pick([-3.4, -2.6, -1.8, 1.8, 2.6, 3.4]),
    }))

    const relief = (p: Point) => {
      let h = 0
      for (const b of bumps) {
        for (const c of [b, mirror(b)]) {
          const d2 = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
          h += b.amplitude * Math.exp(-d2 / (2 * b.radius ** 2))
        }
      }
      return h
    }

    // compute each symmetric pair once so both cells are exactly equal
    for (const cell of board._cells) {
      const m = mirror(cell)
      if (cell.y * width + cell.x > m.y * width + m.x) continue
      let elevation = Math.round(relief(cell))
      elevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, elevation))
      // spawn edges stay walkable
      if (cell.x === 0 || cell.x === width - 1)
        elevation = Math.max(0, Math.min(1, elevation))
      cell.elevation = elevation
      board.get(m)!.elevation = elevation
    }

    // every hole holds water: rain fills the basins of the island
    for (const cell of board._cells)
      if (cell.elevation < 0) cell.terrain = "water"

    return board
  }

  /** Enough relief, and both spawn edges belong to one big walkable region. */
  private _isPlayable() {
    const region = this.mainRegion()
    const left = this._cells.filter(
      (c) => c.x === 0 && region.has(keyOf(c)),
    ).length
    const right = this._cells.filter(
      (c) => c.x === this.width - 1 && region.has(keyOf(c)),
    ).length
    const high = this._cells.filter((c) => c.elevation >= 2).length
    const low = this._cells.filter((c) => c.elevation <= -1).length
    return (
      region.size >= this._cells.length * 0.75 &&
      left >= this.height - 2 &&
      right >= this.height - 2 &&
      high >= 4 &&
      low >= 4
    )
  }

  get cells(): readonly Cell[] {
    return this._cells
  }

  inBounds(p: Point) {
    return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height
  }

  get(p: Point): Cell | undefined {
    return this.inBounds(p) ? this._cells[p.y * this.width + p.x] : undefined
  }

  /** Level a character stands at: the ground, or the water surface. */
  standHeight(p: Point) {
    const cell = this.get(p)
    if (!cell) return 0
    return cell.terrain === "water" ? WATER_LEVEL : cell.elevation
  }

  /** Water deep enough to swim (depth 2 or more). */
  isDeepWater(p: Point) {
    const cell = this.get(p)
    return !!cell && cell.terrain === "water" && -cell.elevation >= DEEP_WATER
  }

  /** Whether a character with this locomotion can be on a cell at all. */
  canStand(p: Point, locomotion: Locomotion = "walker") {
    if (!this.inBounds(p)) return false
    return locomotion !== "walker" || !this.isDeepWater(p)
  }

  /** A character can go from `from` to the adjacent `to` (no cliff in between). */
  canStep(from: Point, to: Point, locomotion: Locomotion = "walker") {
    if (!this.canStand(to, locomotion)) return false
    return Math.abs(this.standHeight(to) - this.standHeight(from)) <= MAX_STEP
  }

  /**
   * Cost of a step: terrain cost for this locomotion, +1 per level climbed,
   * -1 per level gone down (never below MIN_STEP_COST).
   */
  stepCost(from: Point, to: Point, locomotion: Locomotion = "walker") {
    if (!this.inBounds(to)) return Infinity
    const rise = this.standHeight(to) - this.standHeight(from)
    return Math.max(MIN_STEP_COST, this.moveCost(to, locomotion) + rise)
  }

  /** Cost of entering a cell, ignoring climbing. */
  moveCost(p: Point, locomotion: Locomotion = "walker") {
    const cell = this.get(p)
    if (!cell || !this.canStand(p, locomotion)) return Infinity
    if (cell.terrain === "ground") return MOVE_COST.ground
    if (locomotion === "aquatic") return MOVE_COST.aquatic
    return this.isDeepWater(p) ? MOVE_COST.swim : MOVE_COST.wade
  }

  neighbors(p: Point): Point[] {
    return DIRECTIONS.map((d) => add(p, d)).filter((n) => this.inBounds(n))
  }

  /**
   * Line of sight between two cells, from eye level (stand height + 1).
   * Any cell in between rising above the sight line blocks it, so hills
   * hide what is behind them and high ground sees over low obstacles.
   */
  hasLineOfSight(a: Point, b: Point) {
    const line = lineBetween(a, b)
    const eyeA = this.standHeight(a) + 1
    const eyeB = this.standHeight(b) + 1
    for (let i = 1; i < line.length - 1; i++) {
      const t = i / (line.length - 1)
      const sight = eyeA + (eyeB - eyeA) * t
      if (this.standHeight(line[i]) > sight - 0.25) return false
    }
    return true
  }

  /**
   * Dijkstra from `from`, following climbable steps. `canEnter` filters
   * cells a walker may step on (e.g. not occupied by enemies).
   */
  explore(
    from: Point,
    canEnter: (p: Point) => boolean = () => true,
    maxCost = Infinity,
    locomotion: Locomotion = "walker",
  ): Map<string, PathNode> {
    const nodes = new Map<string, PathNode>()
    const heap = new MinHeap<Point>()
    nodes.set(keyOf(from), { cost: 0, previous: null, point: from })
    heap.push(from, 0)

    while (heap.size > 0) {
      const current = heap.pop()!
      const currentKey = keyOf(current)
      const currentNode = nodes.get(currentKey)!

      for (const next of this.neighbors(current)) {
        if (!this.canStep(current, next, locomotion) || !canEnter(next))
          continue
        const cost = currentNode.cost + this.stepCost(current, next, locomotion)
        if (cost > maxCost) continue
        const key = keyOf(next)
        const known = nodes.get(key)
        if (!known || cost < known.cost) {
          nodes.set(key, { cost, previous: currentKey, point: next })
          heap.push(next, cost)
        }
      }
    }

    return nodes
  }

  /** Shortest path (excluding `from`, including `to`) or null. */
  findPath(
    from: Point,
    to: Point,
    canEnter: (p: Point) => boolean = () => true,
    locomotion: Locomotion = "walker",
  ): Point[] | null {
    return Board.pathTo(this.explore(from, canEnter, Infinity, locomotion), to)
  }

  static pathTo(nodes: Map<string, PathNode>, to: Point): Point[] | null {
    let node = nodes.get(keyOf(to))
    if (!node) return null
    const path: Point[] = []
    while (node && node.previous !== null) {
      path.unshift(node.point)
      node = nodes.get(node.previous)
    }
    return path
  }

  /** Keys of the cells reachable from `p` (including `p`). */
  regionOf(p: Point, locomotion: Locomotion = "walker"): Set<string> {
    return new Set(this.explore(p, undefined, Infinity, locomotion).keys())
  }

  /**
   * Largest region for this locomotion; cells outside are unreachable
   * peaks, pits, or (for walkers) deep water.
   */
  mainRegion(locomotion: Locomotion = "walker"): Set<string> {
    let best = new Set<string>()
    const seen = new Set<string>()
    for (const cell of this._cells) {
      if (seen.has(keyOf(cell)) || !this.canStand(cell, locomotion)) continue
      const region = this.regionOf(cell, locomotion)
      for (const key of region) seen.add(key)
      if (region.size > best.size) best = region
    }
    return best
  }

  /** Every cell can reach every other one. */
  isConnected() {
    return this.mainRegion().size === this._cells.length
  }

  clone(): Board {
    return new Board(
      this.width,
      this.height,
      this._cells.map((c) => ({ ...c })),
    )
  }
}

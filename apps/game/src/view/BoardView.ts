import type * as booyah from "@ghom/booyah"
import {
  add,
  type Board,
  type Cell,
  keyOf,
  manhattan,
  type Point,
} from "@realms/engine"
import {
  AlphaFilter,
  Container,
  type FederatedPointerEvent,
  FillGradient,
  Graphics,
  Polygon,
  Sprite,
} from "pixi.js"
import { softCircle } from "./effects"
import { BLOCK_HEIGHT, drawBlock, undersideDepths } from "./islands"
import {
  cellNoise,
  depthAlong,
  diamond,
  ELEVATION_HEIGHT,
  edgeOf,
  FLOOR_LEVEL,
  frontCorner,
  GROUND_TOP,
  levelHeight,
  mix,
  project,
  STRATA,
  shade,
  TILE_DEPTH,
  TILE_WIDTH,
  tinted,
  toScreen,
  verticalScale,
  visibleFaces,
  WATER,
} from "./theme"
import ViewChip from "./ViewChip"

interface BoardViewEvents extends booyah.BaseCompositeEvents {
  cellOver: [cell: Point]
  cellOut: [cell: Point]
  cellDown: [cell: Point, button: number]
}

/** The walk arrow, in cells: its band, its head (width, back, tip). */
const TRAIL_WIDTH = 0.2
const HEAD_WIDTH = 0.26
const HEAD_BACK = 0.12
const HEAD_TIP = 0.34

export interface Highlight {
  cells: Point[]
  color: number
  alpha: number
  /** Inset of the diamond, smaller tiles read as "dots". */
  inset?: number
  /** Draw a crisp border around each cell. */
  outline?: boolean
  /**
   * The cells are a walk, in order: a thick line joins their centers
   * (each cell draws its halves of the segments to its neighbors).
   */
  trail?: boolean
  /** A trail's end: its arrowhead (default), or a round joint. */
  head?: boolean
}

/** Depth offsets inside a diagonal of the shared `entities` layer. */
export const DEPTH = {
  column: 1,
  fighter: 6,
}

/** Painter's order (x + y in the classic view), whatever the camera. */
export const depthOf = (p: Point, offset: number) => depthAlong(p) * 10 + offset

/** Vertical offset of a cell during a shockwave: sink, bounce, settle. */
export function waveOffset(amplitude: number, u: number) {
  if (u < 0 || u >= 1) return 0
  return amplitude * Math.exp(-3.5 * u) * Math.sin(2.5 * Math.PI * u)
}

/**
 * How far under the top of a neighbor's column a side stays drawn (px):
 * more than a shockwave moves a column, so no hole shows.
 */
const HIDDEN_MARGIN = 14
/** Depth of the island underside: behind every column and fighter. */
/** Fading tail of the runoff sheet under the lowest block. */
const FALL_TAIL = 40

export const UNDERSIDE_Z = -1e9

/** Bottom of every column, below the lowest level (classic view). */
export const COLUMN_BOTTOM = -FLOOR_LEVEL * ELEVATION_HEIGHT + TILE_DEPTH

/**
 * Tint of the water surface over a bed `depth` levels down: a fixed step
 * darker per level, always translucent so that the bed shows through.
 */
export function waterTint(depth: number) {
  const level = Math.max(0, Math.min(2, depth - 1))
  return {
    color: mix(WATER.surface, WATER.deep, level * 0.3),
    alpha: 0.55,
  }
}

/** Everything drawn for one cell. */
interface CellParts {
  /** Terrain column, depth-sorted with fighters. */
  column: Container
  /** Static drawing of the column (sides, top, decor). */
  ground: Graphics
  /** Highlight on the walkable surface. */
  overlay: Graphics
  /** Animated bits (water shimmer, crystal glows). */
  animated: Container[]
  /**
   * Decor standing on the top (grass, flowers, crystals…), drawn once:
   * facing the screen, it only moves when the camera does. Null until
   * drawn, and after a terrain change.
   */
  decor: DecorItem[] | null
  /** Vines hanging from each side (by side), drawn once too. */
  vines: Map<number, DecorItem[]>
  /** Water shimmer, drawn once. */
  shimmer: Graphics | null
  /** Drawn again at each redraw (waterfalls). */
  transient: Container[]
  /** The water of the cell (opaque: it is translucent as a group). */
  water: Container
  waterG: Graphics
  hit: Graphics
  /** Rest position of the column on screen. */
  y: number
}

/** A decor piece drawn around (0, 0), standing on a point of the top. */
interface DecorItem {
  /** Grid offset from the cell's middle (or along the side, for vines). */
  at: Point
  node: Container
  animated?: Container
}

/** A waterfall pouring from a water cell over the edge of the island. */
interface Cascade {
  g: Graphics
  /** Grid direction of the side the water runs down. */
  dir: Point
  /** Height of the fall along the column and the blocks under it. */
  length: number
}

interface Wave {
  start: number
  duration: number
  cells: { key: string; delay: number; amplitude: number }[]
}

/**
 * Isometric floating island. Every cell is a terrain column (ground, pit or
 * flooded hole) depth-sorted with the fighters, decorated with grass,
 * flowers, pebbles and chaos crystals. Invisible hit areas sit on top.
 */
const SIDES: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]

const lerp = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

export default class BoardView extends ViewChip<BoardViewEvents> {
  private _parts = new Map<string, CellParts>()
  private _hitLayer!: Container
  private _time = 0
  private _waves: Wave[] = []
  /** Blocks stacked under each cell (the inverted pyramid). */
  private _depths: number[][] = []
  /** Waterfalls pouring over the edges, by cell key. */
  private _cascades = new Map<string, Cascade[]>()
  private _offsets = new Map<string, number>()
  private _underside: Container | null = null
  /** One translucent group of water per row of cells (see _bandFor). */
  private _bands = new Map<number, Container>()
  /** The front walls of the lakes (one translucent group). */
  private _walls: Container | null = null

  constructor(
    private readonly _board: Board,
    private readonly _entities: Container,
    private readonly _top: Container,
    private readonly _seed = 0,
  ) {
    super()
  }

  protected _onActivate() {
    this._depths = undersideDepths(
      this._board.width,
      this._board.height,
      this._seed,
    )
    this._hitLayer = new Container()
    this._hitLayer.sortableChildren = true
    this._top.addChild(this._hitLayer)

    for (const cell of this._board.cells) {
      const p = { x: cell.x, y: cell.y }
      const column = new Container()
      column.eventMode = "none"
      const ground = new Graphics()
      const overlay = new Graphics()
      const water = new Container()
      const waterG = new Graphics()
      water.addChild(waterG)
      this._entities.addChild(column)

      const hit = new Graphics()
      hit.eventMode = "static"
      hit.on("pointerover", () => this.emit("cellOver", p))
      hit.on("pointerout", () => this.emit("cellOut", p))
      hit.on("pointerdown", (e: FederatedPointerEvent) =>
        this.emit("cellDown", p, e.button),
      )
      this._hitLayer.addChild(hit)

      this._parts.set(keyOf(cell), {
        column,
        ground,
        overlay,
        water,
        waterG,
        animated: [],
        decor: null,
        vines: new Map(),
        shimmer: null,
        transient: [],
        hit,
        y: 0,
      })
    }
    this.redraw()
  }

  /** Draws everything again, after the camera moved. */
  redraw() {
    this._underside?.destroy({ children: true })
    this._underside = this._drawUnderside()
    // in the depth-sorted layer of the columns, behind all of them (its own
    // container may sit above that layer: the blocks of the deep middle
    // would then be drawn over the front cells, which "climb")
    this._entities.sortableChildren = true
    this._underside.zIndex = UNDERSIDE_Z
    this._entities.addChild(this._underside)
    for (const cell of this._board.cells) this._drawCell(cell)
    for (const [key, band] of this._bands) {
      if (band.children.length > 0) continue
      band.destroy()
      this._bands.delete(key)
    }
    this._drawWalls()
  }

  /**
   * The water of the cells on one diagonal row: opaque shapes in a group
   * made translucent as a whole (overlaps never add up), sorted between the
   * columns of its row and the next so that a raised column in front still
   * covers it. Cells of one row only touch by their corners.
   */
  private _bandFor(cell: Point) {
    const key = Math.round(depthAlong(cell) * 1000)
    let band = this._bands.get(key)
    if (!band) {
      band = new Container()
      band.filters = [new AlphaFilter({ alpha: waterTint(1).alpha })]
      band.zIndex = depthOf(cell, DEPTH.column + 0.5)
      band.label = "aux"
      this._entities.addChild(band)
      this._bands.set(key, band)
    }
    return band
  }

  /** Water groups of the board (one per row of cells). */
  get waterGroups(): readonly Container[] {
    return [...this._bands.values()]
  }

  protected _onTick() {
    this._time += this._lastTickInfo.timeSinceLastTick
    let i = 0
    for (const parts of this._parts.values()) {
      for (const node of parts.animated) {
        node.alpha = 0.55 + 0.35 * Math.sin(this._time / 450 + i * 1.3)
      }
      i++
    }
    for (const list of this._cascades.values()) {
      for (const cascade of list) this._drawCascade(cascade)
    }
    this._updateWaves()
  }

  /**
   * Animated waterfall over the seamless wall: a few soft lighter bands
   * sliding down it, and droplets breaking off at its foot.
   */
  private _drawCascade(cascade: Cascade) {
    const { g, dir } = cascade
    const t = this._time / 1000
    const [pa, pb] = edgeOf(dir)
    g.clear()
    const reach =
      this._undersideBottom - g.y - Math.min(pa.y, pb.y) + FALL_TAIL * 0.5
    // a few soft streaks sliding straight down the sheet
    for (let d = 0; d < 3; d++) {
      const p = lerp(pa, pb, 0.2 + d * 0.3)
      const u = (t * 0.45 + d * 0.37) % 1
      const y0 = p.y + u * reach * 0.9
      g.moveTo(p.x, y0)
        .lineTo(p.x, y0 + 16)
        .stroke({ width: 1.5, color: 0xd6efff, alpha: 0.4 * (1 - u) })
    }
    // drops running down the sheet, inside its width
    for (let d = 0; d < 5; d++) {
      const u = (t / 2.4 + d / 5) % 1
      const p = lerp(pa, pb, 0.1 + ((d * 0.37 + 0.12) % 1) * 0.8)
      g.circle(p.x, p.y + u * reach, 1.9 - u * 0.5).fill({
        color: 0xc4e6ff,
        alpha: 0.9 * (1 - u) ** 0.7,
      })
    }
  }

  /** Lowest screen y of the underside blocks (past it the fall fades). */
  private _undersideBottom = 0

  /** Waterfalls of the island (one per water cell side on the edge). */
  get cascades(): readonly Cascade[] {
    return [...this._cascades.values()].flat()
  }

  protected _onTerminate() {
    for (const parts of this._parts.values()) {
      this._forgetDecor(parts)
      parts.column.destroy({ children: true })
    }
    this._hitLayer.destroy({ children: true })
    this._underside?.destroy({ children: true })
    this._walls?.destroy({ children: true })
    for (const band of this._bands.values()) band.destroy({ children: true })
    this._bands.clear()
    for (const parts of this._parts.values()) {
      parts.overlay.destroy()
    }
    this._parts.clear()
  }

  /** Screen position where a character stands on a cell. */
  cellTop(p: Point) {
    return toScreen(p, this._board.standHeight(p))
  }

  /** Redraw a cell after a terrain change (and its neighbors' shores). */
  refreshCell(p: Point) {
    for (const q of [p, ...this._board.neighbors(p)]) {
      const cell = this._board.get(q)
      if (!cell) continue
      // its decor may change (a pit, a shore…)
      this._forgetDecor(this._parts.get(keyOf(cell))!)
      this._drawCell(cell)
    }
    this._drawWalls()
  }

  /**
   * The front walls of the lakes and the waterfalls under them: opaque
   * shapes in one group of their own (translucent as a whole, sorted after
   * every column). The wall runs along the island edge down to the bottom
   * of the terrain column, then the fall goes on over the underside in
   * thin rows (lighter blue, fading out, narrowing at the ends of a run).
   */
  private _drawWalls() {
    this._walls?.destroy({ children: true })
    const root = new Container()
    root.label = "aux"
    const gf = new Container()
    root.addChild(gf)
    let z = 0
    const faceOf = (cell: Point) => {
      const base = toScreen(cell)
      return this._edgeFaces(cell).map((f) => ({
        ...f,
        p: { x: base.x + f.a.x, y: base.y + f.a.y },
        q: { x: base.x + f.b.x, y: base.y + f.b.y },
      }))
    }
    // every water face on the island edge, with its tint (depth of its cell)
    interface Run {
      dir: Point
      lead: Point
      tail: Point
      color: number
      depth: number
    }
    const runs: Run[] = []
    for (const cell of this._board.cells) {
      z = Math.max(z, depthOf(cell, DEPTH.fighter + 1))
      if (cell.terrain !== "water") continue
      const { color } = waterTint(-cell.elevation)
      for (const { p, q, light, dir } of faceOf(cell)) {
        runs.push({
          dir,
          lead: p.x <= q.x ? p : q,
          tail: p.x <= q.x ? q : p,
          color: shade(color, light < 1 ? 0.85 : 1),
          depth: -cell.elevation,
        })
      }
    }
    // contiguous faces of one side with the same tint make a single run
    const near = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < 1.5
    const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y
    runs.sort((a, b) => a.lead.x - b.lead.x)
    const merged: Run[] = []
    for (const r of runs) {
      let m = merged.find((o) => same(o.dir, r.dir) && near(o.tail, r.lead))
      if (m && m.color === r.color) {
        m.tail = r.tail
        continue
      }
      m = { ...r }
      merged.push(m)
    }
    for (const r of merged) {
      const { lead, tail, color: tone } = r
      // one straight sheet per run: from the water surface edge, over the
      // bed column, the island side and the underside, down to past the
      // lowest block, fading out over its last part
      const lighter = mix(tone, 0x4fb0ff, 0.55)
      const rgb = `${(lighter >> 16) & 255},${(lighter >> 8) & 255},${lighter & 255}`
      const bottom = this._undersideBottom + FALL_TAIL
      const top = Math.min(lead.y, tail.y)
      const solid = (this._undersideBottom - top) / (bottom - top)
      const grad = new FillGradient({
        type: "linear",
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        textureSpace: "local",
        colorStops: [
          { offset: 0, color: `rgba(${rgb},0.5)` },
          { offset: solid, color: `rgba(${rgb},0.42)` },
          { offset: 1, color: `rgba(${rgb},0)` },
        ],
      })
      const fg = new Graphics()
      fg.poly([
        lead.x - 0.4,
        lead.y,
        tail.x + 0.4,
        tail.y,
        tail.x + 0.4,
        bottom,
        lead.x - 0.4,
        bottom,
      ]).fill(grad)
      gf.addChild(fg)
    }
    root.zIndex = z
    this._entities.addChild(root)
    this._walls = root
  }

  setHighlights(highlights: Highlight[]) {
    for (const parts of this._parts.values()) parts.overlay.clear()
    for (const {
      cells,
      color,
      alpha,
      inset = 3,
      outline = false,
      trail = false,
      head = true,
    } of highlights) {
      if (trail) {
        this._drawTrail(cells, color, alpha, head)
        continue
      }
      for (const p of cells) {
        const parts = this._parts.get(keyOf(p))
        if (!parts) continue
        const points = diamond(inset)
        parts.overlay.poly(points).fill({ color, alpha })
        if (outline) {
          parts.overlay
            .poly(points)
            .stroke({ width: 2, color, alpha: Math.min(1, alpha * 2.5) })
        }
      }
    }
  }

  /**
   * The planned walk: a yellow arrow laid flat on the ground (the tiles'
   * slant), from the fighter to its destination, where its head points.
   * Each cell draws its part as a single shape (no overlap: a see-through
   * arrow stays even): a band to half-way to its neighbors, rounded at a
   * turn or an end, the head on the last cell, down the side of a step.
   */
  private _drawTrail(
    cells: Point[],
    color: number,
    alpha: number,
    head = true,
  ) {
    type V = { x: number; y: number }
    const w = TRAIL_WIDTH / 2
    const add = (...vs: V[]) =>
      vs.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 })
    const mul = (v: V, k: number) => ({ x: v.x * k, y: v.y * k })
    // left of a direction, on the grid
    const left = (d: V, k: number) => ({ x: -d.y * k, y: d.x * k })
    // a quarter (or half) turn around the centre, from a to b (radius w)
    const arc = (a: V, b: V, turns = 1) =>
      Array.from({ length: 6 * turns + 1 }, (_, k) => {
        const t = ((k / (6 * turns)) * Math.PI * turns) / 2
        return add(mul(a, Math.cos(t)), mul(b, Math.sin(t)))
      })
    // on the ground, in cells, projected
    const shape = (vs: V[]) =>
      vs.flatMap((v) => {
        const q = project(v.x, v.y)
        return [q.x, q.y]
      })
    cells.forEach((p, i) => {
      const parts = this._parts.get(keyOf(p))
      if (!parts) return
      const g = parts.overlay
      const fill = { color, alpha }
      // towards the linked neighbors (previous first)
      const links = [cells[i - 1], cells[i + 1]].filter(
        (q): q is Point => !!q && manhattan(p, q) === 1,
      )
      const dirs = links.map((q) => ({ x: q.x - p.x, y: q.y - p.y }))
      let outline: V[]
      if (dirs.length === 0) {
        outline = arc({ x: w, y: 0 }, { x: 0, y: w }, 4)
      } else if (dirs.length === 1) {
        const u = dirs[0]
        const half = mul(u, 0.5)
        const n = left(u, w)
        const end = mul(n, -1)
        if (head && links[0] === cells[i - 1] && !cells[i + 1]) {
          // the head, pointing the way the walk goes (away from u)
          const base = mul(u, HEAD_BACK)
          const nh = left(u, HEAD_WIDTH)
          outline = [
            add(half, n),
            add(base, n),
            add(base, nh),
            mul(u, -HEAD_TIP),
            add(base, mul(nh, -1)),
            add(base, end),
            add(half, end),
          ]
        } else {
          // a round end
          outline = [add(half, n), ...arc(n, mul(u, -w), 2), add(half, end)]
        }
      } else {
        const [ua, ub] = dirs
        const a = mul(ua, 0.5)
        const b = mul(ub, 0.5)
        // walking from a to b: the band's left and right sides
        const na = left(mul(ua, -1), w)
        const nb = left(ub, w)
        if (ua.x === -ub.x && ua.y === -ub.y) {
          outline = [
            add(a, na),
            add(b, na),
            add(b, mul(na, -1)),
            add(a, mul(na, -1)),
          ]
        } else {
          // a turn: a sharp inner corner, a round outer one
          const turnsLeft = -ua.x * ub.y - -ua.y * ub.x > 0
          const leftSide = turnsLeft ? [add(na, nb)] : arc(na, nb)
          const rightSide = turnsLeft
            ? arc(mul(nb, -1), mul(na, -1))
            : [add(mul(na, -1), mul(nb, -1))]
          outline = [
            add(a, na),
            ...leftSide,
            add(b, nb),
            add(b, mul(nb, -1)),
            ...rightSide,
            add(a, mul(na, -1)),
          ]
        }
      }
      g.poly(shape(outline)).fill(fill)
      // a step down to a lower neighbor in front: the higher cell draws
      // the drop along its side, so both halves meet (behind, the higher
      // column hides the lower half anyway)
      for (const [k, q] of links.entries()) {
        const u = dirs[k]
        if (project(u.x, u.y).y <= 0) continue
        const drop =
          (this._board.standHeight(p) - this._board.standHeight(q)) *
          levelHeight()
        if (drop <= 0) continue
        const [b1, b2] = [
          add(mul(u, 0.5), left(u, w)),
          add(mul(u, 0.5), left(u, -w)),
        ].map((v) => project(v.x, v.y))
        g.poly([
          b1.x,
          b1.y,
          b2.x,
          b2.y,
          b2.x,
          b2.y + drop,
          b1.x,
          b1.y + drop,
        ]).fill(fill)
      }
    })
  }

  /**
   * Shockwave: cells of the area sink then bounce back, one after the
   * other from the center, and the ring around the area shakes lightly.
   */
  shockwave(
    center: Point,
    cells: Point[],
    amplitude = 6,
    { duration = 420, step = 70, ring = true } = {},
  ) {
    const inside = cells.filter((c) => this._board.inBounds(c))
    const list: Wave["cells"] = inside.map((c) => ({
      key: keyOf(c),
      delay: manhattan(center, c) * step,
      amplitude,
    }))
    if (ring) {
      const seen = new Set(inside.map(keyOf))
      for (const c of inside) {
        for (const n of this._board.neighbors(c)) {
          const key = keyOf(n)
          if (seen.has(key)) continue
          seen.add(key)
          list.push({
            key,
            delay: manhattan(center, n) * step,
            amplitude: amplitude * 0.35,
          })
        }
      }
    }
    this._waves.push({ start: this._time, duration, cells: list })
  }

  /** Current vertical offset of a cell (positive = sunk). */
  cellOffset(p: Point) {
    return this._offsets.get(keyOf(p)) ?? 0
  }

  private _updateWaves() {
    if (this._waves.length === 0 && this._offsets.size === 0) return
    const offsets = new Map<string, number>()
    this._waves = this._waves.filter((wave) => {
      let alive = false
      for (const cell of wave.cells) {
        const u = (this._time - wave.start - cell.delay) / wave.duration
        if (u < 1) alive = true
        const offset = waveOffset(cell.amplitude, u)
        if (offset !== 0)
          offsets.set(cell.key, (offsets.get(cell.key) ?? 0) + offset)
      }
      return alive
    })

    for (const key of new Set([...this._offsets.keys(), ...offsets.keys()])) {
      const parts = this._parts.get(key)
      if (parts) {
        parts.column.y = parts.y + (offsets.get(key) ?? 0)
        parts.water.y = parts.column.y
        if (parts.overlay.parent !== parts.column)
          parts.overlay.y = parts.column.y
        for (const fall of this._cascades.get(key) ?? [])
          fall.g.y = parts.column.y
      }
    }
    this._offsets = offsets
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  private _drawCell(cell: Cell) {
    const parts = this._parts.get(keyOf(cell))!
    const column = parts.column
    const g = parts.ground
    const base = toScreen(cell)
    column.position.set(base.x, base.y + (this._offsets.get(keyOf(cell)) ?? 0))
    column.zIndex = depthOf(cell, DEPTH.column)
    parts.y = base.y

    // the cached pieces are only detached, the others are drawn again
    column.removeChildren()
    parts.water.removeFromParent()
    parts.water.removeChildren()
    parts.water.addChild(parts.waterG)
    parts.waterG.clear()
    for (const node of parts.transient) node.destroy({ children: true })
    parts.transient = []
    parts.animated = []
    this._cascades.delete(keyOf(cell))
    g.clear()
    column.addChild(g)

    const groundY = -cell.elevation * levelHeight()
    const noise = cellNoise(cell, this._seed)

    // (a lake bed is a column too, seen through the translucent sheet)
    this._drawSides(g, cell, groundY, cell.terrain === "water")

    if (cell.terrain === "water") {
      this._drawWater(g, cell, parts)
    } else {
      const color = shade(
        GROUND_TOP[cell.elevation] ?? GROUND_TOP[0],
        0.94 + noise * 0.12,
      )
      const top = diamond().map((v, i) => (i % 2 === 1 ? v + groundY : v))
      g.poly(top).fill(color)
      // light from the top-left: lit back edges, darker front edges
      // (one stroke per kind of edge: a stroke is costly to build)
      for (const front of [false, true]) {
        for (const dir of SIDES) {
          if (project(dir.x, dir.y).y > 0 !== front) continue
          const [a, b] = edgeOf(dir)
          g.moveTo(a.x, a.y + groundY).lineTo(b.x, b.y + groundY)
        }
        g.stroke(
          front
            ? { width: 1, color: 0x000000, alpha: 0.25 }
            : { width: 1.5, color: 0xffffff, alpha: 0.18 },
        )
      }
    }
    this._placeDecor(cell, groundY, parts)

    // highlights sit on the walkable surface
    if (cell.terrain === "water") {
      // above its translucent water group, not dimmed by it
      parts.overlay.position.set(column.x, column.y)
      parts.overlay.zIndex = depthOf(cell, DEPTH.column + 0.7)
      parts.overlay.label = "aux"
      this._entities.addChild(parts.overlay)
    } else {
      parts.overlay.position.set(0, groundY)
      column.addChild(parts.overlay)
    }

    const surface = this.cellTop(cell)
    // the top face and the top block's sides: pointing at them is
    // pointing at the cell (the blocks under it are not)
    parts.hit.hitArea = new Polygon(withSides(diamond(), levelHeight()))
    parts.hit.position.set(surface.x, surface.y)
    parts.hit.zIndex = depthAlong(cell)
  }

  /**
   * Column sides, banded with rock strata (one band per level). The bands
   * well behind the neighbor's column are hidden: not drawn (a margin
   * stays for the shockwaves, which move the columns).
   */
  private _drawSides(
    g: Graphics,
    cell: Cell,
    topY: number,
    underwater: boolean,
  ) {
    const step = levelHeight()
    const bottom = COLUMN_BOTTOM * verticalScale()
    const faces = visibleFaces()
    const level = levelHeight()
    // below this, a face is behind its neighbor's column
    const cover = faces.map(({ dir }) => {
      const n = this._board.get({ x: cell.x + dir.x, y: cell.y + dir.y })
      // (the water is translucent: the beds and the steps between them show)
      return n ? -n.elevation * level + HIDDEN_MARGIN : Number.POSITIVE_INFINITY
    })
    if (underwater) {
      // a submerged bed: interior sides once, in one colour (no rims or
      // strata under the water); the sides on the island edge are below the
      // water wall and look like any land column (strata)
      faces.forEach(({ a, b, light, dir }, i) => {
        const y1 = Math.min(bottom, cover[i])
        if (y1 <= topY + 0.01) return
        if (!this._board.inBounds(add(cell, dir))) {
          let band = 0
          for (let y0 = topY; y0 < y1 - 0.01; y0 += step, band++) {
            const yb = Math.min(y1, y0 + step)
            const color = STRATA[Math.min(band, STRATA.length - 1)]
            g.poly([
              a.x,
              a.y + y0,
              b.x,
              b.y + y0,
              b.x,
              b.y + yb,
              a.x,
              a.y + yb,
            ]).fill(shade(color, light))
          }
          return
        }
        g.poly([
          a.x,
          a.y + topY,
          b.x,
          b.y + topY,
          b.x,
          b.y + y1,
          a.x,
          a.y + y1,
        ]).fill(shade(STRATA[3], light))
      })
      return
    }
    let band = 0
    for (let y0 = topY; y0 < bottom - 0.01; y0 += step, band++) {
      const y1 = Math.min(bottom, y0 + step)
      const color = STRATA[Math.min(band, STRATA.length - 1)]
      const shown = faces.filter((_, i) => y0 < cover[i] - 0.01)
      if (shown.length === 0) continue
      for (const { a, b, light: lit0 } of shown) {
        const light = lit0
        g.poly([
          a.x,
          a.y + y0,
          b.x,
          b.y + y0,
          b.x,
          b.y + y1,
          a.x,
          a.y + y1,
        ]).fill(shade(color, light))
      }
      // pebbles in the strata
      const dark = shown.find((f) => f.light < 1)
      const lit = shown.find((f) => f.light === 1)
      if (dark) {
        const p = lerp(dark.a, dark.b, 0.25)
        // (a few pixels: a square is as good as a circle, and far cheaper)
        g.rect(p.x - 1.2, p.y + y0 + step * 0.45 - 1.2, 2.4, 2.4).fill({
          color: 0x000000,
          alpha: 0.18,
        })
      }
      if (lit) {
        const p = lerp(lit.a, lit.b, 0.65)
        g.rect(p.x - 1, p.y + y0 + step * 0.3 - 1, 2, 2).fill({
          color: 0xffffff,
          alpha: 0.08,
        })
      }
    }
    if (!underwater) {
      // grassy lip on the top of the sides
      for (const { a, b, light } of faces.filter(
        (_, i) => topY < cover[i] - 0.01,
      )) {
        g.poly([
          a.x,
          a.y + topY,
          b.x,
          b.y + topY,
          b.x,
          b.y + topY + 4,
          a.x,
          a.y + topY + 4,
        ]).fill({
          color: light < 1 ? tinted(0x3f6b2a) : tinted(0x4f7d33),
          alpha: 0.9,
        })
      }
    }
    const f = frontCorner()
    g.moveTo(f.x, f.y + topY)
      .lineTo(f.x, f.y + bottom)
      .stroke({ width: 1, color: 0x000000, alpha: 0.25 })
  }

  /** Sides of the cell looking out of the island, towards the viewer. */
  private _edgeFaces(cell: Point) {
    return visibleFaces().filter((f) => !this._board.inBounds(add(cell, f.dir)))
  }

  /**
   * Flooded hole: the sandy bed (in the column), then the water: opaque
   * sheet and edge walls in the cell's group, which is translucent as a
   * whole. Same-depth cells share one colour, the tint steps per depth.
   */
  private _drawWater(g: Graphics, cell: Cell, parts: CellParts) {
    const { color: body } = waterTint(-cell.elevation)
    const bedY = -cell.elevation * levelHeight()
    g.poly(diamond().map((v, i) => (i % 2 === 1 ? v + bedY : v))).fill(
      shade(
        mix(WATER.bed, STRATA[1], 0.6),
        0.85 + cellNoise(cell, this._seed, 3) * 0.2,
      ),
    )
    const w = parts.waterG
    const length = COLUMN_BOTTOM + this._depths[cell.y][cell.x] * BLOCK_HEIGHT
    const falls: Cascade[] = []
    const column = parts.column
    for (const { dir } of this._edgeFaces(cell)) {
      const fall: Cascade = { g: new Graphics(), dir, length }
      falls.push(fall)
      fall.g.position.set(column.x, column.y)
      fall.g.zIndex = depthOf(cell, DEPTH.column + 0.8)
      fall.g.label = "aux"
      this._entities.addChild(fall.g)
      parts.transient.push(fall.g)
      this._drawCascade(fall)
    }
    this._cascades.set(keyOf(cell), falls)
    w.poly(diamond()).fill(body)

    if (!parts.shimmer) {
      const n = cellNoise(cell, this._seed, 7)
      const shimmer = new Graphics()
      shimmer.blendMode = "add"
      shimmer
        .moveTo(-14 + n * 8, -2)
        .lineTo(-4 + n * 8, -5)
        .stroke({ width: 1.5, color: 0xffffff, alpha: 0.5 })
        .moveTo(4 - n * 6, 5)
        .lineTo(14 - n * 6, 2)
        .stroke({ width: 1.5, color: 0xffffff, alpha: 0.35 })
      parts.shimmer = shimmer
    }
    parts.water.addChild(parts.shimmer)
    parts.animated.push(parts.shimmer)
    parts.water.position.set(column.x, column.y)
    this._bandFor(cell).addChild(parts.water)
  }

  /** Detaches and frees the cached decor of a cell (drawn again later). */
  private _forgetDecor(parts: CellParts) {
    const nodes: Container[] = [
      ...(parts.decor ?? []).map((d) => d.node),
      ...[...parts.vines.values()].flat().map((d) => d.node),
    ]
    if (parts.shimmer) nodes.push(parts.shimmer)
    for (const node of nodes) node.destroy({ children: true })
    parts.decor = null
    parts.vines.clear()
    parts.shimmer = null
  }

  /** Puts the decor of a cell where the camera sees its spots. */
  private _placeDecor(cell: Cell, topY: number, parts: CellParts) {
    parts.decor ??= this._drawDecor(cell)
    for (const item of parts.decor) {
      const p = project(item.at.x, item.at.y)
      item.node.position.set(p.x, topY + p.y)
      parts.column.addChild(item.node)
      if (item.animated) parts.animated.push(item.animated)
    }
  }

  /** A point of the top (grid offset), away from where fighters stand. */
  private _spot(cell: Point, salt: number): Point {
    const rand = (k: number) => cellNoise(cell, this._seed, k)
    let u = rand(salt) * 1.4 - 0.7
    const v = rand(salt + 1) * 1.4 - 0.7
    if (Math.abs(u) < 0.3 && Math.abs(v) < 0.3) u = Math.sign(u || 1) * 0.45
    return { x: u * 0.5, y: v * 0.5 }
  }

  /**
   * Grass, flowers, bushes, mushrooms, reeds, pebbles and chaos crystals:
   * each piece drawn around (0, 0), facing the screen, and placed on its
   * spot of the top by `_placeDecor`.
   */
  private _drawDecor(cell: Cell): DecorItem[] {
    const rand = (salt: number) => cellNoise(cell, this._seed, salt)
    const items: DecorItem[] = []
    // each spot starts a new piece, drawn by `g` around p = (0, 0)
    let item: DecorItem = { at: { x: 0, y: 0 }, node: new Graphics() }
    let g = item.node as Graphics
    const spot = (salt: number) => {
      g = new Graphics()
      item = { at: this._spot(cell, salt), node: new Container() }
      item.node.addChild(g)
      items.push(item)
      return { x: 0, y: 0 }
    }
    const e = cell.elevation
    // (smooth tiles: no grass, flowers, bushes, mushrooms, reeds or pebbles;
    // only the chaos crystals of the lore stand on the ground)
    if (e >= 2 && rand(14) < (e === 3 ? 0.45 : 0.15)) {
      // chaos crystal (lore: fragments of the shattered worlds)
      const p = spot(80)
      const color = rand(15) < 0.5 ? 0xb197fc : 0x63e6be
      const crystal = new Graphics()
        .poly([
          p.x - 3,
          p.y,
          p.x - 1.5,
          p.y - 10,
          p.x + 1,
          p.y - 13,
          p.x + 3,
          p.y,
        ])
        .fill({ color, alpha: 0.85 })
        .stroke({ width: 1, color: shade(color, 0.6) })
        .poly([p.x + 1, p.y - 1, p.x + 4, p.y - 7, p.x + 6, p.y - 1])
        .fill({ color: shade(color, 1.2), alpha: 0.85 })
      const glow = new Sprite(softCircle())
      glow.anchor.set(0.5)
      glow.tint = color
      glow.blendMode = "add"
      glow.scale.set(28 / 64)
      glow.position.set(p.x, p.y - 6)
      item.node.addChild(crystal, glow)
      item.animated = glow
    }
    return items
  }

  /**
   * Underside of the floating island: a fake stack of terrain blocks under
   * every cell, narrowing into an irregular inverted pyramid, with the
   * same strata as the terrain, and a faint glow below.
   */
  private _drawUnderside() {
    const container = new Container()
    const { width, height } = this._board
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 },
    ].map((p) => toScreen(p))
    const xs = corners.map((p) => p.x)
    const front = corners.reduce((a, b) => (b.y > a.y ? b : a))
    const center = toScreen({ x: (width - 1) / 2, y: (height - 1) / 2 })

    const glow = new Sprite(softCircle())
    glow.anchor.set(0.5)
    glow.tint = 0x7048e8
    glow.alpha = 0.25
    glow.blendMode = "add"
    glow.scale.set(
      ((Math.max(...xs) - Math.min(...xs) + TILE_WIDTH) * 1.4) / 64,
      320 / 64,
    )
    glow.position.set(
      center.x,
      front.y + (COLUMN_BOTTOM + 110) * verticalScale(),
    )
    container.addChild(glow)

    const blocks = new Graphics()
    const cells = [...this._board.cells].sort(
      (a, b) => depthAlong(a) - depthAlong(b),
    )
    for (const cell of cells) {
      const depth = this._depths[cell.y][cell.x]
      const origin = toScreen(cell)
      for (let k = 0; k < depth; k++) {
        // a face against the neighbor's block of the same level is hidden
        const hidden = (d: Point) => {
          const n = { x: cell.x + d.x, y: cell.y + d.y }
          return this._board.inBounds(n) && this._depths[n.y][n.x] > k
        }
        drawBlock(
          blocks,
          origin,
          COLUMN_BOTTOM + k * BLOCK_HEIGHT,
          k + 1,
          undefined,
          hidden,
        )
      }
    }
    container.addChild(blocks)
    this._undersideBottom = blocks.getLocalBounds().maxY
    // strata and darkening with depth: whole horizontal bands across the
    // underside, clipped to the blocks (never per block: it draws wedges)
    const box = blocks.getLocalBounds()
    const bands = new Graphics()
    const step = BLOCK_HEIGHT * 2 * verticalScale()
    const rows = Math.ceil(box.height / step)
    for (let i = 0; i < rows; i++) {
      const alpha = Math.min(0.45, (i / Math.max(1, rows)) * 0.5)
      bands
        .rect(box.x - 2, box.y + i * step, box.width + 4, step)
        .fill({ color: i % 2 === 0 ? 0x1a1208 : 0x2a1c0c, alpha })
    }
    container.addChild(bands)
    const clip = new Graphics(blocks.context)
    container.addChild(clip)
    bands.setMask({ mask: clip })
    return container
  }
}

/**
 * A top face (flat x, y list) stretched down by `depth`: the outline of
 * the face and of the sides under it, as a convex polygon.
 */
export function withSides(face: number[], depth: number): number[] {
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < face.length; i += 2)
    points.push(
      { x: face[i], y: face[i + 1] },
      { x: face[i], y: face[i + 1] + depth },
    )
  // convex hull (monotone chain)
  points.sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const half = (list: { x: number; y: number }[]) => {
    const out: { x: number; y: number }[] = []
    for (const p of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2], out[out.length - 1], p) <= 0
      )
        out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(points), ...half([...points].reverse())].flatMap((p) => [
    p.x,
    p.y,
  ])
}

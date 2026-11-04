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
  Container,
  type FederatedPointerEvent,
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

/** Bottom of every column, below the lowest level (classic view). */
export const COLUMN_BOTTOM = -FLOOR_LEVEL * ELEVATION_HEIGHT + TILE_DEPTH

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
  hit: Graphics
  /** Rest position of the column on screen. */
  y: number
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
        animated: [],
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
    this._container.addChildAt(this._underside, 0)
    for (const cell of this._board.cells) this._drawCell(cell)
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

  /** Waterfalls of the island (one per water cell side on the edge). */
  get cascades(): readonly Cascade[] {
    return [...this._cascades.values()].flat()
  }

  protected _onTerminate() {
    for (const parts of this._parts.values())
      parts.column.destroy({ children: true })
    this._hitLayer.destroy({ children: true })
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
      if (cell) this._drawCell(cell)
    }
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
    } of highlights) {
      if (trail) {
        this._drawTrail(cells, color, alpha)
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

  private _drawTrail(cells: Point[], color: number, alpha: number) {
    cells.forEach((p, i) => {
      const parts = this._parts.get(keyOf(p))
      if (!parts) return
      const g = parts.overlay
      // half-way to the previous and next cells, on the tile top
      const ends = [cells[i - 1], cells[i + 1]]
        .filter((q): q is Point => !!q && manhattan(p, q) === 1)
        .map((q) => {
          const end = project((q.x - p.x) / 2, (q.y - p.y) / 2)
          // a step down to a lower neighbor in front: the higher cell
          // draws the drop along its side, so both halves meet (behind,
          // the higher column hides the lower half anyway)
          const front = project(q.x - p.x, q.y - p.y).y > 0
          const drop = !front
            ? 0
            : Math.max(
                0,
                (this._board.standHeight(p) - this._board.standHeight(q)) *
                  levelHeight(),
              )
          return { ...end, drop }
        })
      for (const [width, tint, a] of [
        [9, 0x000000, alpha * 0.45],
        [5, color, alpha],
      ] as const) {
        for (const end of ends) {
          g.moveTo(0, 0).lineTo(end.x, end.y)
          if (end.drop > 0) g.lineTo(end.x, end.y + end.drop)
          g.stroke({
            width,
            color: tint,
            alpha: a,
            cap: "round",
            join: "round",
          })
        }
        g.circle(0, 0, width / 2).fill({ color: tint, alpha: a })
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
      if (parts) parts.column.y = parts.y + (offsets.get(key) ?? 0)
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

    column.removeChildren().forEach((c) => {
      if (c !== parts.overlay && c !== g) c.destroy({ children: true })
    })
    parts.animated = []
    this._cascades.delete(keyOf(cell))
    g.clear()
    column.addChild(g)

    const groundY = -cell.elevation * levelHeight()
    const noise = cellNoise(cell, this._seed)

    this._drawSides(g, groundY, cell.terrain === "water")

    if (cell.terrain === "water") {
      this._drawWater(g, cell, groundY, parts)
    } else {
      const color = shade(
        GROUND_TOP[cell.elevation] ?? GROUND_TOP[0],
        0.94 + noise * 0.12,
      )
      const top = diamond().map((v, i) => (i % 2 === 1 ? v + groundY : v))
      g.poly(top).fill(color)
      // light from the top-left: lit back edges, darker front edges
      for (const dir of SIDES) {
        const [a, b] = edgeOf(dir)
        const front = project(dir.x, dir.y).y > 0
        g.moveTo(a.x, a.y + groundY)
          .lineTo(b.x, b.y + groundY)
          .stroke(
            front
              ? { width: 1, color: 0x000000, alpha: 0.25 }
              : { width: 1.5, color: 0xffffff, alpha: 0.18 },
          )
      }
      this._drawVines(g, cell, groundY)
      this._drawDecor(g, cell, groundY, parts)
    }

    // highlights sit on the walkable surface
    parts.overlay.y = cell.terrain === "water" ? 0 : groundY
    column.addChild(parts.overlay)

    const surface = this.cellTop(cell)
    parts.hit.hitArea = new Polygon(diamond())
    parts.hit.position.set(surface.x, surface.y)
    parts.hit.zIndex = depthAlong(cell)
  }

  /** Column sides, banded with rock strata (one band per level). */
  private _drawSides(g: Graphics, topY: number, underwater: boolean) {
    const step = levelHeight()
    const bottom = COLUMN_BOTTOM * verticalScale()
    const faces = visibleFaces()
    let band = 0
    for (let y0 = topY; y0 < bottom - 0.01; y0 += step, band++) {
      const y1 = Math.min(bottom, y0 + step)
      const rock =
        STRATA[Math.min(band + (underwater ? 2 : 0), STRATA.length - 1)]
      const color = underwater ? mix(rock, WATER.deep, 0.25) : rock
      for (const { a, b, light } of faces) {
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
      const dark = faces.find((f) => f.light < 1)
      const lit = faces.find((f) => f.light === 1)
      if (dark) {
        const p = lerp(dark.a, dark.b, 0.25)
        g.circle(p.x, p.y + y0 + step * 0.45, 1.4).fill({
          color: 0x000000,
          alpha: 0.18,
        })
      }
      if (lit) {
        const p = lerp(lit.a, lit.b, 0.65)
        g.circle(p.x, p.y + y0 + step * 0.3, 1.2).fill({
          color: 0xffffff,
          alpha: 0.08,
        })
      }
    }
    if (!underwater) {
      // grassy lip on the top of the sides
      for (const { a, b, light } of faces) {
        g.poly([
          a.x,
          a.y + topY,
          b.x,
          b.y + topY,
          b.x,
          b.y + topY + 4,
          a.x,
          a.y + topY + 4,
        ]).fill({ color: light < 1 ? 0x3f6b2a : 0x4f7d33, alpha: 0.9 })
      }
    }
    const f = frontCorner()
    g.moveTo(f.x, f.y + topY)
      .lineTo(f.x, f.y + bottom)
      .stroke({ width: 1, color: 0x000000, alpha: 0.25 })
  }

  /** Animated waterfall: a foam lip, streaks running down, droplets. */
  private _drawCascade(cascade: Cascade) {
    const { g, dir } = cascade
    const length = cascade.length * verticalScale()
    const t = this._time / 1000
    // the top edge of the face the water runs down
    const [a, b] = edgeOf(dir)
    const at = (u: number) => lerp(a, b, 0.02 + u * 0.96)
    g.clear()
    const slices = 8
    const pa = at(0)
    const pb = at(1)
    for (let i = 0; i < slices; i++) {
      const y0 = (length * i) / slices
      const y1 = (length * (i + 1)) / slices
      const alpha = 0.6 * Math.min(1, (slices - i) / 3)
      g.poly([
        pa.x,
        pa.y + y0,
        pb.x,
        pb.y + y0,
        pb.x,
        pb.y + y1,
        pa.x,
        pa.y + y1,
      ]).fill({ color: WATER.surface, alpha })
    }
    const streaks = 8
    for (let s = 0; s < streaks; s++) {
      const p = at((s + 0.5) / streaks)
      const speed = 60 + (s % 3) * 18
      for (let k = 0; k < 3; k++) {
        const y = (t * speed + (k * length) / 3 + s * 13) % length
        g.moveTo(p.x, p.y + y)
          .lineTo(p.x, p.y + y + 7)
          .stroke({
            width: 1.2,
            color: 0xffffff,
            alpha: 0.55 * (1 - y / length),
          })
      }
    }
    g.moveTo(pa.x, pa.y)
      .lineTo(pb.x, pb.y)
      .stroke({ width: 2, color: WATER.foam, alpha: 0.85 })
    // droplets falling past the bottom, into the void
    for (let d = 0; d < 4; d++) {
      const u = (t / 0.9 + d / 4) % 1
      const p = at((d * 0.37 + 0.15) % 1)
      g.circle(p.x, p.y + length + u * 40, 1.4).fill({
        color: 0xe7f5ff,
        alpha: 0.7 * (1 - u),
      })
    }
  }

  /** Sides of the cell looking out of the island, towards the viewer. */
  private _edgeFaces(cell: Point) {
    return visibleFaces().filter((f) => !this._board.inBounds(add(cell, f.dir)))
  }

  /** Flooded hole: sandy bed, translucent water body, shimmer and foam. */
  private _drawWater(g: Graphics, cell: Cell, bedY: number, parts: CellParts) {
    const depth = -cell.elevation
    g.poly(diamond().map((v, i) => (i % 2 === 1 ? v + bedY : v))).fill(
      WATER.bed,
    )

    const body = mix(WATER.surface, WATER.deep, Math.min(1, depth / 3))
    // water box sides (seen at the island edge)
    for (const { a, b, light } of visibleFaces()) {
      g.poly([a.x, a.y, b.x, b.y, b.x, b.y + bedY, a.x, a.y + bedY]).fill({
        color: shade(body, light < 1 ? 0.8 : 1),
        alpha: 0.7,
      })
    }
    g.poly(diamond()).fill({ color: body, alpha: 0.55 + depth * 0.1 })

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
    parts.column.addChild(shimmer)
    parts.animated.push(shimmer)

    // water on the edge pours over it, down the column and the blocks below
    const length = COLUMN_BOTTOM + this._depths[cell.y][cell.x] * BLOCK_HEIGHT
    const falls: Cascade[] = this._edgeFaces(cell).map(({ dir }) => ({
      g: new Graphics(),
      dir,
      length,
    }))
    for (const fall of falls) {
      parts.column.addChild(fall.g)
      this._drawCascade(fall)
    }
    this._cascades.set(keyOf(cell), falls)

    // foam along the shores
    for (const d of SIDES) {
      const neighbor = this._board.get(add(cell, d))
      if (neighbor && neighbor.terrain !== "water") {
        const [a, b] = edgeOf(d, undefined, 0.92)
        g.moveTo(a.x, a.y)
          .lineTo(b.x, b.y)
          .stroke({ width: 2, color: WATER.foam, alpha: 0.7 })
      }
    }
  }

  /** Vines and moss hanging from the visible front edges of the island. */
  private _drawVines(g: Graphics, cell: Cell, topY: number) {
    const rand = (salt: number) => cellNoise(cell, this._seed, salt)
    for (const { dir, a, b } of this._edgeFaces(cell)) {
      // same strands on the same side, whatever the camera
      const side = dir.x + 2 * dir.y
      const strands = 1 + Math.floor(rand(300 + side) * 3)
      for (let i = 0; i < strands; i++) {
        const t = 0.15 + rand(310 + i * 7 + side) * 0.7
        // point on the top edge of that face
        const start = lerp(a, b, t)
        let x = start.x
        let y = topY + start.y + 3
        const length = 10 + rand(320 + i * 7 + side) * 22
        const sway = (rand(330 + i * 7 + side) - 0.5) * 4
        g.moveTo(x, y)
        const points: [number, number][] = []
        for (let k = 1; k <= 4; k++) {
          const nx = x + Math.sin(k * 1.3 + sway) * 1.5
          const ny = y + length / 4
          g.quadraticCurveTo((x + nx) / 2 + sway * 0.3, (y + ny) / 2, nx, ny)
          points.push([nx, ny])
          x = nx
          y = ny
        }
        g.stroke({ width: 1.3, color: 0x2b5d1f, alpha: 0.95 })
        points.forEach(([px, py], k) => {
          const dir = k % 2 === 0 ? 1 : -1
          g.ellipse(px + dir * 1.6, py - 2, 1.6, 0.9).fill(
            k % 2 ? 0x4f8a2f : 0x3f7a25,
          )
        })
      }
    }
  }

  /** Grass, flowers, bushes, mushrooms, reeds, pebbles and chaos crystals. */
  private _drawDecor(g: Graphics, cell: Cell, topY: number, parts: CellParts) {
    const rand = (salt: number) => cellNoise(cell, this._seed, salt)
    // a point on the tile top, away from the center where fighters stand
    const spot = (salt: number) => {
      let u = rand(salt) * 1.4 - 0.7
      const v = rand(salt + 1) * 1.4 - 0.7
      if (Math.abs(u) < 0.3 && Math.abs(v) < 0.3) u = Math.sign(u || 1) * 0.45
      const p = project(u * 0.5, v * 0.5)
      return { x: p.x, y: topY + p.y }
    }
    const e = cell.elevation
    const shore = this._board
      .neighbors(cell)
      .some((n) => this._board.get(n)?.terrain === "water")

    if (e >= 0) {
      const top = GROUND_TOP[e] ?? GROUND_TOP[0]
      const dark = shade(top, 0.72)
      const light = shade(top, 1.28)

      // a light grain on the grass
      for (let i = 0; i < 7; i++) {
        const p = spot(200 + i * 2)
        g.circle(p.x, p.y, 0.8).fill({
          color: i % 2 ? dark : light,
          alpha: 0.5,
        })
      }

      // tufts of curved blades
      const tufts = 1 + Math.floor(rand(1) * 3)
      for (let i = 0; i < tufts; i++) {
        const p = spot(10 + i * 3)
        const blades = 4 + Math.floor(rand(20 + i) * 3)
        for (let b = 0; b < blades; b++) {
          const dx = (b - (blades - 1) / 2) * 1.2
          const h = 3 + rand(30 + i * 5 + b) * 3.5
          const lean = (rand(40 + i * 5 + b) - 0.5) * 4
          g.moveTo(p.x + dx, p.y)
            .quadraticCurveTo(
              p.x + dx + lean * 0.2,
              p.y - h * 0.6,
              p.x + dx + lean,
              p.y - h,
            )
            .stroke({ width: 1.1, color: b % 2 ? dark : light })
        }
      }

      // little flowers with petals and a stem
      if (rand(2) < 0.38 && e <= 2) {
        const colors = [0xf783ac, 0xffe066, 0xffffff, 0xb197fc, 0xff8787]
        const color = colors[Math.floor(rand(3) * colors.length)]
        const count = 1 + Math.floor(rand(4) * 3)
        for (let i = 0; i < count; i++) {
          const p = spot(50 + i * 3)
          g.moveTo(p.x, p.y)
            .lineTo(p.x, p.y - 3)
            .stroke({ width: 0.8, color: dark })
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2
            g.circle(
              p.x + Math.cos(a) * 1.2,
              p.y - 4 + Math.sin(a) * 0.9,
              0.9,
            ).fill(color)
          }
          g.circle(p.x, p.y - 4, 0.7).fill(0xfab005)
        }
      }

      // round bush, sometimes with berries
      if (rand(5) < 0.14) {
        const p = spot(90)
        const leaf = shade(top, 0.8)
        g.ellipse(p.x, p.y, 6, 2.2).fill({ color: 0x000000, alpha: 0.2 })
        g.circle(p.x - 2.5, p.y - 3, 3.2).fill(shade(leaf, 0.85))
        g.circle(p.x + 2.5, p.y - 3, 3.2).fill(shade(leaf, 0.9))
        g.circle(p.x, p.y - 5, 3.6).fill(leaf)
        g.circle(p.x - 1, p.y - 6.5, 1.4).fill({ color: 0xffffff, alpha: 0.18 })
        if (rand(6) < 0.5) {
          for (const [bx, by] of [
            [-2, -3],
            [2, -4],
            [0, -6],
          ]) {
            g.circle(p.x + bx, p.y + by, 0.8).fill(0xe03131)
          }
        }
      }

      // mushrooms
      if (rand(7) < 0.09 && e <= 1) {
        const p = spot(60)
        const cap = rand(8) < 0.5 ? 0xe03131 : 0xa0522d
        g.roundRect(p.x - 0.9, p.y - 3.5, 1.8, 3.5, 0.6).fill(0xf1f3f5)
        g.poly([
          p.x - 3,
          p.y - 3.2,
          p.x - 2,
          p.y - 5.4,
          p.x,
          p.y - 6.2,
          p.x + 2,
          p.y - 5.4,
          p.x + 3,
          p.y - 3.2,
        ]).fill(cap)
        g.circle(p.x - 1, p.y - 4.8, 0.5).fill(0xffffff)
        g.circle(p.x + 1.2, p.y - 4.2, 0.4).fill(0xffffff)
      }

      // reeds and cattails along the shores
      if (shore && rand(9) < 0.7) {
        const p = spot(100)
        for (let i = 0; i < 3; i++) {
          const x = p.x + (i - 1) * 1.8
          const h = 7 + rand(110 + i) * 4
          g.moveTo(x, p.y)
            .lineTo(x + (i - 1) * 0.8, p.y - h)
            .stroke({ width: 1, color: 0x5c940d })
          if (i !== 1)
            g.ellipse(x + (i - 1) * 0.8, p.y - h + 1.5, 0.9, 2).fill(0x7f4f24)
        }
      }
    } else {
      // dry pit: cracked dirt
      for (let i = 0; i < 2; i++) {
        const p = spot(120 + i * 3)
        g.moveTo(p.x - 4, p.y)
          .lineTo(p.x - 1, p.y - 1)
          .lineTo(p.x + 1, p.y + 1)
          .lineTo(p.x + 4, p.y)
          .stroke({ width: 1, color: 0x000000, alpha: 0.3 })
      }
    }

    // pebbles
    if (rand(11) < (e < 0 ? 0.7 : 0.3)) {
      const count = 1 + Math.floor(rand(12) * 2)
      for (let i = 0; i < count; i++) {
        const p = spot(70 + i * 3)
        const size = e >= 2 ? 3.2 : 1.8 + rand(13 + i)
        g.ellipse(p.x, p.y + 0.5, size, size * 0.45).fill({
          color: 0x000000,
          alpha: 0.2,
        })
        g.ellipse(p.x, p.y, size, size * 0.6).fill(0x868e96)
        g.ellipse(
          p.x - size * 0.3,
          p.y - size * 0.25,
          size * 0.4,
          size * 0.25,
        ).fill({
          color: 0xffffff,
          alpha: 0.4,
        })
      }
    }

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
      parts.column.addChild(crystal, glow)
      parts.animated.push(glow)
    }
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
        drawBlock(blocks, origin, COLUMN_BOTTOM + k * BLOCK_HEIGHT, k + 1)
      }
    }
    container.addChild(blocks)
    return container
  }
}

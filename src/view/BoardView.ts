import * as booyah from "@ghom/booyah"
import {
  Container,
  Graphics,
  Polygon,
  Sprite,
  type FederatedPointerEvent,
} from "pixi.js"

import {
  type Board,
  type Cell,
  type Point,
  add,
  keyOf,
  manhattan,
} from "../engine"
import ViewChip from "./ViewChip"
import { softCircle } from "./effects"
import {
  ELEVATION_HEIGHT,
  FLOOR_LEVEL,
  GROUND_TOP,
  STRATA,
  TILE_DEPTH,
  TILE_HEIGHT,
  TILE_WIDTH,
  WATER,
  cellNoise,
  diamond,
  mix,
  shade,
  toScreen,
} from "./theme"

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
}

/** Depth offsets inside a diagonal of the shared `entities` layer. */
export const DEPTH = {
  column: 1,
  fighter: 6,
}

export const depthOf = (p: Point, offset: number) => (p.x + p.y) * 10 + offset

/** Vertical offset of a cell during a shockwave: sink, bounce, settle. */
export function waveOffset(amplitude: number, u: number) {
  if (u < 0 || u >= 1) return 0
  return amplitude * Math.exp(-3.5 * u) * Math.sin(2.5 * Math.PI * u)
}

const W = TILE_WIDTH / 2
const H = TILE_HEIGHT / 2
/** Bottom of every column, below the lowest level. */
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
export default class BoardView extends ViewChip<BoardViewEvents> {
  private _parts = new Map<string, CellParts>()
  private _hitLayer!: Container
  private _time = 0
  private _waves: Wave[] = []
  private _offsets = new Map<string, number>()

  constructor(
    private readonly _board: Board,
    private readonly _entities: Container,
    private readonly _top: Container,
    private readonly _seed = 0,
  ) {
    super()
  }

  protected _onActivate() {
    this._container.addChild(this._drawUnderside())
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
      hit.hitArea = new Polygon(diamond())
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
      this._drawCell(cell)
    }
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
    this._updateWaves()
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
    } of highlights) {
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
    g.clear()
    column.addChild(g)

    const groundY = -cell.elevation * ELEVATION_HEIGHT
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
      g.moveTo(-W, groundY)
        .lineTo(0, groundY - H)
        .lineTo(W, groundY)
        .stroke({ width: 1.5, color: 0xffffff, alpha: 0.18 })
      g.moveTo(-W, groundY)
        .lineTo(0, groundY + H)
        .lineTo(W, groundY)
        .stroke({ width: 1, color: 0x000000, alpha: 0.25 })
      this._drawDecor(g, cell, groundY, parts)
    }

    // highlights sit on the walkable surface
    parts.overlay.y = cell.terrain === "water" ? 0 : groundY
    column.addChild(parts.overlay)

    const surface = this.cellTop(cell)
    parts.hit.position.set(surface.x, surface.y)
    parts.hit.zIndex = cell.x + cell.y
  }

  /** Column sides, banded with rock strata (one band per level). */
  private _drawSides(g: Graphics, topY: number, underwater: boolean) {
    let band = 0
    for (let y0 = topY; y0 < COLUMN_BOTTOM; y0 += ELEVATION_HEIGHT, band++) {
      const y1 = Math.min(COLUMN_BOTTOM, y0 + ELEVATION_HEIGHT)
      const rock =
        STRATA[Math.min(band + (underwater ? 2 : 0), STRATA.length - 1)]
      const color = underwater ? mix(rock, WATER.deep, 0.25) : rock
      g.poly([-W, y0, 0, y0 + H, 0, y1 + H, -W, y1]).fill(shade(color, 0.78))
      g.poly([W, y0, 0, y0 + H, 0, y1 + H, W, y1]).fill(color)
      // pebbles in the strata
      g.circle(-W * 0.55, y0 + H * 0.45 + 6, 1.4).fill({
        color: 0x000000,
        alpha: 0.18,
      })
      g.circle(W * 0.35, y0 + H * 0.7 + 4, 1.2).fill({
        color: 0xffffff,
        alpha: 0.08,
      })
    }
    if (!underwater) {
      // grassy lip on the top of the sides
      g.poly([-W, topY, 0, topY + H, 0, topY + H + 4, -W, topY + 4]).fill({
        color: 0x3f6b2a,
        alpha: 0.9,
      })
      g.poly([W, topY, 0, topY + H, 0, topY + H + 4, W, topY + 4]).fill({
        color: 0x4f7d33,
        alpha: 0.9,
      })
    }
    g.moveTo(0, topY + H)
      .lineTo(0, COLUMN_BOTTOM + H)
      .stroke({ width: 1, color: 0x000000, alpha: 0.25 })
  }

  /** Flooded hole: sandy bed, translucent water body, shimmer and foam. */
  private _drawWater(g: Graphics, cell: Cell, bedY: number, parts: CellParts) {
    const depth = -cell.elevation
    g.poly(diamond().map((v, i) => (i % 2 === 1 ? v + bedY : v))).fill(
      WATER.bed,
    )

    const body = mix(WATER.surface, WATER.deep, Math.min(1, depth / 3))
    // water box sides (seen at the island edge)
    g.poly([-W, 0, 0, H, 0, bedY + H, -W, bedY]).fill({
      color: shade(body, 0.8),
      alpha: 0.7,
    })
    g.poly([W, 0, 0, H, 0, bedY + H, W, bedY]).fill({ color: body, alpha: 0.7 })
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

    // foam along the shores
    const corners = {
      top: [0, -H],
      right: [W, 0],
      bottom: [0, H],
      left: [-W, 0],
    }
    const edges: [Point, number[], number[]][] = [
      [{ x: 0, y: -1 }, corners.top, corners.right],
      [{ x: 1, y: 0 }, corners.right, corners.bottom],
      [{ x: 0, y: 1 }, corners.bottom, corners.left],
      [{ x: -1, y: 0 }, corners.left, corners.top],
    ]
    for (const [d, a, b] of edges) {
      const neighbor = this._board.get(add(cell, d))
      if (neighbor && neighbor.terrain !== "water") {
        g.moveTo(a[0] * 0.92, a[1] * 0.92)
          .lineTo(b[0] * 0.92, b[1] * 0.92)
          .stroke({ width: 2, color: WATER.foam, alpha: 0.7 })
      }
    }
  }

  /** Grass, flowers, pebbles, mushrooms, rocks and chaos crystals. */
  private _drawDecor(g: Graphics, cell: Cell, topY: number, parts: CellParts) {
    const rand = (salt: number) => cellNoise(cell, this._seed, salt)
    // a point on the tile top, away from the center where fighters stand
    const spot = (salt: number) => {
      let u = rand(salt) * 1.4 - 0.7
      const v = rand(salt + 1) * 1.4 - 0.7
      if (Math.abs(u) < 0.3 && Math.abs(v) < 0.3) u = Math.sign(u || 1) * 0.45
      return { x: (u - v) * W * 0.5, y: topY + (u + v) * H * 0.5 }
    }
    const e = cell.elevation

    if (e >= 0) {
      const top = GROUND_TOP[e] ?? GROUND_TOP[0]
      const dark = shade(top, 0.7)
      const light = shade(top, 1.3)
      const tufts = 2 + Math.floor(rand(1) * 4)
      for (let i = 0; i < tufts; i++) {
        const p = spot(10 + i * 3)
        g.moveTo(p.x, p.y)
          .lineTo(p.x - 2, p.y - 4)
          .stroke({ width: 1, color: dark })
        g.moveTo(p.x, p.y)
          .lineTo(p.x, p.y - 5)
          .stroke({ width: 1, color: light })
        g.moveTo(p.x, p.y)
          .lineTo(p.x + 2, p.y - 4)
          .stroke({ width: 1, color: dark })
      }
      if (rand(2) < 0.4 && e <= 2) {
        const colors = [0xf783ac, 0xffe066, 0xffffff, 0xb197fc]
        const count = 1 + Math.floor(rand(3) * 3)
        for (let i = 0; i < count; i++) {
          const p = spot(40 + i * 3)
          g.circle(p.x, p.y - 1, 1.6).fill(
            colors[Math.floor(rand(50 + i) * colors.length)],
          )
          g.circle(p.x, p.y - 1, 0.6).fill(0xfab005)
        }
      }
      if (rand(4) < 0.1 && e <= 1) {
        const p = spot(60)
        g.rect(p.x - 0.8, p.y - 4, 1.6, 4).fill(0xf1f3f5)
        g.poly([
          p.x - 3.2,
          p.y - 4,
          p.x - 2.2,
          p.y - 6.6,
          p.x,
          p.y - 7.6,
          p.x + 2.2,
          p.y - 6.6,
          p.x + 3.2,
          p.y - 4,
        ]).fill(0xe03131)
        g.circle(p.x - 1, p.y - 5, 0.6).fill(0xffffff)
      }
    }

    if (rand(5) < (e < 0 ? 0.6 : 0.3)) {
      const p = spot(70)
      const size = e >= 2 ? 3.5 : 2
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

    if (e >= 2 && rand(6) < (e === 3 ? 0.45 : 0.15)) {
      // chaos crystal (lore: fragments of the shattered worlds)
      const p = spot(80)
      const color = rand(7) < 0.5 ? 0xb197fc : 0x63e6be
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

  /** Rocky underside of the floating island, with a magical underglow. */
  private _drawUnderside() {
    const container = new Container()
    const { width, height } = this._board
    const left = toScreen({ x: 0, y: height - 1 })
    const front = toScreen({ x: width - 1, y: height - 1 })
    const right = toScreen({ x: width - 1, y: 0 })
    const L = { x: left.x - W, y: left.y + COLUMN_BOTTOM }
    const F = { x: front.x, y: front.y + H + COLUMN_BOTTOM }
    const R = { x: right.x + W, y: right.y + COLUMN_BOTTOM }
    const tip = { x: F.x, y: F.y + 170 }

    const glow = new Sprite(softCircle())
    glow.anchor.set(0.5)
    glow.tint = 0x7048e8
    glow.alpha = 0.35
    glow.blendMode = "add"
    glow.scale.set(((R.x - L.x) * 1.3) / 64, 260 / 64)
    glow.position.set(F.x, F.y + 60)
    container.addChild(glow)

    const jagged = (a: Point, b: Point, salt: number) => {
      const points: number[] = []
      const steps = 9
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const n = cellNoise({ x: i, y: salt }, this._seed)
        const wobble = i < steps ? n - 0.5 : 0
        points.push(
          a.x + (b.x - a.x) * t + wobble * 18,
          a.y + (b.y - a.y) * t + wobble * 22,
        )
      }
      return points
    }

    const rock = new Graphics()
    for (let layer = 0; layer < 3; layer++) {
      const k = 1 - layer * 0.22
      const t = { x: tip.x, y: F.y + (tip.y - F.y) * k }
      const l = {
        x: F.x + (L.x - F.x) * k,
        y: L.y + (F.y - L.y) * (1 - k) * 0.3,
      }
      const r = {
        x: F.x + (R.x - F.x) * k,
        y: R.y + (F.y - R.y) * (1 - k) * 0.3,
      }
      rock
        .poly([
          l.x,
          l.y,
          F.x,
          F.y,
          r.x,
          r.y,
          ...jagged(r, t, layer * 2),
          ...jagged(t, l, layer * 2 + 1),
        ])
        .fill(shade(STRATA[STRATA.length - 1], 1 - layer * 0.18))
    }
    // stalactite-like drips
    for (let i = 0; i < 6; i++) {
      const n = cellNoise({ x: i, y: 99 }, this._seed)
      const x = L.x + (R.x - L.x) * (0.15 + i * 0.14)
      const y = F.y + 40 + n * 40
      rock
        .poly([x - 8, y, x + 8, y, x, y + 26 + n * 20])
        .fill(shade(STRATA[5], 0.85))
    }
    container.addChild(rock)

    // small floating rocks around the island
    const debris = new Graphics()
    for (let i = 0; i < 5; i++) {
      const n = cellNoise({ x: i, y: 7 }, this._seed)
      const side = i % 2 === 0 ? -1 : 1
      const x = F.x + side * (R.x - F.x) * (0.75 + n * 0.5)
      const y = F.y + 20 + n * 120
      const s = 6 + n * 8
      debris
        .poly([x - s, y, x, y - s * 0.6, x + s, y, x + s * 0.3, y + s * 1.4])
        .fill(STRATA[4])
      debris
        .poly([x - s, y, x, y - s * 0.6, x + s, y, x, y + s * 0.4])
        .fill(GROUND_TOP[0])
    }
    container.addChild(debris)
    return container
  }
}

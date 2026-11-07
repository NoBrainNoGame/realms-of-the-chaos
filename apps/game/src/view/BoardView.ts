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
import { ColorMesh } from "./colorMesh"
import { softCircle } from "./effects"
import {
  BLOCK_HEIGHT,
  COLUMN_BOTTOM,
  columnBands,
  drawUndersideStack,
  undersideDepths,
} from "./islands"
import {
  cellNoise,
  depthAlong,
  diamond,
  edgeOf,
  frontCorner,
  GROUND_TOP,
  levelHeight,
  mix,
  project,
  STRATA,
  shade,
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
/** Height of one band of the runoff's fade. */
const FALL_BAND = 4
const FALL_TAIL = 110
/** Speed (px/s) and length (px) of the slow light waves down the runoff. */
const WAVE_SPEED = 40
const WAVE_LENGTH = 240
/** Height (px) of the swell of the water surface, and its mesh density. */
const SWELL = 2
const MESH = 8

/**
 * The swell at a point of the board (grid coordinates), in [-1, 1]: two
 * slow waves crossing, a few cells long. It only depends on the point, so
 * neighbouring cells and the runoff sheet agree on a shared edge.
 */
export function swell(gx: number, gy: number, t: number) {
  const a = Math.sin(((gx + gy) * 2 * Math.PI) / 3.2 - (t * 2 * Math.PI) / 5)
  const b = Math.sin(((gx - gy) * 2 * Math.PI) / 2.3 - (t * 2 * Math.PI) / 7.5)
  return (a + 0.6 * b) / 1.6
}

export const UNDERSIDE_Z = -1e9

export { COLUMN_BOTTOM, columnBands }

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
  /** Grid position and colour of the water of the cell, if any. */
  swellAt: { x: number; y: number; color: number } | null
  /** Drawn again at each redraw (waterfalls). */
  transient: Container[]
  /** The water of the cell (opaque: it is translucent as a group). */
  water: Container
  /** Flat-shaded mesh of the swell, made at the first paint. */
  waterMesh: ColorMesh | null
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

/** A merged runoff sheet along the island edge (see `_paintSheet`). */
interface Sheet {
  mesh: ColorMesh
  lead: { x: number; y: number }
  tail: { x: number; y: number }
  /** Grid points under the two ends. */
  glead: Point
  gtail: Point
  tone: number
  lighter: number
  /** Height of the fall under the surface edge (px at this tilt). */
  drop: number
}

/** A waterfall pouring from a water cell over the edge of the island. */
interface Cascade {
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
  private _backWalls: Container | null = null

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
        waterMesh: null,
        animated: [],
        decor: null,
        vines: new Map(),
        swellAt: null,
        transient: [],
        hit,
        y: 0,
      })
    }
    this.redraw()
  }

  /** Draws everything again, after the camera moved. */
  redraw() {
    this._gridStale = true
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
      if (parts.swellAt) this._paintWater(parts)
    }
    for (const sheet of this._sheets) this._paintSheet(sheet)
    this._updateWaves()
  }

  /**
   * The water surface of a cell: its swell and crest/trough shading, as one
   * flat-shaded mesh (a quad per mesh square, own vertices, no overlap), with
   * the translucency of the water baked in the vertices.
   */
  private _paintWater(parts: CellParts) {
    const at = parts.swellAt
    if (!at) return
    const t = this._time / 1000
    const n = MESH
    const side = n + 1
    let mesh = parts.waterMesh
    if (!mesh) {
      mesh = parts.waterMesh = new ColorMesh(n * n * 4, n * n * 6)
      for (let q = 0; q < n * n; q++) {
        const v = q * 4
        mesh.indices.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6)
      }
      mesh.usedVertices = n * n * 4
      mesh.usedIndices = n * n * 6
      mesh.commit(0)
    }
    if (mesh.parent !== parts.water) parts.water.addChild(mesh)
    const alpha = waterTint(1).alpha
    const pos = mesh.positions
    if (this._gridStale) this._refreshGrid()
    const { _gridX: gx, _gridY: gy, _gridH: gh } = this
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const k = i * side + j
        const h = swell(at.x - 0.5 + i / n, at.y - 0.5 + j / n, t)
        gy[k] = this._projY[k] - h * SWELL
        gh[k] = h
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const a = i * side + j
        const b = a + side
        const d = a + 1
        const c = b + 1
        const s = (gh[a] + gh[b] + gh[d] + gh[c]) / 4
        const color =
          Math.abs(s) < 0.03
            ? at.color
            : s > 0
              ? mix(at.color, 0xffffff, 0.12 * s)
              : mix(at.color, WATER.deep, -0.3 * s)
        const v = (i * n + j) * 4
        let o = v * 2
        pos[o++] = gx[a]
        pos[o++] = gy[a]
        pos[o++] = gx[b]
        pos[o++] = gy[b]
        pos[o++] = gx[c]
        pos[o++] = gy[c]
        pos[o++] = gx[d]
        pos[o] = gy[d]
        for (let q = 0; q < 4; q++) mesh.setColor(v + q, color, alpha)
      }
    }
    mesh.commit()
  }

  /** Screen x of the points of a water mesh, and y without the swell. */
  private readonly _gridX = new Float32Array((MESH + 1) ** 2)
  private readonly _projY = new Float32Array((MESH + 1) ** 2)
  /** Swell-lifted y and height of the points, rewritten at each paint. */
  private readonly _gridY = new Float32Array((MESH + 1) ** 2)
  private readonly _gridH = new Float32Array((MESH + 1) ** 2)
  /** The camera moved: the projected points are computed again. */
  private _gridStale = true

  private _refreshGrid() {
    const n = MESH
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const p = project(-0.5 + i / n, -0.5 + j / n)
        this._gridX[i * (n + 1) + j] = p.x
        this._projY[i * (n + 1) + j] = p.y
      }
    }
    this._gridStale = false
  }

  /**
   * One runoff sheet: its top follows the swell of the surface, its sides
   * sway a little, and slanted crests of light run down it at a constant
   * speed. Flat strips (no texture), the fade is in their alpha.
   */
  private _paintSheet(sheet: Sheet) {
    const { mesh, lead, tail, glead, gtail, drop } = sheet
    const t = this._time / 1000
    const len = Math.hypot(gtail.x - glead.x, gtail.y - glead.y)
    const m = Math.max(2, Math.ceil(len * MESH))
    const sc = sheetScratch(m + 8)
    const { tx, ty, cy } = sc
    const sway = (x: number, y: number) =>
      1.2 * Math.sin(y / 70 - t * 1.1 + x / 40)
    const swayL = sway(lead.x, lead.y + drop / 2)
    const swayR = sway(tail.x, tail.y + drop / 2)
    // the sheet: a swelling top, vertical sides, a flat bottom. Cut into a
    // trapezoid per mesh column under the top edge (convex pieces, vertical
    // joints) and one body under the line below the whole swell
    for (let i = 0; i <= m; i++) {
      const u = i / m
      const h = swell(
        glead.x + (gtail.x - glead.x) * u,
        glead.y + (gtail.y - glead.y) * u,
        t,
      )
      tx[i] = lead.x + (tail.x - lead.x) * u + swayL + ((swayR - swayL) * i) / m
      ty[i] = lead.y + (tail.y - lead.y) * u - h * SWELL
      cy[i] = lead.y + (tail.y - lead.y) * u + SWELL + 0.5
    }
    const bl = lead.y + drop
    const br = tail.y + drop
    // strips parallel to the surface edge (so the bottom is parallel too),
    // slightly slanted; v is the depth under the edge plus the slant, so
    // the crests of two runs meeting at a corner line up
    const slope = (tail.y - lead.y) / Math.max(1, tail.x - lead.x)
    const slant = 0.06
    const tilt = slope - slant
    const c = slope * lead.x - lead.y
    let vmin = Math.min(bl - tilt * tx[0], br - tilt * tx[m])
    let vmax = Math.max(bl - tilt * tx[0], br - tilt * tx[m])
    for (let i = 0; i <= m; i++) {
      const f = ty[i] - tilt * tx[i]
      if (f < vmin) vmin = f
      if (f > vmax) vmax = f
    }
    const xm = (lead.x + tail.x) / 2
    const solidD = drop * 0.25
    const fadeFrom = drop - FALL_TAIL
    const strips = Math.max(0, Math.ceil((vmax - vmin) / FALL_BAND))
    const { stripColor, stripAlpha } = sheetStrips(strips)
    for (let k = 0; k < strips; k++) {
      const f0 = vmin + k * FALL_BAND
      const f1 = Math.min(vmax, f0 + FALL_BAND)
      const v = (f0 + f1) / 2 + c
      // depth under the surface edge at the middle of the strip
      const d = v - slant * xm
      const body =
        d < solidD
          ? 0.3 - (0.06 * Math.max(0, d)) / Math.max(1, solidD)
          : 0.24 -
            0.1 * Math.min(1, (d - solidD) / Math.max(1, fadeFrom - solidD))
      const kk = Math.max(0, Math.min(1, (drop - d) / FALL_TAIL))
      const alpha = d > fadeFrom ? body * kk * kk * (3 - 2 * kk) : body
      const s = Math.sin(((v - WAVE_SPEED * t) * 2 * Math.PI) / WAVE_LENGTH)
      stripColor[k] =
        s > 0
          ? mix(sheet.lighter, 0xffffff, 0.35 * s)
          : mix(sheet.lighter, sheet.tone, -0.5 * s)
      stripAlpha[k] = Math.max(0, alpha) * (1 + 0.3 * s)
    }
    const prev = mesh.usedIndices
    mesh.usedVertices = 0
    mesh.usedIndices = 0
    const emit = (n: number, k: number) => {
      const { ax, ay, bx, by } = sc
      const f0 = vmin + k * FALL_BAND
      const f1 = Math.min(vmax, f0 + FALL_BAND)
      let cnt = clipEdge(ax, ay, n, bx, by, tilt, f0, true)
      if (cnt >= 3) cnt = clipEdge(bx, by, cnt, ax, ay, tilt, f1, false)
      if (cnt < 3) return
      const v0 = mesh.usedVertices
      mesh.ensure(v0 + cnt, mesh.usedIndices + (cnt - 2) * 3)
      const pos = mesh.positions
      const idx = mesh.indices
      for (let i = 0; i < cnt; i++) {
        pos[(v0 + i) * 2] = ax[i]
        pos[(v0 + i) * 2 + 1] = ay[i]
        mesh.setColor(v0 + i, stripColor[k], stripAlpha[k])
      }
      let o = mesh.usedIndices
      for (let i = 1; i < cnt - 1; i++) {
        idx[o++] = v0
        idx[o++] = v0 + i
        idx[o++] = v0 + i + 1
      }
      mesh.usedVertices = v0 + cnt
      mesh.usedIndices = o
    }
    const strip = (f: number) =>
      Math.max(0, Math.min(strips - 1, Math.floor((f - vmin) / FALL_BAND)))
    // under the swell: the columns
    for (let i = 0; i < m; i++) {
      const f0 = ty[i] - tilt * tx[i]
      const f1 = ty[i + 1] - tilt * tx[i + 1]
      const f2 = cy[i] - tilt * tx[i]
      const f3 = cy[i + 1] - tilt * tx[i + 1]
      const lo = strip(Math.min(f0, f1, f2, f3))
      const hi = strip(Math.max(f0, f1, f2, f3))
      for (let k = lo; k <= hi; k++) {
        const { ax, ay } = sc
        ax[0] = tx[i]
        ay[0] = ty[i]
        ax[1] = tx[i + 1]
        ay[1] = ty[i + 1]
        ax[2] = tx[i + 1]
        ay[2] = cy[i + 1]
        ax[3] = tx[i]
        ay[3] = cy[i]
        emit(4, k)
      }
    }
    // under the line below the swell: the body (with the points of the line
    // while a strip meets it, so that the joints with the columns are shared)
    const fa = cy[0] - tilt * tx[0]
    const fb = cy[m] - tilt * tx[m]
    const cutLo = Math.min(fa, fb) - 0.01
    const cutHi = Math.max(fa, fb) + 0.01
    const first = strip(cutLo)
    for (let k = first; k < strips; k++) {
      const { ax, ay } = sc
      const f0 = vmin + k * FALL_BAND
      let n = 0
      if (f0 <= cutHi) {
        for (let i = 0; i <= m; i++) {
          ax[n] = tx[i]
          ay[n++] = cy[i]
        }
      } else {
        ax[n] = tx[0]
        ay[n++] = cy[0]
        ax[n] = tx[m]
        ay[n++] = cy[m]
      }
      ax[n] = tx[m]
      ay[n++] = br
      ax[n] = tx[0]
      ay[n++] = bl
      emit(n, k)
    }
    mesh.commit(prev)
  }

  /** Lowest screen y of the underside blocks (past it the fall fades). */
  private _undersideBottom = 0
  /** Runoff sheets of the island, painted at each tick. */
  private _sheets: Sheet[] = []

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
    this._backWalls?.destroy({ children: true })
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
    this._backWalls?.destroy({ children: true })
    this._sheets = []
    const root = new Container()
    root.label = "aux"
    const gf = new Container()
    root.addChild(gf)
    let z = 0
    const faceOf = (cell: Point, back: boolean) => {
      const base = toScreen(cell)
      const faces = back
        ? this._backFaces(cell).map((dir) => {
            const [a, b] = edgeOf(dir)
            return { dir, a, b, light: 1 }
          })
        : this._edgeFaces(cell)
      return faces.map((f) => {
        const { dir } = f
        const ends = [
          { x: cell.x + (dir.x - dir.y) / 2, y: cell.y + (dir.y + dir.x) / 2 },
          { x: cell.x + (dir.x + dir.y) / 2, y: cell.y + (dir.y - dir.x) / 2 },
        ]
        const [ga, gb] =
          project(ends[0].x, ends[0].y).x <= project(ends[1].x, ends[1].y).x
            ? ends
            : [ends[1], ends[0]]
        return {
          ...f,
          p: { x: base.x + f.a.x, y: base.y + f.a.y },
          q: { x: base.x + f.b.x, y: base.y + f.b.y },
          ga,
          gb,
        }
      })
    }
    // every water face on the island edge, with its tint (depth of its cell)
    interface Run {
      dir: Point
      lead: Point
      tail: Point
      glead: Point
      gtail: Point
      color: number
      depth: number
    }
    // the sides turned away from the viewer spill too: their sheets go
    // behind the island and only show below its silhouette
    const back = new Container()
    back.label = "aux"
    back.zIndex = UNDERSIDE_Z - 1
    const bgf = new Container()
    back.addChild(bgf)
    this._entities.addChild(back)
    this._backWalls = back
    const pending: { isBack: boolean; r: Run }[] = []
    for (const isBack of [false, true]) {
      const runs: Run[] = []
      for (const cell of this._board.cells) {
        z = Math.max(z, depthOf(cell, DEPTH.fighter + 1))
        if (cell.terrain !== "water") continue
        const { color } = waterTint(-cell.elevation)
        for (const { p, q, light, dir, ga, gb } of faceOf(cell, isBack)) {
          runs.push({
            dir,
            lead: p.x <= q.x ? p : q,
            tail: p.x <= q.x ? q : p,
            glead: ga,
            gtail: gb,
            color: shade(color, light < 1 ? 0.85 : 1),
            depth: -cell.elevation,
          })
        }
      }
      // contiguous faces of one side with the same tint make a single run
      const near = (a: Point, b: Point) =>
        Math.hypot(a.x - b.x, a.y - b.y) < 1.5
      const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y
      runs.sort((a, b) => a.lead.x - b.lead.x)
      const merged: Run[] = []
      for (const r of runs) {
        let m = merged.find((o) => same(o.dir, r.dir) && near(o.tail, r.lead))
        if (m) {
          m.tail = r.tail
          m.gtail = r.gtail
          continue
        }
        m = { ...r }
        merged.push(m)
      }
      for (const r of merged) pending.push({ isBack, r })
    }
    // every sheet drops by the same world height (so the same pixels at this
    // tilt): past the lowest underside block for the front ones
    const front = pending.filter((p) => !p.isBack)
    const drop =
      Math.max(
        FALL_TAIL,
        ...(front.length > 0 ? front : pending).map(
          ({ r }) => this._undersideBottom - Math.min(r.lead.y, r.tail.y),
        ),
      ) + FALL_TAIL
    for (const { isBack, r } of pending) {
      const { lead, tail, glead, gtail, color: tone } = r
      const sheet: Sheet = {
        mesh: new ColorMesh(1024, 3072),
        lead,
        tail,
        glead,
        gtail,
        tone,
        lighter: mix(tone, 0x4fb0ff, 0.55),
        drop,
      }
      this._paintSheet(sheet)
      this._sheets.push(sheet)
      ;(isBack ? bgf : gf).addChild(sheet.mesh)
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
    for (const node of parts.transient) node.destroy({ children: true })
    parts.transient = []
    parts.animated = []
    parts.swellAt = null
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
      // darker front edges (one stroke: a stroke is costly to build)
      for (const dir of SIDES) {
        if (project(dir.x, dir.y).y <= 0) continue
        const [a, b] = edgeOf(dir)
        g.moveTo(a.x, a.y + groundY).lineTo(b.x, b.y + groundY)
      }
      g.stroke({ width: 1, color: 0x000000, alpha: 0.25 })
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
    }
    const f = frontCorner()
    g.moveTo(f.x, f.y + topY)
      .lineTo(f.x, f.y + bottom)
      .stroke({ width: 1, color: 0x000000, alpha: 0.25 })
  }

  /** Sides of the cell on the island edge looking away from the viewer. */
  private _backFaces(cell: Point) {
    const seen = visibleFaces().map((f) => f.dir)
    return SIDES.filter(
      (d) =>
        !seen.some((o) => o.x === d.x && o.y === d.y) &&
        !this._board.inBounds(add(cell, d)),
    )
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
    const length = COLUMN_BOTTOM + this._depths[cell.y][cell.x] * BLOCK_HEIGHT
    const falls: Cascade[] = []
    const column = parts.column
    for (const { dir } of this._edgeFaces(cell)) {
      falls.push({ dir, length })
    }
    this._cascades.set(keyOf(cell), falls)
    // the surface swells with a slow wave (see _paintWater)
    parts.swellAt = { x: cell.x, y: cell.y, color: body }
    this._paintWater(parts)
    parts.water.position.set(column.x, column.y)
    this._bandFor(cell).addChild(parts.water)
  }

  /** Detaches and frees the cached decor of a cell (drawn again later). */
  private _forgetDecor(parts: CellParts) {
    const nodes: Container[] = [
      ...(parts.decor ?? []).map((d) => d.node),
      ...[...parts.vines.values()].flat().map((d) => d.node),
    ]
    for (const node of nodes) node.destroy({ children: true })
    parts.decor = null
    parts.vines.clear()
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

  /** Decor standing on a top: none, the tiles stay smooth. */
  private _drawDecor(_cell: Cell): DecorItem[] {
    return []
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
      // the strata of the column go on: its bottom band is `base - 1`
      const base = columnBands(cell.elevation)
      drawUndersideStack(
        blocks,
        origin,
        COLUMN_BOTTOM,
        depth,
        base,
        undefined,
        (d, k) => {
          const n = { x: cell.x + d.x, y: cell.y + d.y }
          return this._board.inBounds(n) && this._depths[n.y][n.x] > k
        },
      )
    }
    container.addChild(blocks)
    this._undersideBottom = blocks.getLocalBounds().maxY
    return container
  }
}

/** Scratch arrays of the runoff sheets (grown on demand, never freed). */
const sheetBuffers = {
  size: 0,
  tx: new Float64Array(0),
  ty: new Float64Array(0),
  cy: new Float64Array(0),
  ax: new Float64Array(0),
  ay: new Float64Array(0),
  bx: new Float64Array(0),
  by: new Float64Array(0),
  strips: 0,
  stripColor: new Int32Array(0),
  stripAlpha: new Float64Array(0),
}

function sheetScratch(points: number) {
  const b = sheetBuffers
  if (b.size < points) {
    b.size = points * 2
    b.tx = new Float64Array(b.size)
    b.ty = new Float64Array(b.size)
    b.cy = new Float64Array(b.size)
    // a clipped polygon has at most two more points than the original
    b.ax = new Float64Array(b.size + 8)
    b.ay = new Float64Array(b.size + 8)
    b.bx = new Float64Array(b.size + 8)
    b.by = new Float64Array(b.size + 8)
  }
  return b
}

function sheetStrips(count: number) {
  const b = sheetBuffers
  if (b.strips < count) {
    b.strips = count * 2
    b.stripColor = new Int32Array(b.strips)
    b.stripAlpha = new Float64Array(b.strips)
  }
  return b
}

/**
 * Keeps the part of a convex polygon (in `ax`, `ay`, `n` points) on one side
 * of the line y - tilt x = at, written in `bx`, `by`; returns its point count.
 */
function clipEdge(
  ax: Float64Array,
  ay: Float64Array,
  n: number,
  bx: Float64Array,
  by: Float64Array,
  tilt: number,
  at: number,
  above: boolean,
) {
  let out = 0
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1
    const fa = ay[i] - tilt * ax[i]
    const fb = ay[j] - tilt * ax[j]
    const ka = above ? fa >= at : fa <= at
    const kb = above ? fb >= at : fb <= at
    if (ka) {
      bx[out] = ax[i]
      by[out++] = ay[i]
    }
    if (ka !== kb) {
      const k = (at - fa) / (fb - fa)
      bx[out] = ax[i] + (ax[j] - ax[i]) * k
      by[out++] = ay[i] + (ay[j] - ay[i]) * k
    }
  }
  return out
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

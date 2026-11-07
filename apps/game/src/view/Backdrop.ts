import { Container, Graphics, Sprite, Texture } from "pixi.js"
import { softCircle, starDot } from "./effects"
import { drawFloatingIsland } from "./islands"
import {
  type Camera,
  camera,
  depthAlong,
  levelHeight,
  project,
  SKY,
  TILE_WIDTH,
} from "./theme"
import ViewChip from "./ViewChip"

/** A distant island of the Clair, floating at its own pace. */
export interface DistantIsland {
  node: Container
  graphics: Graphics
  cells: number
  seed: number
  /** Place around the board: direction (°), distance and height. */
  angle: number
  distance: number
  height: number
  /** Scale at a 1000 px high screen (smaller = farther). */
  size: number
  /** Floating period (ms) and amplitude (px). */
  period: number
  amplitude: number
  phase: number
}

/**
 * Distant islands, placed in the world around the board (not on the
 * screen): a direction on the ground (degrees, 0 = along the grid's x),
 * a distance (× RING_RADIUS) and a height (levels, negative = below).
 * The board's camera looks at them too, so they turn and tilt with it.
 * Each floats at its own period, between 5 and 13 s.
 */
const DISTANT = [
  {
    angle: 200,
    distance: 1,
    height: 3,
    size: 0.4,
    cells: 4,
    period: 7300,
    amplitude: 6,
  },
  {
    angle: 300,
    distance: 1.15,
    height: 5,
    size: 0.32,
    cells: 3,
    period: 9100,
    amplitude: 5,
  },
  {
    angle: 30,
    distance: 0.95,
    height: -3,
    size: 0.5,
    cells: 5,
    period: 11300,
    amplitude: 8,
  },
  {
    angle: 110,
    distance: 1.05,
    height: -2,
    size: 0.3,
    cells: 4,
    period: 5900,
    amplitude: 5,
  },
  {
    angle: 75,
    distance: 1.3,
    height: -4,
    size: 0.24,
    cells: 3,
    period: 12700,
    amplitude: 4,
  },
  {
    angle: 250,
    distance: 1.25,
    height: 1,
    size: 0.22,
    cells: 3,
    period: 8300,
    amplitude: 4,
  },
]

/** Distance of the distant islands from the board, in cells. */
export const RING_RADIUS = 12

/** A star, infinitely far: only the camera's turn and tilt move it. */
export interface Star {
  /** Direction: around (°) and above the horizon (°). */
  azimuth: number
  elevation: number
  radius: number
  alpha: number
  /** Where it is on the screen, and the length of its trail (px). */
  x: number
  y: number
  trail: number
}

/** A mote of light rising in the void around the board. */
export interface Mote {
  sprite: Sprite
  /** Place in the world: on the ground (cells) and height (levels). */
  gx: number
  gy: number
  height: number
  /** Rising speed (levels/s), sway (cells) and its phase. */
  speed: number
  sway: number
  phase: number
  size: number
  alpha: number
  /** Screen position at the previous frame (for the motion blur). */
  last: { x: number; y: number } | null
}

/** Points along a star trail (its arc), from the last view to this one. */
const TRAIL_STEPS = 4
/** How much the camera turns before the distant islands are redrawn (°). */
/**
 * Colour multiplying a distant island, from its depth towards the viewer
 * (-1 behind the board, 1 in front): the farther behind, the bluer and the
 * darker, mixed towards the sky rather than faded (no transparency).
 */
export function islandHaze(depth: number) {
  if (depth > 0) return 0xffffff
  const haze = Math.max(0, -depth)
  return mix(0xffffff, 0x5a5490, 0.55 + 0.45 * haze)
}

export const ISLAND_REDRAW_ANGLE = 0.6

/** Field of view across the screen's width, for the stars (°). */
export const SKY_FOV = 90

/** Camera of the sky: its turn around the vertical (°) and its tilt down (°). */
export interface SkyView {
  turn: number
  pitch: number
}

const DEG = Math.PI / 180

/**
 * Where a star is seen on the celestial vault, or null when it is behind
 * the camera. The camera turns around the world's vertical and looks down
 * by its tilt, with a perspective: as it turns, the stars go round the
 * pole along curves, as in a real sky.
 */
export function skyPoint(
  star: Pick<Star, "azimuth" | "elevation">,
  view: SkyView,
  width: number,
  height: number,
): { x: number; y: number } | null {
  // around: 0 is right behind the board, in the middle of the screen
  const around = (star.azimuth + view.turn + 90) * DEG
  const e = star.elevation * DEG
  const x = Math.cos(e) * Math.sin(around)
  const y = Math.sin(e)
  const z = Math.cos(e) * Math.cos(around)
  const p = view.pitch * DEG
  const up = y * Math.cos(p) + z * Math.sin(p)
  const forward = -y * Math.sin(p) + z * Math.cos(p)
  if (forward < 0.05) return null
  const f = width / 2 / Math.tan((SKY_FOV / 2) * DEG)
  return {
    x: width / 2 + (f * x) / forward,
    y: height / 2 - (f * up) / forward,
  }
}
/** Motes live between these heights (levels), then start again below. */
const MOTE_HEIGHT = 40
/** Zoom at which the stars and motes start to fade, and are all gone. */
export const DETAIL_ZOOM = { from: 1.2, to: 2.2 }

/**
 * How much of the sky's detail (stars, motes) is shown at a zoom, from 1
 * to 0: closer, the board fills the screen and the lens blurs the rest,
 * so they cost without being seen.
 */
export function skyDetail(zoom: number) {
  const t = (zoom - DETAIL_ZOOM.from) / (DETAIL_ZOOM.to - DETAIL_ZOOM.from)
  const u = Math.min(1, Math.max(0, t))
  return 1 - u * u * (3 - 2 * u)
}

/** A jump bigger than this (× width) is a cut: no trail. */
const CUT = 0.25

/**
 * Background: a deep sky gradient, twinkling stars and slow rising motes
 * of light (the void between the shattered fragments, infinitely far),
 * and distant islands around the board, seen by the board's camera.
 */
export default class Backdrop extends ViewChip {
  private _sky!: Sprite
  /**
   * The stars: sprites (a dot each, and a stretched square per piece of
   * trail), made once, only moved and faded after (hidden: transparent).
   * Drawing them as shapes would rebuild a thousand shapes at each move
   * of the camera, and adding or hiding sprites rebuilds the render list.
   */
  private _stars!: Container
  /** The sprites of each star (same order as the list). */
  private _starSprites: { dot: Sprite; pieces: Sprite[] }[] = []
  private _motes: Mote[] = []
  private _starList: Star[] = []
  /** Indices of the stars drawn last frame (their sprites are lit). */
  private _lit: number[] = []
  private _trig: Float64Array | null = null
  private readonly _pathX = new Float64Array(TRAIL_STEPS + 1)
  private readonly _pathY = new Float64Array(TRAIL_STEPS + 1)
  /** Sky angle and tilt of the camera when the stars were last drawn. */
  private _skyView: SkyView | null = null
  private _starsDirty = true
  private _detail = 1
  private _zoom = 1
  private _islands: DistantIsland[] = []
  private _time = 0
  private _width = 0
  private _height = 0
  private _layer!: Container
  /** Islands nearer than the board: the scene puts it above the board. */
  private _front!: Container
  /** Camera the distant islands were last drawn with. */
  private _drawn: Camera | null = null
  /** Screen point the camera looks at (the middle of the board). */
  private _focus: { x: number; y: number } | null = null

  protected _onActivate() {
    this._sky = new Sprite(Backdrop.gradient())
    this._stars = new Container()
    // its own render group: its sprites never touch the rest of the scene
    this._stars.isRenderGroup = true
    this._container.addChild(this._sky, this._stars)
    // the stars all around, more than the screen ever shows at once
    for (let i = 0; i < 1100; i++) {
      const u = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)
      const v = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1)
      this._starList.push({
        azimuth: u * 360,
        // evenly spread over the whole sphere
        elevation: Math.asin(v * 2 - 1) / DEG,
        radius: i % 9 === 0 ? 1.4 : 0.8,
        alpha: i % 5 === 0 ? 0.8 : 0.4,
        x: 0,
        y: 0,
        trail: 0,
      })
    }
    for (const _ of this._starList) {
      const dot = new Sprite(starDot())
      dot.anchor.set(0.5)
      const pieces: Sprite[] = []
      for (let k = 0; k < TRAIL_STEPS; k++) {
        const piece = new Sprite(Texture.WHITE)
        piece.anchor.set(0, 0.5)
        pieces.push(piece)
      }
      dot.alpha = 0
      for (const piece of pieces) piece.alpha = 0
      this._stars.addChild(dot, ...pieces)
      this._starSprites.push({ dot, pieces })
    }

    // distant islands of the Clair, blued by the distance
    this._layer = new Container()
    this._front = new Container()
    this._front.eventMode = "none"
    this._container.addChild(this._layer, this._front)
    const seed = Math.floor(Math.random() * 1e6)
    DISTANT.forEach((spec, i) => {
      const node = new Container()
      const graphics = new Graphics()
      node.addChild(graphics)
      this._layer.addChild(node)
      this._islands.push({
        ...spec,
        node,
        graphics,
        seed: seed + i * 101,
        phase: (i * Math.PI * 2) / DISTANT.length,
      })
    })
    this._drawIslands()

    // motes of light, in the void around the board
    for (let i = 0; i < 48; i++) {
      const sprite = new Sprite(softCircle())
      sprite.anchor.set(0.5)
      sprite.blendMode = "add"
      sprite.tint = [0xb197fc, 0x63e6be, 0xffffff, 0x74c0fc][i % 4]
      this._layer.addChildAt(sprite, 0)
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * RING_RADIUS * 1.4
      this._motes.push({
        sprite,
        gx: Math.cos(a) * r,
        gy: Math.sin(a) * r,
        height: (Math.random() * 2 - 1) * MOTE_HEIGHT,
        speed: 0.4 + Math.random() * 1,
        sway: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        size: (3 + Math.random() * 6) / 64,
        alpha: 0.3 + Math.random() * 0.4,
        last: null,
      })
    }
  }

  /** Vertical sky gradient (top to bottom). */
  static gradient(): Texture {
    const canvas = document.createElement("canvas")
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext("2d")!
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    const css = (c: number) => `#${c.toString(16).padStart(6, "0")}`
    g.addColorStop(0, css(SKY[0]))
    g.addColorStop(0.55, css(SKY[1]))
    g.addColorStop(1, css(SKY[2]))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 2, 256)
    return Texture.from(canvas)
  }

  protected _onResize(width: number, height: number) {
    this._width = width
    this._height = height
    this._sky.width = width
    this._sky.height = height
    this._starsDirty = true
    for (const mote of this._motes) mote.last = null
    this._placeIslands()
  }

  /** The distant islands (for tests and the title screen). */
  get islands(): readonly DistantIsland[] {
    return this._islands
  }

  /**
   * The screen point the camera looks at (the middle of the board); the
   * distant islands are around it. Defaults to the middle of the screen.
   */
  set focus(point: { x: number; y: number } | null) {
    this._focus = point ? { ...point } : null
    this._placeIslands()
  }

  protected _onTerminate() {
    // the scene may have taken it
    this._front.destroy({ children: true })
  }

  /**
   * The islands nearer to the camera than the board: the scene adds this
   * layer above the board, so they pass in front of it.
   */
  get front(): Container {
    return this._front
  }

  /** Opacity of the distant islands (they fade with the board's turns). */
  set islandsAlpha(alpha: number) {
    this._layer.alpha = alpha
    this._front.alpha = alpha
  }

  get islandsAlpha() {
    return this._layer.alpha
  }

  /** The stars (for tests). */
  get stars(): readonly Star[] {
    return this._starList
  }

  /** The motes of light (for tests). */
  get motes(): readonly Mote[] {
    return this._motes
  }

  /**
   * How close the camera came (as the board's zoom): the islands and motes
   * are bigger and spread farther, the stars (infinitely far) don't move.
   */
  set zoom(value: number) {
    this._zoom = value
    this._detail = skyDetail(value)
    this._placeIslands()
  }

  /** Share of the stars and motes shown (1: all, 0: none), from the zoom. */
  get detail() {
    return this._detail
  }

  get zoom() {
    return this._zoom
  }

  /** Screen point the camera looks at, and pixels per world pixel. */
  private _view() {
    const focus = this._focus ?? { x: this._width / 2, y: this._height / 2 }
    // the ring spans about two thirds of the screen's width
    const cell = TILE_WIDTH / Math.SQRT2
    const k = ((0.33 * this._width) / (RING_RADIUS * cell)) * this._zoom
    return { focus, k }
  }

  /**
   * The stars where the camera sees them; when it moves, each leaves a
   * trail along the arc it went (motion blur).
   */
  private _drawStars() {
    const sky: SkyView = {
      turn: 45 + 90 * camera.quarter + camera.yaw,
      pitch: camera.pitch,
    }
    const last = this._skyView ?? sky
    const moved = last.turn !== sky.turn || last.pitch !== sky.pitch
    if (!moved && !this._starsDirty) return
    this._skyView = sky
    this._starsDirty = moved
    // a jump (a quarter turn while the board is hidden): no trail
    const cut =
      Math.abs(sky.turn - last.turn) > 30 ||
      Math.abs(sky.pitch - last.pitch) > 30
    const w = this._width
    const h = this._height
    // the trail follows the arc: a few steps between the two views
    const steps = cut || !moved ? 0 : TRAIL_STEPS
    const views: SkyView[] = []
    for (let i = 0; i <= steps; i++) {
      const t = steps ? i / steps : 1
      views.push({
        turn: last.turn + (sky.turn - last.turn) * t,
        pitch: last.pitch + (sky.pitch - last.pitch) * t,
      })
    }
    const margin = 20
    // per view: the trigonometry shared by all the stars
    const f = w / 2 / Math.tan((SKY_FOV / 2) * DEG)
    const viewTrig = views.map((view) => {
      const t = (view.turn + 90) * DEG
      const p = view.pitch * DEG
      return {
        ct: Math.cos(t),
        st: Math.sin(t),
        cp: Math.cos(p),
        sp: Math.sin(p),
      }
    })
    const trig = this._starTrig()
    // no allocation per star: thousands of them, every frame
    const px = this._pathX
    const py = this._pathY
    // only the sprites lit last frame need to be put out
    for (const index of this._lit) {
      const { dot, pieces } = this._starSprites[index]
      dot.alpha = 0
      for (const piece of pieces) piece.alpha = 0
    }
    const lit: number[] = []
    const stars = this._starList
    for (let index = 0; index < stars.length; index++) {
      const star = stars[index]
      const o = index * 4
      const sa = trig[o]
      const ca = trig[o + 1]
      const se = trig[o + 2]
      const ce = trig[o + 3]
      let n = 0
      let seen = false
      for (const v of viewTrig) {
        const sinA = sa * v.ct + ca * v.st
        const cosA = ca * v.ct - sa * v.st
        const x = ce * sinA
        const z = ce * cosA
        const up = se * v.cp + z * v.sp
        const forward = -se * v.sp + z * v.cp
        if (forward < 0.05) continue
        const sx = w / 2 + (f * x) / forward
        const sy = h / 2 - (f * up) / forward
        px[n] = sx
        py[n] = sy
        n++
        if (sx > -margin && sx < w + margin && sy > -margin && sy < h + margin)
          seen = true
      }
      star.trail = 0
      if (n === 0) {
        star.x = Number.NaN
        star.y = Number.NaN
        continue
      }
      star.x = px[n - 1]
      star.y = py[n - 1]
      for (let i = 1; i < n; i++)
        star.trail += Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1])
      if (star.trail < 0.5) star.trail = 0
      if (!seen) continue
      const { dot, pieces } = this._starSprites[index]
      lit.push(index)
      const width = star.radius * 2
      // the same light spread along the trail
      const alpha =
        star.trail === 0
          ? star.alpha
          : star.alpha * Math.max(0.35, (width * 2) / (width * 2 + star.trail))
      dot.position.set(star.x, star.y)
      dot.width = dot.height = width
      dot.alpha = alpha
      // the trail along the arc, piece by piece
      for (let i = 1; i < n; i++) {
        const dx = px[i] - px[i - 1]
        const dy = py[i] - py[i - 1]
        const length = Math.hypot(dx, dy)
        if (length < 0.01) continue
        const piece = pieces[i - 1]
        piece.position.set(px[i - 1], py[i - 1])
        piece.rotation = Math.atan2(dy, dx)
        piece.width = length
        piece.height = width
        piece.alpha = alpha
      }
    }
    this._lit = lit
  }

  /** Sine and cosine of each star's azimuth and elevation, computed once. */
  private _starTrig() {
    if (this._trig?.length !== this._starList.length * 4) {
      const trig = new Float64Array(this._starList.length * 4)
      this._starList.forEach((star, index) => {
        trig[index * 4] = Math.sin(star.azimuth * DEG)
        trig[index * 4 + 1] = Math.cos(star.azimuth * DEG)
        trig[index * 4 + 2] = Math.sin(star.elevation * DEG)
        trig[index * 4 + 3] = Math.cos(star.elevation * DEG)
      })
      this._trig = trig
    }
    return this._trig
  }

  /**
   * The motes rise in the world around the board, seen by the camera:
   * stretched along their screen motion (motion blur).
   */
  private _placeMotes(dt: number) {
    const { focus, k } = this._view()
    const lh = levelHeight()
    // closer, fewer motes: the last ones go first, then fade out
    const shown = this._motes.length * this._detail
    for (const [index, mote] of this._motes.entries()) {
      const fade = Math.min(1, Math.max(0, shown - index))
      mote.sprite.visible = fade > 0
      if (fade === 0) {
        mote.last = null
        continue
      }
      mote.height += mote.speed * dt
      if (mote.height > MOTE_HEIGHT) {
        mote.height -= MOTE_HEIGHT * 2
        mote.last = null
      }
      const sway = Math.sin(this._time * 0.7 + mote.phase) * mote.sway
      const o = project(mote.gx + sway, mote.gy - sway)
      const x = focus.x + o.x * k
      const y = focus.y + (o.y - mote.height * lh) * k
      const last = mote.last ?? { x, y }
      mote.last = { x, y }
      const dx = x - last.x
      const dy = y - last.y
      let length = Math.hypot(dx, dy)
      if (length > this._width * CUT) length = 0
      const { sprite } = mote
      sprite.position.set(x - dx / 2, y - dy / 2)
      // the soft circle is 64 px wide: stretched by the distance covered
      const size = mote.size * this._zoom
      const diameter = size * 64
      sprite.rotation = length > 0.5 ? Math.atan2(dy, dx) : 0
      sprite.scale.set(size * (1 + length / diameter), size)
      sprite.alpha = mote.alpha * fade * (diameter / (diameter + length * 0.5))
    }
  }

  /**
   * Draws the islands again when the camera moved enough to be seen (far
   * and small, they need less than the board).
   */
  private _drawIslands() {
    const drawn = this._drawn
    if (
      drawn &&
      drawn.quarter === camera.quarter &&
      Math.abs(drawn.pitch - camera.pitch) < ISLAND_REDRAW_ANGLE &&
      Math.abs(drawn.yaw - camera.yaw) < ISLAND_REDRAW_ANGLE
    )
      return
    this._drawn = { ...camera }
    for (const island of this._islands) {
      island.graphics.clear()
      drawFloatingIsland(island.graphics, island.cells, island.seed, camera)
    }
  }

  /** Where the camera sees each island, and how big (nearer = bigger). */
  private _placeIslands() {
    if (!this._layer) return
    const ms = this._time * 1000
    const { focus, k } = this._view()
    const order: { island: DistantIsland; depth: number }[] = []
    for (const island of this._islands) {
      const a = (island.angle * Math.PI) / 180
      const r = RING_RADIUS * island.distance
      const p = { x: Math.cos(a) * r, y: Math.sin(a) * r }
      const o = project(p.x, p.y)
      const lift = island.height * levelHeight()
      // towards the viewer, from -1 (behind the board) to 1 (in front)
      const depth = depthAlong(p) / (r * Math.SQRT2)
      const bob =
        Math.sin((ms / island.period) * Math.PI * 2 + island.phase) *
        island.amplitude
      island.node.position.set(
        focus.x + o.x * k,
        focus.y + (o.y - lift) * k + bob,
      )
      island.node.scale.set(
        island.size * (this._height / 1000) * (1 + 0.25 * depth) * this._zoom,
      )
      // atmospheric perspective: behind the board, the farther, the bluer
      // and the darker; in front of it, as solid and as lit as the board.
      // Opaque, haze baked into the colours: a translucent island would show
      // its own blocks through each other
      island.node.alpha = 1
      island.graphics.tint = islandHaze(depth)
      order.push({ island, depth })
    }
    // the farther behind, the earlier drawn; nearer than the board: above it
    order.sort((a, b) => a.depth - b.depth)
    const count = new Map<Container, number>([
      [this._layer, this._motes.length],
    ])
    for (const { island, depth } of order) {
      const layer = depth > 0 ? this._front : this._layer
      const index = count.get(layer) ?? 0
      count.set(layer, index + 1)
      if (island.node.parent !== layer) layer.addChildAt(island.node, index)
      else if (layer.getChildIndex(island.node) !== index)
        layer.setChildIndex(island.node, index)
    }
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick / 1000
    this._time += dt
    const detail = this._detail
    this._stars.alpha = (0.75 + 0.25 * Math.sin(this._time * 0.8)) * detail
    this._drawIslands()
    this._placeIslands()
    if (detail > 0) {
      this._stars.visible = true
      this._drawStars()
    } else if (this._stars.visible) {
      // gone: not drawn nor computed; back from where the camera is then
      this._stars.visible = false
      this._skyView = null
      this._starsDirty = true
    }
    this._placeMotes(dt)
  }
}

/** Linear mix of two colors (t = 0: a, t = 1: b). */
function mix(a: number, b: number, t: number) {
  const channel = (shift: number) => {
    const x = (a >> shift) & 0xff
    const y = (b >> shift) & 0xff
    return Math.round(x + (y - x) * t) << shift
  }
  return channel(16) | channel(8) | channel(0)
}

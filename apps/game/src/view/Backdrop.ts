import { Container, Graphics, Sprite, Texture } from "pixi.js"
import { softCircle } from "./effects"
import { drawFloatingIsland } from "./islands"
import {
  type Camera,
  camera,
  depthAlong,
  levelHeight,
  project,
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

interface Mote {
  sprite: Sprite
  speed: number
  sway: number
  phase: number
}

/**
 * Background: a deep sky gradient, twinkling stars and slow rising motes
 * of light (the void between the shattered fragments, infinitely far),
 * and distant islands around the board, seen by the board's camera.
 */
export default class Backdrop extends ViewChip {
  private _sky!: Sprite
  private _stars!: Graphics
  private _motes: Mote[] = []
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
    this._stars = new Graphics()
    this._container.addChild(this._sky, this._stars)

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

    for (let i = 0; i < 40; i++) {
      const sprite = new Sprite(softCircle())
      sprite.anchor.set(0.5)
      sprite.blendMode = "add"
      sprite.tint = [0xb197fc, 0x63e6be, 0xffffff, 0x74c0fc][i % 4]
      sprite.scale.set((3 + Math.random() * 6) / 64)
      sprite.alpha = 0.3 + Math.random() * 0.4
      this._container.addChild(sprite)
      this._motes.push({
        sprite,
        speed: 6 + Math.random() * 14,
        sway: 6 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
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
    g.addColorStop(0, "#0b0918")
    g.addColorStop(0.55, "#1d1438")
    g.addColorStop(1, "#2b1b4a")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 2, 256)
    return Texture.from(canvas)
  }

  protected _onResize(width: number, height: number) {
    this._width = width
    this._height = height
    this._sky.width = width
    this._sky.height = height
    this._stars.clear()
    for (let i = 0; i < 140; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1
      const y = (Math.sin(i * 78.233) * 12345.678) % 1
      this._stars
        .circle(
          Math.abs(x) * width,
          Math.abs(y) * height,
          i % 9 === 0 ? 1.4 : 0.8,
        )
        .fill({ color: 0xffffff, alpha: i % 5 === 0 ? 0.8 : 0.4 })
    }
    for (const mote of this._motes) {
      mote.sprite.position.set(Math.random() * width, Math.random() * height)
    }
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

  /** Draws the islands again when the camera moved. */
  private _drawIslands() {
    const drawn = this._drawn
    if (
      drawn &&
      drawn.quarter === camera.quarter &&
      drawn.pitch === camera.pitch &&
      drawn.yaw === camera.yaw
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
    const focus = this._focus ?? { x: this._width / 2, y: this._height / 2 }
    // the ring spans about two thirds of the screen's width
    const cell = TILE_WIDTH / Math.SQRT2
    const k = (0.33 * this._width) / (RING_RADIUS * cell)
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
        island.size * (this._height / 1000) * (1 + 0.25 * depth),
      )
      // atmospheric perspective: behind the board, the farther, the bluer
      // and the paler; in front of it, as solid and as lit as the board
      const haze = Math.max(0, -depth)
      island.node.alpha = depth > 0 ? 1 : 0.85 - 0.3 * haze
      island.graphics.tint = mix(
        0xffffff,
        0x8f86c4,
        depth > 0 ? 0 : 0.4 + 0.6 * haze,
      )
      order.push({ island, depth })
    }
    // the farther behind, the earlier drawn; nearer than the board: above it
    order.sort((a, b) => a.depth - b.depth)
    const count = new Map<Container, number>()
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
    this._stars.alpha = 0.75 + 0.25 * Math.sin(this._time * 0.8)
    this._drawIslands()
    this._placeIslands()
    for (const mote of this._motes) {
      mote.sprite.y -= mote.speed * dt
      mote.sprite.x += Math.sin(this._time + mote.phase) * mote.sway * dt
      if (mote.sprite.y < -10) {
        mote.sprite.y = this._height + 10
        mote.sprite.x = Math.random() * this._width
      }
    }
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

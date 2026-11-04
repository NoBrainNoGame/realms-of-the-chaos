import { Container, Graphics, Sprite, Texture } from "pixi.js"
import { softCircle } from "./effects"
import { drawFloatingIsland } from "./islands"
import ViewChip from "./ViewChip"

/** A distant island of the Clair, floating at its own pace. */
export interface DistantIsland {
  node: Container
  /** Position as a fraction of the screen. */
  fx: number
  fy: number
  /** Scale at a 1000 px high screen (smaller = farther). */
  size: number
  /** Floating period (ms) and amplitude (px). */
  period: number
  amplitude: number
  phase: number
}

/**
 * Distant islands: where they sit on the screen, how big (far = small)
 * and how they float (each at its own period, between 5 and 13 s).
 */
const DISTANT = [
  { fx: 0.07, fy: 0.6, size: 0.4, cells: 4, period: 7300, amplitude: 6 },
  { fx: 0.93, fy: 0.5, size: 0.32, cells: 3, period: 9100, amplitude: 5 },
  { fx: 0.85, fy: 0.86, size: 0.5, cells: 5, period: 11300, amplitude: 8 },
  { fx: 0.3, fy: 0.94, size: 0.3, cells: 4, period: 5900, amplitude: 5 },
  { fx: 0.62, fy: 0.97, size: 0.24, cells: 3, period: 12700, amplitude: 4 },
]

interface Mote {
  sprite: Sprite
  speed: number
  sway: number
  phase: number
}

/**
 * Screen-space background: a deep sky gradient, twinkling stars and slow
 * rising motes of light (the void between the shattered fragments).
 */
export default class Backdrop extends ViewChip {
  private _sky!: Sprite
  private _stars!: Graphics
  private _motes: Mote[] = []
  private _islands: DistantIsland[] = []
  private _time = 0
  private _width = 0
  private _height = 0

  protected _onActivate() {
    this._sky = new Sprite(Backdrop.gradient())
    this._stars = new Graphics()
    this._container.addChild(this._sky, this._stars)

    // distant islands of the Clair, blued by the distance
    const seed = Math.floor(Math.random() * 1e6)
    DISTANT.forEach((spec, i) => {
      const node = new Container()
      const g = new Graphics()
      drawFloatingIsland(g, spec.cells, seed + i * 101)
      // atmospheric perspective: the farther, the bluer and the paler
      g.tint = 0x8f86c4
      node.alpha = 0.55 + spec.size * 0.6
      node.addChild(g)
      this._container.addChild(node)
      this._islands.push({
        node,
        fx: spec.fx,
        fy: spec.fy,
        size: spec.size,
        period: spec.period,
        amplitude: spec.amplitude,
        phase: (i * Math.PI * 2) / DISTANT.length,
      })
    })

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
    for (const island of this._islands) {
      island.node.scale.set(island.size * (height / 1000))
    }
    this._placeIslands()
  }

  /** The distant islands (for tests and the title screen). */
  get islands(): readonly DistantIsland[] {
    return this._islands
  }

  private _placeIslands() {
    const ms = this._time * 1000
    for (const island of this._islands) {
      const bob =
        Math.sin((ms / island.period) * Math.PI * 2 + island.phase) *
        island.amplitude
      island.node.position.set(
        island.fx * this._width,
        island.fy * this._height + bob,
      )
    }
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick / 1000
    this._time += dt
    this._stars.alpha = 0.75 + 0.25 * Math.sin(this._time * 0.8)
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

import { Graphics, Sprite, Texture } from "pixi.js"
import { softCircle } from "./effects"
import ViewChip from "./ViewChip"

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
  private _time = 0
  private _width = 0
  private _height = 0

  protected _onActivate() {
    this._sky = new Sprite(Backdrop.gradient())
    this._stars = new Graphics()
    this._container.addChild(this._sky, this._stars)

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
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick / 1000
    this._time += dt
    this._stars.alpha = 0.75 + 0.25 * Math.sin(this._time * 0.8)
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

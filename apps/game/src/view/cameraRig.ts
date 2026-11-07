import * as booyah from "@ghom/booyah"
import type { Point } from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import type Backdrop from "./Backdrop"
import {
  type Camera,
  COLORS,
  camera,
  ISO,
  ISO_PITCH,
  levelHeight,
  MAX_PITCH,
  MAX_YAW,
  toScreen,
  unproject,
} from "./theme"

/** Zoom bounds, relative to the board fitted to the screen. */
export const MIN_ZOOM = 0.6
export const MAX_ZOOM = 3
/** From this zoom, a quarter turn keeps the cell looked at in the middle. */
export const FOLLOW_ZOOM = 1.25
/** Length of a quarter turn of the camera (ms). */
export const TURN_DURATION = 420

export interface CameraHost {
  world: Container
  backdrop: Backdrop
  board: {
    width: number
    height: number
    get(p: Point): { elevation: number } | undefined
  }
  /** Camera input is allowed now. */
  allows(): boolean
  /** The pointer is over the board (a drag then pans). */
  onBoard(): boolean
  /** The quarter, tilt or small turn changed: draw everything again. */
  redraw(): void
  /** The world was placed (lens, arrows...). */
  placed(): void
}

/**
 * The camera of a board scene (fights and walks): zoom around a point, pan,
 * tilt and small turns, quarter turns, the keys and the mouse gestures. The
 * host draws; the rig only moves the `camera` and places the world.
 */
export class CameraRig {
  /** Fit-to-screen transform of the board (before the player's zoom). */
  fit = { scale: 1, x: 0, y: 0, width: 1, height: 1 }
  /** Player's zoom (1 = fit), its eased target, and the screen pan. */
  zoom = { value: 1, target: 1, anchor: { x: 0, y: 0 } }
  pan = { x: 0, y: 0 }
  /** Tilt and small rotation the camera eases to. */
  aim = { pitch: ISO_PITCH, yaw: 0 }
  /** Camera last drawn (the board is redrawn when it changes). */
  drawn: Camera = { ...ISO }
  turn: {
    dir: 1 | -1
    /** Quarter reached at the middle of the turn. */
    to: number
    elapsed: number
    yaw: number
    swapped: boolean
    /** Zoomed in: the point of the board kept in the middle of the screen. */
    follow: { x: number; y: number; elevation: number } | null
  } | null = null
  drag: {
    button: number
    /** On the board (zoomed in): moves the camera; elsewhere: turns it. */
    kind: "pan" | "turn"
    x: number
    y: number
    pitch: number
    yaw: number
    pan: { x: number; y: number }
    moved: boolean
  } | null = null

  constructor(private readonly _host: CameraHost) {}

  /** Tilts (degrees, from the classic view to almost top-down) and turns. */
  aimCamera(pitch: number, yaw: number) {
    this.aim = {
      pitch: Math.min(MAX_PITCH, Math.max(ISO_PITCH, pitch)),
      yaw: Math.min(MAX_YAW, Math.max(-MAX_YAW, yaw)),
    }
  }

  /**
   * Turns the board a quarter (1: clockwise): a small turn out while the
   * board fades, the quarter, then a small turn back while it comes back.
   */
  turnCamera(dir: 1 | -1) {
    if (this.turn) return
    const to = (camera.quarter + dir + 4) % 4
    this.turn = {
      dir,
      to,
      elapsed: 0,
      yaw: camera.yaw,
      swapped: false,
      // close enough, the camera keeps facing the cell it looks at
      follow: this.zoom.target >= FOLLOW_ZOOM ? this.lookedAt() : null,
    }
  }

  /** Back to the classic view (the zoom too). */
  resetView() {
    this.aim = { pitch: ISO_PITCH, yaw: 0 }
    if (camera.quarter !== 0 && !this.turn) {
      const dir = camera.quarter === 3 ? 1 : -1
      this.turn = {
        dir,
        to: 0,
        elapsed: 0,
        yaw: camera.yaw,
        swapped: false,
        follow: null,
      }
    }
    this.zoom.target = 1
    this.zoom.anchor = { x: this.fit.width / 2, y: this.fit.height / 2 }
  }

  /** Q, E and V; true when the key was a camera key. */
  key(e: { key: string }): boolean {
    if (!"qQeEvV".includes(e.key) || e.key.length !== 1) return false
    if (!this._host.allows()) return true
    if (e.key === "q" || e.key === "Q") this.turnCamera(-1)
    else if (e.key === "e" || e.key === "E") this.turnCamera(1)
    else this.resetView()
    return true
  }

  pointerDown(e: PointerEvent) {
    if (e.button !== 1 && e.button !== 2) return
    // grabbing the board moves the camera, unless zoomed out to the most
    const zoomedOut = this.zoom.target <= MIN_ZOOM + 1e-3
    this.drag = {
      button: e.button,
      kind: this._host.onBoard() && !zoomedOut ? "pan" : "turn",
      x: e.clientX ?? 0,
      y: e.clientY ?? 0,
      pitch: this.aim.pitch,
      yaw: this.aim.yaw,
      pan: { ...this.pan },
      moved: false,
    }
  }

  pointerMove(e: PointerEvent) {
    const drag = this.drag
    if (!drag) return
    const dx = (e.clientX ?? 0) - drag.x
    const dy = (e.clientY ?? 0) - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < 5) return
    if (!this._host.allows()) return
    drag.moved = true
    if (drag.kind === "pan") {
      this.zoom.target = this.zoom.value
      // free while held: past the limit, it eases back once let go
      this.pan = { x: drag.pan.x + dx, y: drag.pan.y + dy }
      return
    }
    // dragging down looks from higher, sideways turns the board a little
    this.aimCamera(drag.pitch + dy * 0.2, drag.yaw - dx * 0.1)
  }

  /** The drag the button ends (null: none), forgotten. */
  pointerUp(e: PointerEvent) {
    const drag = this.drag
    if (!drag || e.button !== drag.button) return null
    this.drag = null
    return drag
  }

  wheel(e: WheelEvent) {
    e.preventDefault()
    if (!this._host.allows()) return
    // a trackpad pinch comes as a wheel with ctrl, in small steps
    const steps = -e.deltaY / (e.ctrlKey ? 25 : 100)
    this.zoomAt(
      {
        x: e.clientX ?? this.fit.width / 2,
        y: e.clientY ?? this.fit.height / 2,
      },
      steps,
    )
  }

  /** Zooms in (positive steps) or out around a screen point. */
  zoomAt(screen: { x: number; y: number }, steps: number) {
    const target = this.zoom.target * 1.15 ** steps
    this.zoom.target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target))
    this.zoom.anchor = { ...screen }
  }

  /** Eases everything one tick (no placing: see `place`). */
  update(dt: number) {
    this._updateCamera(dt)
    this._updateZoom(dt)
    this._settlePan(dt)
    if (this.turn?.follow) this.keepInMiddle(this.turn.follow)
  }

  private _updateCamera(dt: number) {
    if (this.turn) this._updateTurn(dt)
    else {
      const k = 1 - Math.exp(-dt / 60)
      for (const key of ["pitch", "yaw"] as const) {
        const target = this.aim[key]
        camera[key] += (target - camera[key]) * k
        if (Math.abs(camera[key] - target) < 0.05) camera[key] = target
      }
    }
    const drawn = this.drawn
    if (
      drawn.quarter === camera.quarter &&
      drawn.pitch === camera.pitch &&
      drawn.yaw === camera.yaw
    )
      return
    this.drawn = { ...camera }
    this._host.redraw()
  }

  /** Small turn out and fade, the quarter, small turn back and show. */
  private _updateTurn(dt: number) {
    const turn = this.turn!
    const world = this._host.world
    turn.elapsed += dt
    const half = TURN_DURATION / 2
    const swing = 20 * turn.dir
    if (!turn.swapped && turn.elapsed >= half) {
      turn.swapped = true
      camera.quarter = turn.to
    }
    if (turn.elapsed < half) {
      const u = booyah.easeInCubic(turn.elapsed / half)
      camera.yaw = turn.yaw + swing * u
      world.alpha = 1 - 0.85 * u
    } else {
      const u = booyah.easeOutCubic(Math.min(1, (turn.elapsed - half) / half))
      camera.yaw = this.aim.yaw - swing * (1 - u)
      world.alpha = 0.15 + 0.85 * u
    }
    if (turn.elapsed >= TURN_DURATION) {
      camera.yaw = this.aim.yaw
      world.alpha = 1
      this.turn = null
    }
    // the distant islands vanish while the quarter changes (they jump)
    this._host.backdrop.islandsAlpha = (world.alpha - 0.15) / 0.85
  }

  /** Eases the zoom to its target, keeping the anchor point still. */
  private _updateZoom(dt: number) {
    const zoom = this.zoom
    if (zoom.value === zoom.target) return
    const before = this._host.world.scale.x
    const { x: ax, y: ay } = zoom.anchor
    const wx = (ax - this.fit.x - this.pan.x) / before
    const wy = (ay - this.fit.y - this.pan.y) / before
    const k = 1 - Math.exp(-dt / 90)
    zoom.value += (zoom.target - zoom.value) * k
    if (Math.abs(zoom.value - zoom.target) < 0.002) zoom.value = zoom.target
    const after = this.fit.scale * zoom.value
    this.pan.x = ax - wx * after - this.fit.x
    this.pan.y = ay - wy * after - this.fit.y
    this.clampPan()
  }

  /**
   * The point of the board seen in the middle of the screen: on the ground
   * of the cell there (its elevation), on the board's edge if outside.
   */
  lookedAt(): { x: number; y: number; elevation: number } {
    const scale = this.fit.scale * this.zoom.value
    const sx = (this.fit.width / 2 - this.fit.x - this.pan.x) / scale
    const sy = (this.fit.height / 2 - this.fit.y - this.pan.y) / scale
    const board = this._host.board
    let elevation = 0
    let p = unproject(sx, sy)
    // the ground stands at its cell's height: a few steps settle it
    for (let i = 0; i < 4; i++) {
      p = unproject(sx, sy + elevation * levelHeight())
      p = {
        x: Math.min(board.width - 0.5, Math.max(-0.5, p.x)),
        y: Math.min(board.height - 0.5, Math.max(-0.5, p.y)),
      }
      const cell = board.get({ x: Math.round(p.x), y: Math.round(p.y) })
      elevation = cell ? cell.elevation : 0
    }
    return { ...p, elevation }
  }

  /** Moves the camera so a point of the board is in the middle. */
  keepInMiddle(p: { x: number; y: number; elevation: number }) {
    const scale = this.fit.scale * this.zoom.value
    const o = toScreen(p, p.elevation)
    this.pan.x = this.fit.width / 2 - this.fit.x - o.x * scale
    this.pan.y = this.fit.height / 2 - this.fit.y - o.y * scale
    this.clampPan()
  }

  /** Let go past the limit: the board eases back to it. */
  private _settlePan(dt: number) {
    if (this.drag?.kind === "pan" && this.drag.moved) return
    const free = { ...this.pan }
    this.clampPan()
    const limit = { ...this.pan }
    const k = 1 - Math.exp(-dt / 90)
    for (const key of ["x", "y"] as const) {
      const gap = free[key] - limit[key]
      this.pan[key] = Math.abs(gap) < 0.5 ? limit[key] : free[key] - gap * k
    }
  }

  /** The board can't leave the screen (more slack the further the zoom). */
  clampPan() {
    const extra = this.zoom.value - 1
    const mx = (this.fit.width / 2) * Math.abs(extra) + 80
    const my = (this.fit.height / 2) * Math.abs(extra) + 60
    // the slack grows with the zoom, centered on where the fit puts it
    const cx = (this.fit.width / 2 - this.fit.x) * extra
    const cy = (this.fit.height / 2 - this.fit.y) * extra
    this.pan.x = Math.min(-cx + mx, Math.max(-cx - mx, this.pan.x))
    this.pan.y = Math.min(-cy + my, Math.max(-cy - my, this.pan.y))
  }

  /** Puts the world where the camera says (plus a shake offset). */
  place(dx = 0, dy = 0) {
    const { world, backdrop, board } = this._host
    const scale = this.fit.scale * this.zoom.value
    world.scale.set(scale)
    world.position.set(
      this.fit.x + this.pan.x + dx,
      this.fit.y + this.pan.y + dy,
    )
    this._host.placed()
    // the distant islands are around the board, seen by the same camera:
    // they follow its middle and its zoom
    const middle = toScreen({
      x: (board.width - 1) / 2,
      y: (board.height - 1) / 2,
    })
    backdrop.zoom = this.zoom.value
    backdrop.focus = {
      x: world.x + middle.x * scale,
      y: world.y + middle.y * scale,
    }
  }
}

/** A round button with a curved arrow (1: clockwise). */
export function turnButton(dir: 1 | -1) {
  const view = new Container()
  view.eventMode = "static"
  view.cursor = "pointer"
  const draw = (hover: boolean) => {
    const r = 11
    // the arc ends at the arrow head, going the way the board turns
    const start = (-150 * Math.PI) / 180
    const end = (120 * Math.PI) / 180
    const flip = (x: number) => x * dir
    const at = (a: number, d = r) => ({
      x: flip(Math.cos(a) * d),
      y: Math.sin(a) * d,
    })
    const tip = at(end)
    const tangent = { x: flip(-Math.sin(end)), y: Math.cos(end) }
    const out = { x: flip(Math.cos(end)), y: Math.sin(end) }
    const color = hover ? COLORS.text : COLORS.muted
    const g = new Graphics()
      .circle(0, 0, 22)
      .fill({ color: COLORS.panel, alpha: 0.85 })
      .stroke({ width: 2, color: hover ? COLORS.text : COLORS.panelBorder })
    const from = at(start)
    g.moveTo(from.x, from.y)
    for (let i = 1; i <= 24; i++) {
      const p = at(start + ((end - start) * i) / 24)
      g.lineTo(p.x, p.y)
    }
    g.stroke({ width: 3, color, cap: "round" })
    g.poly([
      tip.x + tangent.x * 8,
      tip.y + tangent.y * 8,
      tip.x + out.x * 7 - tangent.x * 2,
      tip.y + out.y * 7 - tangent.y * 2,
      tip.x - out.x * 7 - tangent.x * 2,
      tip.y - out.y * 7 - tangent.y * 2,
    ]).fill({ color })
    for (const old of view.removeChildren()) old.destroy()
    view.addChild(g)
  }
  draw(false)
  view.on("pointerover", () => draw(true))
  view.on("pointerout", () => draw(false))
  return view
}

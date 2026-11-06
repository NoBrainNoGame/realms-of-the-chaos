import type { Combat, FightEvent, Point } from "@realms/engine"
import { Graphics } from "pixi.js"
import type BoardView from "./BoardView"
import { DEPTH, depthOf } from "./BoardView"
import ViewChip from "./ViewChip"

const PALE = 0xa5d8ff
const DARK = 0x9775fa
const STEP_MS = 700
const MERGE_MS = 1400

interface Crystal {
  view: Graphics
  from: Point
  to: Point
  /** Progress of the slide from `from` to `to`, in ms. */
  slide: number
  slideFor: number
  glow: number
}

/**
 * The decor crystals of ch. 6 (`rules.decor`): non blocking crystals on the
 * edge of the Lacune that flash by pairs. They shine more with every
 * Intrication nearby, the nearest one steps toward the heart at the first,
 * all beat once (darker) when Nyx accepts, and at noon they slide together
 * and fuse into the Premier Cristal. Driven by the `decor` events.
 */
export default class DecorCrystals extends ViewChip {
  private _crystals: Crystal[] = []
  private _time = 0
  private _pulse = -1
  private _merged = false
  private _mergeAt = 0

  constructor(
    private readonly _combat: Combat,
    private readonly _board: BoardView,
  ) {
    super()
  }

  protected _onActivate() {
    this._container.eventMode = "none"
    const report = this._combat.adventure?.report.decor
    const cells = report?.cells ?? []
    this._crystals = cells.map((c) => {
      const view = new Graphics()
      this._container.addChild(view)
      return {
        view,
        from: { ...c },
        to: { ...c },
        slide: 0,
        slideFor: STEP_MS,
        glow: report?.glow[cells.indexOf(c)] ?? 0,
      }
    })
    if (report?.merged) this._merged = true
    this._draw()
  }

  /** A `decor` event of the fight. */
  handle(event: Extract<FightEvent, { type: "decor" }>) {
    switch (event.kind) {
      case "glow": {
        const c = this._crystals[event.index]
        if (c) c.glow = event.level ?? c.glow + 1
        break
      }
      case "step": {
        const c = this._crystals[event.index]
        if (c && event.to) this._slideTo(c, event.to, STEP_MS)
        break
      }
      case "pulse":
        this._pulse = this._time
        break
      case "merge":
        if (!event.to) break
        for (const c of this._crystals) this._slideTo(c, event.to, MERGE_MS)
        this._merged = true
        this._mergeAt = this._time
        break
    }
  }

  private _slideTo(c: Crystal, to: Point, ms: number) {
    c.from = { ...c.to }
    c.to = { ...to }
    c.slide = 0
    c.slideFor = ms
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    this._time += dt
    for (const c of this._crystals) c.slide = Math.min(c.slideFor, c.slide + dt)
    this._draw()
  }

  private _draw() {
    const fused =
      this._merged &&
      this._crystals.every((c) => c.slide >= c.slideFor) &&
      this._time - this._mergeAt >= MERGE_MS
    this._crystals.forEach((c, i) => {
      const g = c.view
      g.clear()
      // only one crystal is left once they fused
      g.visible = !fused || i === 0
      if (!g.visible) return
      const u = Math.min(1, c.slide / c.slideFor)
      const e = u * u * (3 - 2 * u)
      const from = this._board.cellTop(c.from)
      const to = this._board.cellTop(c.to)
      g.position.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e)
      const near = e < 0.5 ? c.from : c.to
      g.zIndex = depthOf(near, DEPTH.fighter) - 0.5
      // pairs flash together (0 and 1, 2 and 3, …), the others out of phase
      const phase = Math.floor(i / 2) * 1.1
      let shine = 0.5 + 0.5 * Math.sin(this._time / 380 + phase)
      shine = Math.min(1, shine * (0.6 + 0.2 * c.glow) + 0.1 * c.glow)
      let color = PALE
      if (this._pulse >= 0 && this._time - this._pulse < 900) {
        shine = 1
        color = DARK
      }
      const size = fused ? 1.7 : 1
      const h = 22 * size
      const w = 8 * size
      g.poly([0, -h, w, -h * 0.45, 0, 0, -w, -h * 0.45])
        .fill({ color, alpha: 0.35 + 0.55 * shine })
        .stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 + 0.5 * shine })
      g.circle(0, -h * 0.5, 14 * size * (0.4 + 0.6 * shine)).fill({
        color,
        alpha: 0.12 + 0.22 * shine,
      })
    })
  }
}

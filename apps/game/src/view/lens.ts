import { type Container, Rectangle } from "pixi.js"
import { TiltShiftFilter } from "pixi-filters"

/** Blur far from the focus at the closest zoom (px). */
export const MAX_LENS_BLUR = 16

/**
 * The focus of the camera, tighter as it zooms in: only a band across the
 * middle of the screen stays sharp (in the isometric view, the diagonals
 * of the board near the middle), the farther from it, the blurrier.
 * `zoom` from 1 (no effect) to `maxZoom` (the tightest focus).
 */
export function lensFocus(zoom: number, maxZoom: number, height: number) {
  const t = Math.min(1, Math.max(0, (zoom - 1) / (maxZoom - 1)))
  return {
    /** How much it blurs, from 0 to 1. */
    amount: t,
    blur: MAX_LENS_BLUR * t,
    /** Distance from the middle line at which the blur is full (px). */
    reach: height * (0.55 - 0.3 * t),
  }
}

/** A tilt-shift on a container drawn in screen space (at the origin). */
export class Lens {
  readonly filter = new TiltShiftFilter({ blur: 0, gradientBlur: 1 })
  private _amount = 0

  constructor(readonly target: Container) {}

  get amount() {
    return this._amount
  }

  update(width: number, height: number, zoom: number, maxZoom: number) {
    const focus = lensFocus(zoom, maxZoom, height)
    this._amount = focus.amount
    if (focus.blur < 0.2) {
      if (this.target.filters?.length) this.target.filters = []
      return
    }
    // the line through the middle of the screen, across
    this.filter.blur = focus.blur
    this.filter.gradientBlur = focus.reach
    this.filter.start = { x: 0, y: height / 2 }
    this.filter.end = { x: width, y: height / 2 }
    this.target.filterArea = new Rectangle(0, 0, width, height)
    if (!this.target.filters?.length) this.target.filters = [this.filter]
  }
}

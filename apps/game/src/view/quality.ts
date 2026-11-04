/**
 * Adaptive quality: when the frames stay slow (a small configuration),
 * the rendering resolution steps down, never below `MIN_RESOLUTION`.
 * It only steps down: going back up would make it waver.
 */

/** Frames averaged before deciding. */
export const QUALITY_WINDOW = 90
/**
 * Average frame time above which the resolution steps down (ms, under
 * 30 fps): only a real struggle, a quick machine never gets there.
 */
export const SLOW_FRAME = 34
/** Lowest resolution (blurrier, but four times fewer pixels than 1.5). */
export const MIN_RESOLUTION = 0.75
/** Longer frames are pauses (a hidden tab, a load), not slowness (ms). */
const PAUSE = 200

export class Quality {
  private _frames: number[] = []
  /** The first frames (loading, building the scene) are not counted. */
  private _warmup = QUALITY_WINDOW * 2

  constructor(public resolution: number) {}

  /**
   * Counts a frame (ms since the last one); returns the new resolution
   * when it should step down, else null.
   */
  frame(ms: number): number | null {
    if (ms > PAUSE) return null
    if (this._warmup > 0) {
      this._warmup--
      return null
    }
    this._frames.push(ms)
    if (this._frames.length < QUALITY_WINDOW) return null
    const average =
      this._frames.reduce((sum, f) => sum + f, 0) / this._frames.length
    this._frames = []
    if (average <= SLOW_FRAME || this.resolution <= MIN_RESOLUTION) return null
    this.resolution = Math.max(
      MIN_RESOLUTION,
      this.resolution > 1 ? 1 : this.resolution - 0.25,
    )
    return this.resolution
  }
}

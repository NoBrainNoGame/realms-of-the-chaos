import { Assets, Texture } from "pixi.js"
import islet0 from "../../assets/islets/islet-0.png"
import islet0p50 from "../../assets/islets/islet-0-p50.png"
import islet0p72 from "../../assets/islets/islet-0-p72.png"
import islet1 from "../../assets/islets/islet-1.png"
import islet1p50 from "../../assets/islets/islet-1-p50.png"
import islet1p72 from "../../assets/islets/islet-1-p72.png"
import islet2 from "../../assets/islets/islet-2.png"
import islet2p50 from "../../assets/islets/islet-2-p50.png"
import islet2p72 from "../../assets/islets/islet-2-p72.png"
import islet3 from "../../assets/islets/islet-3.png"
import islet3p50 from "../../assets/islets/islet-3-p50.png"
import islet3p72 from "../../assets/islets/islet-3-p72.png"
import islet4 from "../../assets/islets/islet-4.png"
import islet4p50 from "../../assets/islets/islet-4-p50.png"
import islet4p72 from "../../assets/islets/islet-4-p72.png"
import islet5 from "../../assets/islets/islet-5.png"
import islet5p50 from "../../assets/islets/islet-5-p50.png"
import islet5p72 from "../../assets/islets/islet-5-p72.png"
import islet6 from "../../assets/islets/islet-6.png"
import islet6p50 from "../../assets/islets/islet-6-p50.png"
import islet6p72 from "../../assets/islets/islet-6-p72.png"
import islet7 from "../../assets/islets/islet-7.png"
import islet7p50 from "../../assets/islets/islet-7-p50.png"
import islet7p72 from "../../assets/islets/islet-7-p72.png"
import islet8 from "../../assets/islets/islet-8.png"
import islet8p50 from "../../assets/islets/islet-8-p50.png"
import islet8p72 from "../../assets/islets/islet-8-p72.png"
import islet9 from "../../assets/islets/islet-9.png"
import islet9p50 from "../../assets/islets/islet-9-p50.png"
import islet9p72 from "../../assets/islets/islet-9-p72.png"
import {
  ISLET_CELLS,
  ISLET_RESOLUTION,
  ISLET_VIEWS,
} from "../../scripts/islets"

/**
 * The distant islets are baked images (`bun run bake:islets`): fully opaque
 * inside, transparent only around, so one sprite can be translucent without
 * its blocks showing through each other.
 */
const URLS = [
  islet0,
  islet1,
  islet2,
  islet3,
  islet4,
  islet5,
  islet6,
  islet7,
  islet8,
  islet9,
]

/** The baked islets of a size (in cells), as indices into the list. */
export function isletsOfSize(cells: number): number[] {
  return ISLET_CELLS.flatMap((c, i) => (c === cells ? [i] : []))
}

/** The islet drawn for a seed and a size: the same seed, the same islet. */
export function pickIslet(seed: number, cells: number): number {
  const same = isletsOfSize(cells)
  const list = same.length > 0 ? same : ISLET_CELLS.map((_, i) => i)
  return list[Math.abs(Math.floor(seed)) % list.length]
}

const VIEW_URLS = [
  URLS,
  [
    islet0p50,
    islet1p50,
    islet2p50,
    islet3p50,
    islet4p50,
    islet5p50,
    islet6p50,
    islet7p50,
    islet8p50,
    islet9p50,
  ],
  [
    islet0p72,
    islet1p72,
    islet2p72,
    islet3p72,
    islet4p72,
    islet5p72,
    islet6p72,
    islet7p72,
    islet8p72,
    islet9p72,
  ],
]

/** The baked view (index into ISLET_VIEWS) nearest to a pitch (°). */
export function nearestView(pitch: number): number {
  let best = 0
  for (let v = 1; v < ISLET_VIEWS.length; v++)
    if (
      Math.abs(ISLET_VIEWS[v].pitch - pitch) <
      Math.abs(ISLET_VIEWS[best].pitch - pitch)
    )
      best = v
  return best
}

const loaded = new Map<string, Promise<Texture>>()

/**
 * Texture of a baked islet at a baked view (default: the classic 30°),
 * loaded once (empty while it loads or if it fails).
 */
export function isletTexture(index: number, view = 0): Promise<Texture> {
  const key = `${view}:${index}`
  let promise = loaded.get(key)
  if (!promise) {
    promise = Assets.load<Texture>(VIEW_URLS[view][index]).catch(
      () => Texture.EMPTY,
    )
    loaded.set(key, promise)
  }
  return promise
}

/** Where an islet's centre is in its image (0-1) at a view. */
export function isletAnchor(view: number) {
  return { x: ISLET_VIEWS[view].ax, y: ISLET_VIEWS[view].ay }
}

/** Where an islet's centre is in its classic image (0-1), and its pixel ratio. */
export const ISLET_ANCHOR = isletAnchor(0)
export { ISLET_RESOLUTION }

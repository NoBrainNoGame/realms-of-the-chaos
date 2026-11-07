import { Assets, Texture } from "pixi.js"
import islet0 from "../../assets/islets/islet-0.png"
import islet1 from "../../assets/islets/islet-1.png"
import islet2 from "../../assets/islets/islet-2.png"
import islet3 from "../../assets/islets/islet-3.png"
import islet4 from "../../assets/islets/islet-4.png"
import islet5 from "../../assets/islets/islet-5.png"
import islet6 from "../../assets/islets/islet-6.png"
import islet7 from "../../assets/islets/islet-7.png"
import islet8 from "../../assets/islets/islet-8.png"
import islet9 from "../../assets/islets/islet-9.png"
import {
  ISLET_CANVAS,
  ISLET_CELLS,
  ISLET_RESOLUTION,
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

const loaded = new Map<number, Promise<Texture>>()

/** Texture of a baked islet, loaded once (empty while it loads or if it fails). */
export function isletTexture(index: number): Promise<Texture> {
  let promise = loaded.get(index)
  if (!promise) {
    promise = Assets.load<Texture>(URLS[index]).catch(() => Texture.EMPTY)
    loaded.set(index, promise)
  }
  return promise
}

/** Where an islet's centre is in its image (0-1), and its pixel ratio. */
export const ISLET_ANCHOR = { x: ISLET_CANVAS.ax, y: ISLET_CANVAS.ay }
export { ISLET_RESOLUTION }

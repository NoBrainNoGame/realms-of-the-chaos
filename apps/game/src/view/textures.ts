import { Texture } from "pixi.js"
import {
  artSize,
  CHARACTER_ART,
  ICON_ART,
  type PixelArt,
} from "../art/pixelArt"
import { lookOf } from "./looks"

const cache = new Map<string, Texture>()

/** Render a pixel-art grid into a crisp (nearest-neighbor) texture. */
export function artToTexture(key: string, art: PixelArt): Texture {
  const cached = cache.get(key)
  if (cached) return cached

  const { width, height } = artSize(art)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  art.rows.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      const color = art.palette[char]
      if (!color) return
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    })
  })

  const texture = Texture.from(canvas)
  texture.source.scaleMode = "nearest"
  cache.set(key, texture)
  return texture
}

export const characterTexture = (presetId: string) => {
  const look = lookOf(presetId)
  return artToTexture(`character:${look}`, CHARACTER_ART[look])
}

export const iconTexture = (id: string) =>
  artToTexture(`icon:${id}`, ICON_ART[id])

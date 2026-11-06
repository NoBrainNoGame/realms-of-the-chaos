/**
 * Pixel-art portrait (16×16, like the reference characters' sprites) of a
 * modular look, built from the same parts and palettes as the puppet. Used
 * by the timeline, the action bar and every other small portrait.
 *
 * The sprite is composed on a grid of layers, then outlined automatically:
 * every empty pixel touching a filled one becomes the outline colour.
 */
import type { CustomLook } from "@realms/engine"
import { resolveLook, shadeOf } from "./lookPalettes"
import type { PixelArt } from "./pixelArt"

const SIZE = 16
const OUTLINE = "#1b1424"

const css = (color: number) => `#${color.toString(16).padStart(6, "0")}`

/** Letters of the palette. */
const KEYS = {
  skin: "s",
  skinShade: "S",
  hair: "h",
  hairShade: "H",
  cloth: "c",
  clothShade: "C",
  cloth2: "d",
  cloth2Shade: "D",
  metal: "m",
  metalShade: "M",
  boots: "b",
  eye: "e",
  white: "w",
  gold: "y",
} as const

export function lookPortrait(look: CustomLook): PixelArt {
  const r = resolveLook(look)
  const grid: string[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "."),
  )
  const put = (x: number, y: number, key: string) => {
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) grid[y][x] = key
  }
  const rect = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    key: string,
  ) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, key)
  }
  const get = (x: number, y: number) =>
    x >= 0 && x < SIZE && y >= 0 && y < SIZE ? grid[y][x] : "."

  // ── layout from the build ────────────────────────────────────────────────
  const half = [3, 4, 5, 5][look.body % 4] // half width of the shoulders
  const left = 8 - half
  const right = 7 + half

  // cape: behind the shoulders (the portrait faces the camera)
  const cape = look.cape % 4
  if (cape > 0) {
    rect(left - 1, 10, right + 1, cape === 1 ? 13 : 15, KEYS.cloth2)
    rect(left - 1, 10, left, cape === 1 ? 13 : 15, KEYS.cloth2Shade)
    if (cape === 3) {
      put(left - 1, 15, ".")
      put(right + 1, 15, ".")
    }
  }

  // torso
  const top = look.top % 6
  const bodyKey = top === 3 ? KEYS.metal : KEYS.cloth
  const bodyShade = top === 3 ? KEYS.metalShade : KEYS.clothShade
  rect(left, 10, right, 15, bodyKey)
  rect(left, 10, left, 15, bodyShade)
  switch (top) {
    case 0: // tunic: belt
      rect(left, 13, right, 13, KEYS.cloth2)
      put(8, 13, KEYS.metal)
      break
    case 1: // robe: hem
      rect(left, 15, right, 15, KEYS.cloth2)
      rect(left, 12, right, 12, KEYS.metal)
      break
    case 2: // jerkin: shirt sleeves and lacing
      rect(left, 10, left, 15, KEYS.cloth2)
      rect(right, 10, right, 15, KEYS.cloth2)
      put(8, 11, KEYS.cloth2)
      put(8, 13, KEYS.cloth2)
      break
    case 3: // plate: glint and belt
      put(right - 1, 11, KEYS.white)
      rect(left, 14, right, 14, KEYS.cloth2)
      break
    case 4: // coat: opening and trim
      rect(8, 10, 8, 15, KEYS.cloth2)
      rect(left, 15, right, 15, KEYS.cloth2)
      break
    default: // vest: shirt showing at the sides
      rect(left, 10, left + 1, 15, KEYS.cloth2)
      rect(right - 1, 10, right, 15, KEYS.cloth2)
      break
  }

  // head
  const shape = look.head % 4
  const hx0 = shape === 3 ? 6 : shape === 1 ? 6 : 5
  const hx1 = shape === 3 ? 10 : shape === 1 ? 9 : 10
  const hy0 = shape === 1 ? 2 : shape === 3 ? 4 : 3
  const hy1 = shape === 1 ? 10 : shape === 3 ? 9 : 9
  rect(hx0, hy0, hx1, hy1, KEYS.skin)
  rect(hx0, hy0, hx0, hy1, KEYS.skinShade)
  if (shape !== 2) {
    // round corners
    put(hx0, hy0, ".")
    put(hx1, hy0, ".")
    put(hx0, hy1, ".")
    put(hx1, hy1, ".")
  }
  const eyeY = hy0 + (shape === 1 ? 4 : 3)

  const hair = look.hair % 9
  const helm = hair === 7 || hair === 8
  if (hair !== 8) {
    // face
    const eyeKey = KEYS.eye
    switch (look.face % 4) {
      case 0:
        put(hx0 + 1, eyeY, eyeKey)
        put(hx1 - 1, eyeY, eyeKey)
        put(8, eyeY + 3, KEYS.skinShade)
        break
      case 1:
        put(hx0 + 1, eyeY, eyeKey)
        put(hx1 - 1, eyeY, eyeKey)
        put(hx0 + 1, eyeY - 1, eyeKey)
        put(hx1 - 1, eyeY - 1, eyeKey)
        put(8, eyeY + 3, KEYS.skinShade)
        put(7, eyeY + 3, KEYS.skinShade)
        break
      case 2:
        put(hx0 + 1, eyeY, eyeKey)
        put(hx1 - 1, eyeY, eyeKey)
        put(hx0 + 1, eyeY + 2, "p")
        put(hx1 - 1, eyeY + 2, "p")
        put(7, eyeY + 3, eyeKey)
        put(8, eyeY + 3, eyeKey)
        break
      default:
        rect(hx0, eyeY - 1, hx1, eyeY, KEYS.cloth2)
        put(hx0 + 1, eyeY, KEYS.white)
        put(hx1 - 1, eyeY, KEYS.white)
    }
    // mark
    switch (look.mark % 4) {
      case 1:
        put(hx1 - 1, eyeY - 1, "r")
        put(hx1 - 1, eyeY + 1, "r")
        put(hx1, eyeY + 2, "r")
        break
      case 2:
        put(hx0 + 1, eyeY + 1, KEYS.cloth2)
        put(hx1 - 1, eyeY + 1, KEYS.cloth2)
        break
      case 3:
        put(8, hy0 + 1, KEYS.gold)
        break
    }
  }

  // hair or helmet
  const cover = (x0: number, y0: number, x1: number, y1: number, key: string) =>
    rect(x0, y0, x1, y1, key)
  switch (hair) {
    case 1:
      cover(hx0, hy0 - 1, hx1, hy0, KEYS.hair)
      put(hx0, hy0 + 1, KEYS.hair)
      break
    case 2:
      cover(hx0, hy0, hx1, hy0, KEYS.hair)
      for (const x of [hx0, 7, hx1]) put(x, hy0 - 1, KEYS.hair)
      put(hx0 + 1, hy0 - 2, KEYS.hair)
      put(hx1 - 1, hy0 - 2, KEYS.hair)
      break
    case 3:
      cover(hx0, hy0 - 1, hx1, hy0, KEYS.hair)
      rect(hx0 - 1, hy0, hx0, 12, KEYS.hair)
      rect(hx1, hy0, hx1 + 1, 12, KEYS.hairShade)
      break
    case 4:
      cover(hx0, hy0 - 1, hx1, hy0, KEYS.hair)
      rect(hx0 - 1, hy0 + 1, hx0 - 1, 9, KEYS.hair)
      put(hx0 - 1, hy0 + 1, KEYS.cloth2)
      break
    case 5:
      rect(7, hy0 - 3, 8, hy0, KEYS.hair)
      put(7, hy0 + 1, KEYS.hair)
      break
    case 6:
      rect(hx0 - 1, hy0 - 1, hx1 + 1, hy0 + 1, KEYS.cloth)
      rect(hx0 - 1, hy0, hx0, hy1 + 1, KEYS.cloth)
      rect(hx1, hy0, hx1 + 1, hy1 + 1, KEYS.clothShade)
      break
    case 7:
      cover(hx0 - 1, hy0 - 1, hx1 + 1, hy0 + 1, KEYS.metal)
      put(hx0 - 1, hy0 + 1, KEYS.metalShade)
      put(hx1 + 1, hy0 + 1, KEYS.metalShade)
      put(8, hy0 + 2, KEYS.metalShade)
      put(8, hy0 - 2, KEYS.cloth2)
      put(7, hy0 - 2, KEYS.cloth2)
      break
    case 8:
      cover(hx0 - 1, hy0 - 1, hx1 + 1, hy1, KEYS.metal)
      rect(hx0 - 1, hy0 - 1, hx0 - 1, hy1, KEYS.metalShade)
      rect(hx0, eyeY, hx1, eyeY, "k")
      put(hx0 + 2, eyeY, KEYS.gold)
      put(hx1 - 1, eyeY, KEYS.gold)
      put(8, hy0 - 2, KEYS.cloth2)
      break
  }
  void helm

  // light from the upper right: sheen on the hair, a lit cheek and shoulder
  if (hair !== 8) {
    put(
      hx1 - 1,
      hy0 + 2,
      get(hx1 - 1, hy0 + 2) === KEYS.skin ? "L" : get(hx1 - 1, hy0 + 2),
    )
    if (get(hx1 - 1, hy0) === KEYS.hair) put(hx1 - 1, hy0, "J")
    if (get(hx1 - 2, hy0 - 1) === KEYS.hair) put(hx1 - 2, hy0 - 1, "J")
  }
  if (get(right - 1, 10) === bodyKey) put(right - 1, 10, "K")

  // accessories
  switch (look.accessory % 5) {
    case 1: // goggles
      if (hair !== 8) {
        rect(hx0, hy0 + 1, hx1, hy0 + 1, "g")
        put(hx0 + 1, hy0 + 1, KEYS.metal)
        put(hx1 - 1, hy0 + 1, KEYS.metal)
        put(hx0 + 1, hy0 + 1, "o")
        put(hx1 - 1, hy0 + 1, "o")
      }
      break
    case 2: // scarf
      rect(hx0 - 1, 10, hx1 + 1, 10, KEYS.cloth2)
      put(hx1 + 1, 11, KEYS.cloth2)
      put(hx1 + 1, 12, KEYS.cloth2Shade)
      break
    case 3: // satchel strap
      for (let i = 0; i < 4; i++) put(left + 1 + i, 10 + i, KEYS.boots)
      put(left, 13, KEYS.cloth2)
      break
    case 4: // amulet
      put(8, 11, KEYS.metal)
      put(8, 12, KEYS.cloth2)
      break
  }

  // outline: empty pixels touching a filled one
  const outlined = grid.map((row) => [...row])
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      if (get(x, y) !== ".") continue
      if (
        get(x - 1, y) !== "." ||
        get(x + 1, y) !== "." ||
        get(x, y - 1) !== "." ||
        get(x, y + 1) !== "."
      )
        outlined[y][x] = "k"
    }
  // the bottom row stays open (the bust is cut by the frame)
  for (let x = 0; x < SIZE; x++)
    if (outlined[SIZE - 1][x] === "k" && grid[SIZE - 1][x] === ".")
      outlined[SIZE - 1][x] = "."

  return {
    palette: {
      k: OUTLINE,
      s: css(r.skin),
      S: css(r.skinShade),
      h: css(r.hair),
      H: css(r.hairShade),
      c: css(r.cloth),
      C: css(r.clothShade),
      d: css(r.cloth2),
      D: css(r.cloth2Shade),
      m: css(r.metal),
      M: css(r.metalShade),
      b: css(r.boots),
      e: OUTLINE,
      w: "#f1f3f5",
      y: "#ffe066",
      p: "#f783ac",
      r: "#b04a4a",
      L: css(shadeOf(r.skin, 1.12)),
      J: css(shadeOf(r.hair, 1.35)),
      K: css(shadeOf(top === 3 ? r.metal : r.cloth, 1.25)),
      g: css(shadeOf(0x343a40, 1)),
      o: "#74c0fc",
    },
    rows: outlined.map((row) => row.join("")),
  }
}

/**
 * Colours and builds of the modular puppet. Pure data (no pixi), so the
 * counts can be checked against the engine's `LOOK_PARTS`.
 */
import { type CustomLook, LOOK_PARTS } from "@realms/engine"

export const SKINS = [
  0xf6d9c4, 0xf2c39b, 0xd9a066, 0xc68642, 0x8d5524, 0x5c3a21, 0x9bb08a,
  0x8fa8c8,
] as const

export const CLOTHS = [
  0xc92a2a, 0xe8590c, 0xe0a800, 0x2f9e44, 0x12a594, 0x4dabf7, 0x3b5bdb,
  0x7048e8, 0xd6336c, 0x8d5a2b, 0xe9ecef, 0x343a40,
] as const

export const METALS = [
  0x868e96, 0xa5b4c4, 0xb8793c, 0xe0b43a, 0x495057,
] as const

export const HAIRS = [
  0x2b2320, 0x6b3a1e, 0xa0522d, 0xe6c35c, 0xc2410c, 0xe9ecef, 0x9aa0a6,
  0x3b5bdb, 0x2f9e44, 0xf783ac,
] as const

/** Silhouettes: width of the torso, height scale, width of the legs, reach of the shoulders. */
export const BUILDS = [
  { w: 0.86, h: 1.05, legW: 0.88, shoulder: 0.9 },
  { w: 1, h: 1, legW: 1, shoulder: 1 },
  { w: 1.2, h: 1, legW: 1.05, shoulder: 1.16 },
  { w: 1.26, h: 0.9, legW: 1.18, shoulder: 1.18 },
] as const

/** Head shapes: scale of the whole head. */
export const HEAD_SCALES = [
  { x: 1, y: 1 },
  { x: 0.9, y: 1.12 },
  { x: 1, y: 0.96 },
  { x: 0.82, y: 0.82 },
] as const

export function shadeOf(color: number, factor = 0.72) {
  const r = Math.round(((color >> 16) & 0xff) * factor)
  const g = Math.round(((color >> 8) & 0xff) * factor)
  const b = Math.round((color & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}

export interface ResolvedLook {
  look: CustomLook
  skin: number
  skinShade: number
  cloth: number
  clothShade: number
  cloth2: number
  cloth2Shade: number
  metal: number
  metalShade: number
  hair: number
  hairShade: number
  boots: number
  build: (typeof BUILDS)[number]
}

const at = <T>(list: readonly T[], i: number): T => list[i % list.length]

/** The colours and build a look picks (indices out of range wrap around). */
export function resolveLook(look: CustomLook): ResolvedLook {
  const skin = at(SKINS, look.skin)
  const cloth = at(CLOTHS, look.cloth)
  const cloth2 = at(CLOTHS, look.cloth2)
  const metal = at(METALS, look.metal)
  const hair = at(HAIRS, look.hairColor)
  return {
    look,
    skin,
    skinShade: shadeOf(skin, 0.82),
    cloth,
    clothShade: shadeOf(cloth),
    cloth2,
    cloth2Shade: shadeOf(cloth2),
    metal,
    metalShade: shadeOf(metal, 0.7),
    hair,
    hairShade: shadeOf(hair, 0.75),
    boots: shadeOf(cloth2, 0.5),
    build: at(BUILDS, look.body),
  }
}

export const PALETTE_SIZES = {
  skin: SKINS.length,
  cloth: CLOTHS.length,
  cloth2: CLOTHS.length,
  metal: METALS.length,
  hairColor: HAIRS.length,
  body: BUILDS.length,
  head: HEAD_SCALES.length,
} as const

/** Whether the palettes cover every index the engine allows. */
export const palettesCover = () =>
  (Object.keys(PALETTE_SIZES) as (keyof typeof PALETTE_SIZES)[]).every(
    (key) => PALETTE_SIZES[key] >= LOOK_PARTS[key],
  )

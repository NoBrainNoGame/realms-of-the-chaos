/**
 * The look of a custom character: pure cosmetic data. Every field is an
 * index into a list the game draws (a silhouette, a hairstyle, a colour
 * palette...). A look never changes balance: the engine only checks its
 * shape and ranges, so a client cannot send something the game cannot draw.
 */
import { createRng } from "./random"

/** Parts of a look, with how many choices each one has (indices 0..n-1). */
export const LOOK_PARTS = {
  /** Silhouette and build: slim, average, broad, stocky. */
  body: 4,
  /** Head shape: round, long, square, small. */
  head: 4,
  /** Face: calm, stern, cheerful, masked. */
  face: 4,
  /** Hair or helmet (0 is bald): crop, spiky, long, ponytail, mohawk, hood, helm, full helm. */
  hair: 9,
  /** Natural and unusual hair colours. */
  hairColor: 10,
  /** Torso: tunic, robe, jerkin, plate, coat, vest. */
  top: 6,
  /** Legs: trousers, shorts, tall boots, greaves, baggy trousers. */
  legs: 5,
  /** Cape (0 is none): short, long, tattered cloak. */
  cape: 4,
  /** Accessory (0 is none): goggles, scarf, satchel, amulet. */
  accessory: 5,
  /** Mark (0 is none): scar, war paint, rune. */
  mark: 4,
  /** Skin palette. */
  skin: 8,
  /** Main cloth colour, and the secondary one (trim, legs, cape). */
  cloth: 12,
  cloth2: 12,
  /** Metal palette (helmets, plates, buckles). */
  metal: 5,
} as const

export type LookPart = keyof typeof LOOK_PARTS

export const LOOK_KEYS = Object.keys(LOOK_PARTS) as LookPart[]

/** The choice made for each part of a look. */
export type CustomLook = Record<LookPart, number>

export type LookCheck = { ok: true } | { ok: false; reason: string }

/** Shape and range only (a look has no effect on the fight). */
export function checkLook(look: unknown): LookCheck {
  if (typeof look !== "object" || look === null || Array.isArray(look))
    return { ok: false, reason: "look is not an object" }
  const entry = look as Record<string, unknown>
  for (const key of LOOK_KEYS) {
    const value = entry[key]
    if (typeof value !== "number" || !Number.isInteger(value))
      return { ok: false, reason: `look.${key} is not an integer` }
    if (value < 0 || value >= LOOK_PARTS[key])
      return { ok: false, reason: `look.${key} out of range` }
  }
  return { ok: true }
}

/** A look from a seed: the same seed always gives the same look. */
export function randomLook(seed: number | string): CustomLook {
  const rng = createRng(hash(seed))
  const look = {} as CustomLook
  for (const key of LOOK_KEYS) look[key] = rng.int(0, LOOK_PARTS[key] - 1)
  // the secondary colour never repeats the main one
  if (look.cloth2 === look.cloth)
    look.cloth2 = (look.cloth + 1 + rng.int(0, 9)) % LOOK_PARTS.cloth2
  return look
}

/** Only the colours of a look change (the build and clothes stay). */
export function randomColors(look: CustomLook, seed: number | string) {
  const other = randomLook(seed)
  return {
    ...look,
    skin: other.skin,
    cloth: other.cloth,
    cloth2: other.cloth2,
    metal: other.metal,
  }
}

/** The look a character without one gets, from its kit (stable). */
export function defaultLook(kit: string): CustomLook {
  return randomLook(`kit:${kit}`)
}

function hash(seed: number | string) {
  if (typeof seed === "number") return Math.floor(seed) >>> 0
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

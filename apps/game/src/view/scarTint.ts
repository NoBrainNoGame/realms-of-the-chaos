/**
 * Scars on the colours. Each vacuum decay leaves the physical constants of
 * the Fragment a little different, and light with them: colours drift a few
 * degrees of hue, and a touch of saturation, per scar. The drift is
 * deterministic (a family of colours always drifts the same way) and
 * capped, and lightness is untouched, so text and panels keep their
 * contrast whatever the scars.
 */

/** Hue drift per scar (degrees). */
export const HUE_PER_SCAR = 3
/** Hue never drifts further than this (degrees). */
export const MAX_HUE_DRIFT = 24
/** Saturation drift per scar, and its cap (0 to 1). */
export const SATURATION_PER_SCAR = 0.012
export const MAX_SATURATION_DRIFT = 0.1
/** Greys have no hue to rotate: left alone. */
const MIN_SATURATION = 0.06

/** Colour families (60° of hue each), and how each one drifts. */
const FAMILIES = 6
function family(hue: number) {
  return Math.floor((((hue % 360) + 360) % 360) / (360 / FAMILIES)) % FAMILIES
}

/** Seeded sign of a family's drift: +1 or -1. */
function direction(fam: number, salt: number) {
  let h = Math.imul(fam + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return (h & 1) === 0 ? 1 : -1
}

/** Smoothly saturating growth: linear at first, capped at `max`. */
const soft = (value: number, max: number) => max * Math.tanh(value / max)

export function rgbToHsl(color: number): [number, number, number] {
  const r = ((color >> 16) & 0xff) / 255
  const g = ((color >> 8) & 0xff) / 255
  const b = (color & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

export function hslToRgb(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  const channel = (v: number) => Math.round((v + m) * 255)
  return (channel(r) << 16) | (channel(g) << 8) | channel(b)
}

/** A colour as `scars` vacuum decays left it (identity with no scar). */
export function scarTint(color: number, scars: number): number {
  if (!(scars > 0)) return color
  const [h, s, l] = rgbToHsl(color)
  if (s < MIN_SATURATION) return color
  const fam = family(h)
  const hue = direction(fam, 0) * soft(scars * HUE_PER_SCAR, MAX_HUE_DRIFT)
  const sat =
    direction(fam, 1) * soft(scars * SATURATION_PER_SCAR, MAX_SATURATION_DRIFT)
  return hslToRgb((h + hue + 360) % 360, Math.min(1, Math.max(0, s + sat)), l)
}

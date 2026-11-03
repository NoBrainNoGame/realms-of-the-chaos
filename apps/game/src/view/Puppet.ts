import { Container, Graphics, Sprite } from "pixi.js"

import type { Point } from "@realms/engine"
import { softCircle } from "./effects"

/**
 * Isometric characters, "Dofus style": vector puppets made of articulated
 * parts, drawn in two views (front ¾ and back ¾) and mirrored to cover
 * the four directions of the grid.
 *
 *   NW (back, mirrored)   NE (back)
 *               ╲       ╱
 *                 cell
 *               ╱       ╲
 *   SW (front, mirrored)  SE (front)
 */
export type Facing = "SE" | "SW" | "NE" | "NW"

export type PuppetAction = "melee" | "shoot" | "cast" | "hit" | "roar"

/** Facing to look from `from` towards `to` on the grid. */
export function facingBetween(
  from: Point,
  to: Point,
  fallback: Facing = "SE",
): Facing {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return fallback
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "SE" : "NW"
  return dy > 0 ? "SW" : "NE"
}

const OUTLINE = 0x1b1424
const LINE = { width: 1.4, color: OUTLINE, alignment: 0.5 }

// ─── Character styles ───────────────────────────────────────────────────────

type BodyKind = "robe" | "tunic" | "armor" | "scales" | "muscle"
type HeadKind =
  "wizard" | "hood" | "helmet" | "hair" | "mask" | "naiad" | "shark"
type Weapon =
  | "staff"
  | "crystalStaff"
  | "bow"
  | "swordShield"
  | "daggers"
  | "trident"
  | "claws"

interface Style {
  kind?: "humanoid"
  scale: number
  skin: number
  skinShade: number
  legs: number
  boots: number
  body: {
    kind: BodyKind
    color: number
    shade: number
    trim?: number
    belt?: number
  }
  sleeves: number
  hands: number
  head: {
    kind: HeadKind
    color: number
    shade?: number
    accent?: number
    hair?: number
    beard?: number
    eyes?: number
  }
  weapon: Weapon
  cape?: number
}

/** Stone golem (Gorr): hunched, long arms, mossy head, glowing eyes. */
interface GolemStyle {
  kind: "golem"
  scale: number
  stone: number
  stoneDark: number
  stoneLight: number
  moss: number
  mossDark: number
  eyes: number
  eyesLight: number
}

const SKIN = 0xf2c39b
const SKIN_SHADE = 0xc98e6b

export const STYLES: Record<string, Style | GolemStyle> = {
  merlin: {
    scale: 1,
    skin: SKIN,
    skinShade: SKIN_SHADE,
    legs: 0x26348f,
    boots: 0x5c3a1a,
    body: {
      kind: "robe",
      color: 0x3b5bdb,
      shade: 0x26348f,
      trim: 0xffd43b,
      belt: 0x8d5a2b,
    },
    sleeves: 0x3b5bdb,
    hands: SKIN,
    head: {
      kind: "wizard",
      color: 0x3b5bdb,
      shade: 0x26348f,
      accent: 0xffd43b,
      beard: 0xf1f3f5,
    },
    weapon: "staff",
    cape: 0x26348f,
  },
  eva: {
    scale: 0.95,
    skin: SKIN,
    skinShade: SKIN_SHADE,
    legs: 0x6b3a1e,
    boots: 0x4a2a12,
    body: {
      kind: "tunic",
      color: 0x2f9e44,
      shade: 0x1e6b30,
      belt: 0xa0522d,
      trim: 0xfab005,
    },
    sleeves: 0xa0522d,
    hands: SKIN,
    head: { kind: "hood", color: 0x2f9e44, shade: 0x1e6b30, hair: 0xd9480f },
    weapon: "bow",
    cape: 0x1e6b30,
  },
  brutus: {
    scale: 1.05,
    skin: SKIN,
    skinShade: SKIN_SHADE,
    legs: 0x495057,
    boots: 0x343a40,
    body: {
      kind: "armor",
      color: 0xadb5bd,
      shade: 0x5c636a,
      trim: 0xe03131,
      belt: 0x7f4f24,
    },
    sleeves: 0x868e96,
    hands: 0x868e96,
    head: {
      kind: "helmet",
      color: 0xced4da,
      shade: 0x868e96,
      accent: 0xe03131,
      beard: 0x7f4f24,
    },
    weapon: "swordShield",
    cape: 0xc92a2a,
  },
  lyra: {
    scale: 0.95,
    skin: SKIN,
    skinShade: SKIN_SHADE,
    legs: 0xe9ecef,
    boots: 0xc08a4a,
    body: {
      kind: "robe",
      color: 0xf8f9fa,
      shade: 0xced4da,
      trim: 0xfab005,
      belt: 0xfab005,
    },
    sleeves: 0xf8f9fa,
    hands: SKIN,
    head: { kind: "hair", color: 0xffe066, shade: 0xf59f00, accent: 0xfab005 },
    weapon: "crystalStaff",
  },
  nyx: {
    scale: 0.95,
    skin: SKIN_SHADE,
    skinShade: 0x9c6b4e,
    legs: 0x212529,
    boots: 0x111317,
    body: {
      kind: "tunic",
      color: 0x5f3dc4,
      shade: 0x3b2483,
      belt: 0x212529,
      trim: 0x845ef7,
    },
    sleeves: 0x3b2483,
    hands: 0x212529,
    head: { kind: "mask", color: 0x5f3dc4, shade: 0x3b2483, eyes: 0xff6b6b },
    weapon: "daggers",
    cape: 0x3b2483,
  },
  nerea: {
    scale: 0.95,
    skin: 0x96f2d7,
    skinShade: 0x38d9a9,
    legs: 0x1864ab,
    boots: 0x38d9a9,
    body: {
      kind: "scales",
      color: 0x3bc9db,
      shade: 0x1098ad,
      trim: 0xc3fae8,
      belt: 0xfcc419,
    },
    sleeves: 0x96f2d7,
    hands: 0x96f2d7,
    head: {
      kind: "naiad",
      color: 0x1098ad,
      shade: 0x0b7285,
      accent: 0xfcc419,
      hair: 0xc3fae8,
    },
    weapon: "trident",
  },
  squalor: {
    scale: 1.05,
    skin: 0x5f7fb3,
    skinShade: 0x3b5683,
    legs: 0x343a40,
    boots: 0x3b5683,
    body: {
      kind: "muscle",
      color: 0x5f7fb3,
      shade: 0x3b5683,
      trim: 0xe9ecef,
      belt: 0x343a40,
    },
    sleeves: 0x5f7fb3,
    hands: 0x5f7fb3,
    head: {
      kind: "shark",
      color: 0x5f7fb3,
      shade: 0x3b5683,
      accent: 0xe9ecef,
      eyes: 0xffd43b,
    },
    weapon: "claws",
  },
  gorr: {
    kind: "golem",
    scale: 1,
    // colors taken from Gorr's timeline icon
    stone: 0x868e96,
    stoneDark: 0x5c636a,
    stoneLight: 0xadb5bd,
    moss: 0x82c91e,
    mossDark: 0x5c940d,
    eyes: 0x3bc9db,
    eyesLight: 0x99e9f2,
  },
}

// ─── Drawing ────────────────────────────────────────────────────────────────

interface Rig {
  root: Container
  body: Container
  legFar: Container
  legNear: Container
  armFar: Container
  armNear: Container
  torso: Container
  head: Container
  headBack: Container
  glows: Sprite[]
  /** Pivot of the body (hips) and rest height of the head. */
  hip: number
  headY: number
  /** How much arms swing while walking. */
  armSwing: number
}

const HIP = -16
const SHOULDER = -31
const HEAD_Y = -43

function glow(color: number, radius: number, x = 0, y = 0) {
  const sprite = new Sprite(softCircle())
  sprite.anchor.set(0.5)
  sprite.tint = color
  sprite.blendMode = "add"
  sprite.scale.set((radius * 2) / 64)
  sprite.position.set(x, y)
  return sprite
}

function leg(style: Style, shade: boolean) {
  const c = new Container()
  const g = new Graphics()
  const color = shade ? darken(style.legs) : style.legs
  g.roundRect(-2.6, -1, 5.2, 14, 2).fill(color).stroke(LINE)
  // the foot points towards the facing direction
  g.ellipse(1.6, 14.5, 3.8, 2.4)
    .fill(shade ? darken(style.boots) : style.boots)
    .stroke(LINE)
  c.addChild(g)
  return c
}

/**
 * An arm. `far` is the off hand (sword of a sword and shield, nothing for
 * the others); `shade` darkens it when it is on the side away from the
 * viewer.
 */
function arm(style: Style, far: boolean, front: boolean, shade = far) {
  const c = new Container()
  const g = new Graphics()
  const sleeve = shade ? darken(style.sleeves) : style.sleeves
  const hand = shade ? darken(style.hands) : style.hands
  g.roundRect(-2.5, -1, 5, 12, 2.2).fill(sleeve).stroke(LINE)
  g.circle(0, 13, 2.7).fill(hand).stroke(LINE)

  const glows: Sprite[] = []
  const item = new Graphics()

  switch (style.weapon) {
    case "staff":
    case "crystalStaff":
      if (!far) {
        item.roundRect(-1.2, -34, 2.6, 56, 1).fill(0x8d5a2b).stroke(LINE)
        if (style.weapon === "staff") {
          item.circle(0, -37, 4.2).fill(0x74c0fc).stroke(LINE)
          item.circle(-1.2, -38.2, 1.4).fill(0xffffff)
          glows.push(glow(0x74c0fc, 12, 0, -37))
        } else {
          item
            .poly([0, -44, 4, -37, 0, -30, -4, -37])
            .fill(0x69db7c)
            .stroke(LINE)
          item
            .poly([0, -44, 1.5, -37, 0, -32])
            .fill({ color: 0xffffff, alpha: 0.5 })
          glows.push(glow(0x69db7c, 12, 0, -37))
        }
        // front view: the arm is behind the robe, hold the staff beside it
        item.position.set(front ? 5 : 0.5, 13)
      }
      break
    case "bow":
      if (!far) {
        item
          .moveTo(2, -10)
          .quadraticCurveTo(13, 5, 2, 21)
          .stroke({ width: 3.2, color: OUTLINE })
        item
          .moveTo(2, -10)
          .quadraticCurveTo(13, 5, 2, 21)
          .stroke({ width: 1.8, color: 0xc08a4a })
        item
          .moveTo(2, -10)
          .lineTo(2, 21)
          .stroke({ width: 0.8, color: 0xe9ecef })
        item.position.set(1, 8)
      }
      break
    case "swordShield":
      if (far) {
        item
          .poly([-1.6, 0, 1.6, 0, 1.6, -20, 0, -23, -1.6, -20])
          .fill(0xe9ecef)
          .stroke(LINE)
        item.rect(-4.5, 0, 9, 2.2).fill(0xfab005).stroke(LINE)
        item.roundRect(-1.2, 2, 2.4, 5, 1).fill(0x7f4f24).stroke(LINE)
        item.position.set(0, 11)
      } else if (front) {
        item
          .circle(0, 0, 8.5)
          .fill(0x1c7ed6)
          .stroke({ width: 1.6, color: OUTLINE })
        item
          .circle(0, 0, 8.5)
          .stroke({ width: 1.5, color: 0xfab005, alignment: 1 })
        item.circle(0, 0, 2.5).fill(0xfab005).stroke(LINE)
        item.circle(-3, -3, 2).fill({ color: 0xffffff, alpha: 0.25 })
        item.position.set(3, 13)
      } else {
        // seen from the back: the wooden back of the shield sticks out
        item
          .ellipse(0, 0, 4.5, 8.5)
          .fill(0x7f4f24)
          .stroke({ width: 1.6, color: OUTLINE })
        item.rect(-1, -6, 2, 12).fill(0x5c3a1a)
        item.position.set(6, 12)
      }
      break
    case "daggers":
      item
        .poly([0, 0, 9, -5, 10, -3, 1, 2])
        .fill(shade ? 0xadb5bd : 0xe9ecef)
        .stroke(LINE)
      item.position.set(1, 13)
      break
    case "trident":
      if (!far) {
        item.roundRect(-1.1, -36, 2.4, 58, 1).fill(0xfab005).stroke(LINE)
        // three prongs
        item
          .poly([-6, -38, 6, -38, 6, -36, -6, -36])
          .fill(0xfcc419)
          .stroke(LINE)
        for (const x of [-5, 0, 5]) {
          item
            .poly([x - 1.2, -37, x + 1.2, -37, x, -45])
            .fill(0xfcc419)
            .stroke(LINE)
        }
        glows.push(glow(0x66d9e8, 8, 0, -40))
        item.position.set(front ? 5 : 0.5, 13)
      }
      break
    case "claws":
      for (const dx of [-2, 0, 2]) {
        item
          .poly([dx - 0.7, 14, dx + 0.7, 14, dx + 1.5, 18.5])
          .fill(0xf8f9fa)
          .stroke({ width: 0.8, color: OUTLINE })
      }
      break
  }

  // glows belong to the held item (the staff's orb), not to the arm
  const held = new Container()
  held.position.copyFrom(item.position)
  item.position.set(0, 0)
  held.addChild(item, ...glows)
  c.addChild(g, held)
  return { container: c, glows }
}

function torso(style: Style, front: boolean) {
  const c = new Container()
  const g = new Graphics()
  const { color, shade, trim, belt, kind } = style.body

  switch (kind) {
    case "robe":
      g.poly([-8, -35, 8, -35, 12, -2, -12, -2]).fill(color).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -2, -12, -2]).fill(shade)
      if (trim) g.rect(-12, -5, 24, 3).fill(trim)
      if (belt) g.rect(-9.5, -21, 19, 2.6).fill(belt)
      if (front) g.poly([-2, -35, 2, -35, 1, -21, -1, -21]).fill(shade)
      break
    case "tunic":
      g.poly([-8, -35, 8, -35, 9.5, -12, -9.5, -12]).fill(color).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -12, -9.5, -12]).fill(shade)
      if (belt) g.rect(-9.2, -19, 18.4, 3).fill(belt)
      if (trim && front) g.rect(1, -19, 3, 3).fill(trim)
      break
    case "scales": {
      // fitted scale armor and a skirt of fins
      g.poly([-8, -35, 8, -35, 9, -14, -9, -14]).fill(color).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -14, -9, -14]).fill(shade)
      for (let y = -32; y < -16; y += 4) {
        for (let x = -6 + ((y / 4) % 2 ? 2 : 0); x < 8; x += 4) {
          g.moveTo(x + 2, y)
            .arc(x, y, 2, 0, Math.PI)
            .stroke({ width: 0.8, color: shade, alpha: 0.9 })
        }
      }
      if (belt) g.rect(-9, -16, 18, 2.5).fill(belt)
      g.poly([-10, -14, 10, -14, 12, -4, 6, -7, 2, -2, -3, -7, -8, -3, -12, -5])
        .fill(trim ?? color)
        .stroke(LINE)
      break
    }
    case "muscle": {
      // bare shark torso, pale belly, dark shorts
      g.poly([-10, -36, 10, -36, 9, -14, -9, -14]).fill(color).stroke(LINE)
      g.poly([-10, -36, -4, -36, -4, -14, -9, -14]).fill(shade)
      if (front) {
        g.ellipse(2, -24, 5.5, 9).fill(trim ?? 0xffffff)
        g.moveTo(-1, -26)
          .lineTo(5, -26)
          .stroke({ width: 0.8, color: shade, alpha: 0.6 })
        g.moveTo(-1, -21)
          .lineTo(5, -21)
          .stroke({ width: 0.8, color: shade, alpha: 0.6 })
      }
      g.poly([-9.5, -15, 9.5, -15, 10, -9, -10, -9])
        .fill(belt ?? 0x343a40)
        .stroke(LINE)
      break
    }
    case "armor":
      g.poly([-9, -35, 9, -35, 10, -13, -10, -13]).fill(color).stroke(LINE)
      g.poly([-9, -35, -3, -35, -4, -13, -10, -13]).fill(shade)
      if (front)
        g.poly([-5, -32, 7, -32, 6, -22, -4, -22]).fill({
          color: 0xffffff,
          alpha: 0.25,
        })
      if (belt) g.rect(-10, -18, 20, 3).fill(belt)
      if (trim)
        g.poly([-10, -13, 10, -13, 8, -8, -8, -8]).fill(trim).stroke(LINE)
      g.circle(-8, -32, 4.5).fill(shade).stroke(LINE)
      g.circle(8, -32, 4.5).fill(color).stroke(LINE)
      break
  }

  // rim light on the lit side
  const bottom =
    kind === "robe" ? -2 : kind === "tunic" || kind === "armor" ? -12 : -14
  const edge = kind === "robe" ? 12 : 9.5
  g.poly([5, -35, 8, -35, edge, bottom, edge - 3, bottom]).fill({
    color: 0xffffff,
    alpha: 0.14,
  })

  // cape is seen fully from the back, only a sliver from the front
  if (style.cape && !front) {
    g.poly([-9, -35, 9, -35, 12, -6, 0, -3, -12, -6])
      .fill(style.cape)
      .stroke(LINE)
    g.poly([-9, -35, -3, -35, -4, -4, -12, -6]).fill(darken(style.cape))
  }
  if (style.head.kind === "shark" && !front) {
    // tail sticking out at the back
    g.poly([-2, -12, 2, -12, 6, -4, 10, -9, 9, 1, 0, -5])
      .fill(color)
      .stroke(LINE)
  }
  if (style.weapon === "bow" && !front) {
    g.roundRect(-6, -38, 5, 17, 2).fill(0x7f4f24).stroke(LINE)
    g.rect(-5.5, -41, 1.5, 4).fill(0xe03131)
    g.rect(-3.5, -42, 1.5, 5).fill(0xe03131)
  }

  c.addChild(g)
  return c
}

function head(style: Style, front: boolean) {
  const c = new Container()
  const g = new Graphics()
  /** Drawn behind the torso (long hair seen from the front). */
  const behind = new Graphics()
  const h = style.head
  const glows: Sprite[] = []
  const skin = style.skin

  const face = () => {
    g.circle(0, 0, 8.5).fill(skin).stroke(LINE)
    g.poly([-8.5, 0, -4, -7, -6, 2, -5, 7]).fill(style.skinShade)
  }
  const eyes = (color = OUTLINE, glowColor?: number) => {
    g.rect(1.6, -1.5, 1.8, 2.6).fill(color)
    g.rect(5.4, -1.5, 1.8, 2.6).fill(color)
    if (glowColor)
      glows.push(glow(glowColor, 6, 3.5, -0.5), glow(glowColor, 6, 7.2, -0.5))
  }

  switch (h.kind) {
    case "wizard":
      if (front) {
        face()
        eyes()
        g.poly([-1, 2, 9, 1, 6, 14, 2, 15, -2, 9]).fill(h.beard!).stroke(LINE)
        g.poly([1, 3, 9, 2, 7, 4]).fill(0xdee2e6)
      } else {
        g.poly([-8, 0, 8, 0, 7, 9, 0, 11, -7, 9]).fill(h.beard!).stroke(LINE)
        g.circle(0, 0, 8.5).fill(h.beard!).stroke(LINE)
        for (const x of [-4, 0, 4]) {
          g.moveTo(x, -2)
            .lineTo(x * 1.2, 9)
            .stroke({ width: 1, color: 0xadb5bd })
        }
      }
      g.ellipse(0, -6, 13, 3.6).fill(h.shade!).stroke(LINE)
      g.poly([-8, -7, 8, -7, 3, -18, -6, -27, -3, -16])
        .fill(h.color)
        .stroke(LINE)
      g.poly([-8, -7, -2, -7, -3, -16, -6, -27]).fill(h.shade!)
      if (front) g.star(2, -12, 5, 2.4, 1).fill(h.accent!)
      break

    case "hood":
      if (front) {
        g.circle(0, 0, 9.8).fill(h.color).stroke(LINE)
        g.ellipse(2.5, 1.5, 6.5, 6.8).fill(skin).stroke(LINE)
        g.poly([-4, -5, 6, -6, 9, -1, 0, -2]).fill(h.hair!)
        eyes()
        g.poly([-9.8, 0, -6, -8, -5, 8]).fill(h.shade!)
      } else {
        g.circle(0, 0, 9.8).fill(h.color).stroke(LINE)
        g.poly([-6, 4, 4, 4, 2, 14, -4, 13]).fill(h.hair!).stroke(LINE)
        g.poly([-9.8, 0, -6, -8, -5, 8]).fill(h.shade!)
      }
      g.poly([-3, -9, 3, -9, -6, -15]).fill(h.color).stroke(LINE)
      break

    case "helmet":
      if (front) {
        face()
        eyes()
        g.poly([-1, 3, 8, 3, 6, 10, 0, 9]).fill(h.beard!).stroke(LINE)
      } else {
        g.circle(0, 0, 8.5).fill(h.color).stroke(LINE)
      }
      g.arc(0, -0.5, 9.2, Math.PI, 0).fill(h.color).stroke(LINE)
      g.rect(-9.2, -2.5, 18.4, 2.5).fill(h.shade!).stroke(LINE)
      if (front) g.rect(3.5, -2.5, 1.8, 6).fill(h.shade!)
      g.ellipse(-2, -6, 3, 1.5).fill({ color: 0xffffff, alpha: 0.4 })
      g.poly([-1, -9, 3, -12, -5, -16, -12, -12, -10, -8])
        .fill(h.accent!)
        .stroke(LINE)
      break

    case "hair":
      if (front) {
        // long hair falls behind the shoulders
        behind
          .poly([-9, -2, 9, -2, 11, 17, -11, 17])
          .fill(h.shade!)
          .stroke(LINE)
        behind.poly([-9, -2, -3, -2, -5, 17, -11, 17]).fill(darken(h.shade!))
        face()
        eyes()
        g.poly([-9, -1, -8, -8, 0, -11, 8, -8, 9, -2, 4, -6, -3, -5])
          .fill(h.color)
          .stroke(LINE)
        g.circle(4.5, 4, 1).fill(0xf783ac)
      } else {
        g.poly([-9, 0, 9, 0, 10, 18, -10, 18]).fill(h.color).stroke(LINE)
        g.circle(0, 0, 8.6).fill(h.color).stroke(LINE)
        for (const x of [-5, 0, 5]) {
          g.moveTo(x, -4)
            .lineTo(x * 1.1, 17)
            .stroke({ width: 1, color: h.shade!, alpha: 0.8 })
        }
      }
      g.ellipse(0, -8, 8.5, 2.2).stroke({ width: 1.6, color: h.accent! })
      glows.push(glow(0xfff3bf, 10, 0, -9))
      break

    case "naiad": {
      // fin-shaped ears on both sides
      const fins = () => {
        g.poly([-8, -2, -14, -6, -12, 2, -8, 3]).fill(h.hair!).stroke(LINE)
        g.poly([8, -2, 14, -6, 12, 2, 8, 3]).fill(h.hair!).stroke(LINE)
      }
      if (front) {
        // seaweed hair falls behind the shoulders
        behind
          .poly([-10, -3, 10, -3, 12, 18, 6, 14, 0, 19, -6, 14, -12, 18])
          .fill(h.shade!)
          .stroke(LINE)
        fins()
        face()
        eyes(0x0b7285)
        g.poly([-9, -1, -8, -8, 0, -11, 8, -8, 9, -2, 5, -7, -2, -6])
          .fill(h.color)
          .stroke(LINE)
      } else {
        fins()
        g.poly([-10, 0, 10, 0, 11, 19, 5, 15, 0, 20, -5, 15, -11, 19])
          .fill(h.color)
          .stroke(LINE)
        g.circle(0, 0, 8.8).fill(h.color).stroke(LINE)
        for (const x of [-5, 0, 5]) {
          g.moveTo(x, -4)
            .lineTo(x * 1.1, 16)
            .stroke({ width: 1, color: h.shade!, alpha: 0.8 })
        }
      }
      // shell circlet
      g.circle(-3, -8, 1.8)
        .fill(h.accent!)
        .stroke({ width: 0.8, color: OUTLINE })
      g.circle(3, -9, 2.2).fill(0xffc9c9).stroke({ width: 0.8, color: OUTLINE })
      break
    }

    case "shark": {
      // elongated head with a snout towards the facing direction
      g.poly([-8, -6, 4, -8, 13, -3, 14, 2, 8, 6, -6, 7, -9, 1])
        .fill(h.color)
        .stroke(LINE)
      g.poly([-8, -6, -3, -7, -3, 7, -6, 7, -9, 1]).fill(h.shade!)
      // dorsal fin
      g.poly([-4, -7, 0, -7, -6, -17]).fill(h.shade!).stroke(LINE)
      if (front) {
        // pale jaw full of teeth
        g.poly([-2, 2, 13, 1, 8, 6, -4, 7]).fill(h.accent!).stroke(LINE)
        for (let x = 0; x < 12; x += 2.5) {
          g.poly([x, 2, x + 1.2, 2, x + 0.6, 4]).fill(0xffffff)
        }
        g.circle(6, -3, 1.5).fill(h.eyes!)
        g.circle(6.3, -3.3, 0.5).fill(0x000000)
        // gills
        for (const x of [-4, -2])
          g.moveTo(x, -2)
            .lineTo(x - 1, 4)
            .stroke({ width: 0.8, color: h.shade! })
      }
      break
    }

    case "mask":
      g.circle(0, 0, 9.4).fill(h.color).stroke(LINE)
      g.poly([-9.4, 0, -6, -8, -5, 8]).fill(h.shade!)
      if (front) {
        g.ellipse(3, 0, 6, 5.5).fill(0x212529).stroke(LINE)
        eyes(h.eyes!, h.eyes!)
        g.poly([-3, 4, 9, 3, 7, 9, -2, 9]).fill(0x343a40).stroke(LINE)
      }
      g.poly([-2, -8, 4, -9, -8, -16]).fill(h.color).stroke(LINE)
      break
  }

  c.addChild(g, ...glows)
  return { container: c, glows, behind }
}

function darken(color: number, factor = 0.72) {
  const r = Math.round(((color >> 16) & 0xff) * factor)
  const g = Math.round(((color >> 8) & 0xff) * factor)
  const b = Math.round((color & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}

function buildRig(style: Style, front: boolean): Rig {
  const root = new Container()
  const body = new Container()
  root.addChild(body)

  /*
   * Which side is closer to the viewer. Facing SE (front view, looking to
   * the right), the character's left flank faces us: the screen-left limbs
   * are in front and the right ones (towards the gaze) behind the body.
   * Facing NE (back view), it is the other way round. The weapon arm stays
   * on the gaze side ("near" in poses: it is the one that strikes), so in
   * the front view it is held a little behind the body, like an archer's
   * bow arm or a shield arm stretched towards the target.
   */
  const legFar = leg(style, true)
  const legNear = leg(style, false)
  legFar.position.set(front ? 3.5 : -3.5, HIP)
  legNear.position.set(front ? -3 : 3, HIP)

  // `far`: the off hand, on the screen-left; `near`: the weapon arm
  const far = arm(style, true, front, !front)
  const near = arm(style, false, front, front)
  far.container.position.set(-8.5, SHOULDER)
  near.container.position.set(8, SHOULDER)

  const t = torso(style, front)
  const hd = head(style, front)
  hd.container.position.set(1, HEAD_Y)
  hd.behind.position.copyFrom(hd.container.position)

  if (front)
    // front view: the weapon arm (gaze side) behind, the off hand in front
    body.addChild(
      legFar,
      legNear,
      near.container,
      hd.behind,
      t,
      hd.container,
      far.container,
    )
  else
    // back view: the off hand behind, the weapon arm in front
    body.addChild(
      far.container,
      legFar,
      legNear,
      t,
      hd.container,
      near.container,
    )

  root.scale.set(style.scale)
  return {
    root,
    body,
    legFar,
    legNear,
    armFar: far.container,
    armNear: near.container,
    torso: t,
    head: hd.container,
    headBack: hd.behind,
    glows: [...far.glows, ...near.glows, ...hd.glows],
    hip: HIP,
    headY: HEAD_Y,
    armSwing: 1,
  }
}

// ─── Golem ──────────────────────────────────────────────────────────────────

const GOLEM_HIP = -12
const GOLEM_SHOULDER = -37
const GOLEM_HEAD_Y = -44

function buildGolemRig(s: GolemStyle, front: boolean): Rig {
  const root = new Container()
  const body = new Container()
  root.addChild(body)
  const glows: Sprite[] = []

  // short, stubby legs
  const golemLeg = (dark: boolean) => {
    const c = new Container()
    const g = new Graphics()
    g.roundRect(-4.5, -1, 9, 10, 3)
      .fill(dark ? s.stoneDark : s.stone)
      .stroke(LINE)
    g.roundRect(-5.5, 7, 12, 6, 2.5)
      .fill(dark ? darken(s.stoneDark) : s.stoneDark)
      .stroke(LINE)
    c.addChild(g)
    return c
  }
  const legFar = golemLeg(true)
  const legNear = golemLeg(false)
  // same sides as the humanoids: facing SE, the gaze side is the far one
  legFar.position.set(front ? 6 : -7, GOLEM_HIP)
  legNear.position.set(front ? -7 : 6, GOLEM_HIP)

  // long arms reaching the ground, huge fists
  const golemArm = (dark: boolean) => {
    const c = new Container()
    const g = new Graphics()
    const main = dark ? s.stoneDark : s.stone
    g.roundRect(-5, -2, 10, 17, 4).fill(main).stroke(LINE)
    g.roundRect(-5.5, 13, 11, 13, 4)
      .fill(dark ? darken(s.stoneDark) : s.stoneDark)
      .stroke(LINE)
    g.circle(0, 29, 7).fill(main).stroke(LINE)
    g.moveTo(-3, 26)
      .lineTo(-3, 31)
      .stroke({ width: 1, color: OUTLINE, alpha: 0.5 })
    g.moveTo(1, 26)
      .lineTo(1, 32)
      .stroke({ width: 1, color: OUTLINE, alpha: 0.5 })
    if (!dark) {
      g.ellipse(-1.5, 4, 2.5, 4).fill({ color: s.stoneLight, alpha: 0.7 })
      g.ellipse(-2.5, 27, 2, 1.5).fill({ color: 0xffffff, alpha: 0.18 })
    }
    c.addChild(g)
    return c
  }
  const armFar = golemArm(true)
  const armNear = golemArm(false)
  armFar.position.set(front ? 15 : -15, GOLEM_SHOULDER)
  armNear.position.set(front ? -15 : 15, GOLEM_SHOULDER)

  // wide boulder torso with light stone plates, moss and cracks
  const torso = new Container()
  const t = new Graphics()
  t.poly([-16, -42, 14, -44, 19, -27, 13, -11, -12, -11, -18, -25])
    .fill(s.stone)
    .stroke(LINE)
  t.poly([-16, -42, -6, -43, -8, -11, -12, -11, -18, -25]).fill(s.stoneDark)
  t.ellipse(5, -33, 6, 4).fill(s.stoneLight)
  t.ellipse(-3, -19, 4.5, 3).fill(s.stoneLight)
  t.moveTo(9, -24)
    .lineTo(5, -19)
    .lineTo(7, -14)
    .stroke({ width: 1, color: OUTLINE, alpha: 0.55 })
  t.moveTo(-10, -36)
    .lineTo(-6, -30)
    .stroke({ width: 1, color: OUTLINE, alpha: 0.55 })
  if (front) {
    // mossy belly
    t.ellipse(4, -17, 5, 2.4).fill(s.mossDark)
    t.ellipse(5, -18, 3, 1.4).fill(s.moss)
  } else {
    // mossy back and a ridge of stones
    t.poly([-14, -42, 12, -43, 10, -36, -12, -35]).fill(s.mossDark)
    for (const [x, y] of [
      [-6, -38],
      [0, -31],
      [5, -24],
    ]) {
      t.circle(x, y, 3.2).fill(s.stoneLight).stroke(LINE)
    }
  }
  // shoulder boulders
  t.circle(-14, -38, 7.5).fill(s.stoneDark).stroke(LINE)
  t.circle(13, -39, 7.5).fill(s.stone).stroke(LINE)
  t.ellipse(12, -44, 6, 2.6).fill(s.moss)
  torso.addChild(t)

  // block head sunk between the shoulders, moss cap, glowing eyes
  const head = new Container()
  const h = new Graphics()
  h.poly([-9, -5, -2, -10, 8, -9, 11, -2, 9, 7, -6, 8, -10, 1])
    .fill(s.stone)
    .stroke(LINE)
  h.poly([-9, -5, -4, -9, -5, 8, -6, 8, -10, 1]).fill(s.stoneDark)
  // moss cap with stripes, like the icon
  h.poly([-10, -3, -3, -11, 9, -10, 12, -3, 8, -5, 3, -4, -2, -6, -6, -3])
    .fill(s.moss)
    .stroke(LINE)
  for (const x of [-5, 0, 5]) {
    h.moveTo(x, -9)
      .lineTo(x + 1, -4)
      .stroke({ width: 1.6, color: s.mossDark })
  }
  if (front) {
    h.roundRect(1.5, -1.5, 3.4, 2.6, 0.8).fill(s.eyes)
    h.roundRect(6.4, -1.5, 3.4, 2.6, 0.8).fill(s.eyes)
    h.rect(2.3, -1, 1.4, 1.2).fill(s.eyesLight)
    h.rect(7.2, -1, 1.4, 1.2).fill(s.eyesLight)
    h.moveTo(2, 4)
      .lineTo(9, 3.5)
      .stroke({ width: 1.2, color: OUTLINE, alpha: 0.6 })
    glows.push(glow(s.eyes, 6, 3.2, -0.3), glow(s.eyes, 6, 8.1, -0.3))
  } else {
    h.poly([-8, -4, 10, -5, 9, 2, -7, 3]).fill(s.mossDark)
  }
  head.addChild(h, ...glows)
  head.position.set(3, GOLEM_HEAD_Y)

  // the shaded (far) limbs behind the body, the light (near) ones in front
  body.addChild(legFar, legNear, armFar, torso, head, armNear)

  root.scale.set(s.scale)
  return {
    root,
    body,
    legFar,
    legNear,
    armFar,
    armNear,
    torso,
    head,
    headBack: new Container(),
    glows,
    hip: GOLEM_HIP,
    headY: GOLEM_HEAD_Y,
    armSwing: 0.6,
  }
}

// ─── Puppet ─────────────────────────────────────────────────────────────────

export interface Pose {
  legFar: number
  legNear: number
  armFar: number
  armNear: number
  bodyY: number
  bodyRot: number
  headY: number
  torsoScale: number
  glowBoost: number
}

/**
 * Pose of a puppet at a given time: idle breathing, walk cycle, then the
 * current action (progress 0..1) on top. Pure, so it can be tested.
 */
export function computePose(
  time: number,
  walking: boolean,
  action: { kind: PuppetAction; progress: number } | null,
  armSwing = 1,
  swimming = false,
): Pose {
  const breathe = Math.sin(time / 420)
  const pose: Pose = {
    legFar: 0,
    legNear: 0,
    armFar: 0.08 + breathe * 0.04,
    armNear: -0.08 - breathe * 0.04,
    bodyY: 0,
    bodyRot: 0,
    headY: breathe * 0.6,
    torsoScale: 1 + breathe * 0.015,
    glowBoost: 1,
  }

  if (swimming) {
    // breaststroke: both arms sweep forward and back, the body bobs
    const phase = time / (walking ? 140 : 320)
    pose.armNear = -1.2 + Math.sin(phase) * 1.1
    pose.armFar = -1.2 + Math.sin(phase + 0.6) * 1.1
    pose.legFar = Math.sin(phase * 2) * 0.4
    pose.legNear = -pose.legFar
    pose.bodyY = Math.sin(phase) * 1.5
    pose.bodyRot = 0.12
  } else if (walking) {
    const phase = time / 85
    pose.legFar = Math.sin(phase) * 0.55
    pose.legNear = -pose.legFar
    pose.armFar = -Math.sin(phase) * 0.45 * armSwing
    pose.armNear = Math.sin(phase) * 0.45 * armSwing
    pose.bodyY = -Math.abs(Math.sin(phase)) * 1.8
  }

  if (action) {
    const p = Math.max(0, Math.min(1, action.progress))
    const bell = Math.sin(p * Math.PI)
    switch (action.kind) {
      case "melee":
        pose.armNear =
          p < 0.35 ? 1.3 * (p / 0.35) : 1.3 - 3 * ((p - 0.35) / 0.65)
        pose.armFar = -0.6 * bell
        pose.bodyRot = 0.18 * bell
        pose.legNear = -0.35 * bell
        break
      case "shoot":
        pose.armNear = -1.45 * Math.min(1, p * 4)
        pose.armFar = -1.2 + 0.9 * Math.max(0, (p - 0.6) / 0.4)
        pose.bodyRot = -0.05 * bell
        break
      case "cast":
        pose.armNear = -2.5 * bell
        pose.armFar = -2.2 * bell
        pose.bodyY -= 2 * bell
        pose.glowBoost = 1 + 2.5 * bell
        break
      case "roar":
        pose.armNear = -2.6 * bell
        pose.armFar = -2.6 * bell
        pose.bodyRot = -0.12 * bell
        pose.headY -= 2 * bell
        pose.glowBoost = 1 + 1.5 * bell
        break
      case "hit":
        pose.bodyRot = -0.3 * bell
        pose.armNear = 0.6 * bell
        pose.armFar = 0.6 * bell
        break
    }
  }
  return pose
}

export const isBackFacing = (facing: Facing) =>
  facing === "NE" || facing === "NW"
export const isMirrored = (facing: Facing) => facing === "SW" || facing === "NW"

export class Puppet extends Container {
  private _front: Rig
  private _back: Rig
  private _facing: Facing = "SE"
  private _time = Math.random() * 10_000
  private _walk = 0
  private _swimming = false
  private _action: {
    kind: PuppetAction
    elapsed: number
    duration: number
  } | null = null

  constructor(readonly presetId: string) {
    super()
    const style = STYLES[presetId]
    if (!style) throw new Error(`No puppet style for "${presetId}"`)
    const build = (front: boolean) =>
      style.kind === "golem"
        ? buildGolemRig(style, front)
        : buildRig(style, front)
    this._front = build(true)
    this._back = build(false)
    this.addChild(this._front.root, this._back.root)
    this.setFacing("SE")
  }

  get facing() {
    return this._facing
  }

  /** Visible rig (front or back view). */
  get rig() {
    return isBackFacing(this._facing) ? this._back : this._front
  }

  /** Approximate head height, for UI placement. */
  get headHeight() {
    return (
      (STYLES[this.presetId].kind === "golem" ? 56 : 54) *
      STYLES[this.presetId].scale
    )
  }

  get currentAction() {
    return this._action?.kind ?? null
  }

  get isWalking() {
    return this._walk > 0
  }

  get isSwimming() {
    return this._swimming
  }

  /** Swim animation (the fighter is in water up to the chest). */
  setSwimming(swimming: boolean) {
    this._swimming = swimming
  }

  setFacing(facing: Facing) {
    this._facing = facing
    this._front.root.visible = !isBackFacing(facing)
    this._back.root.visible = isBackFacing(facing)
    const scale = STYLES[this.presetId].scale
    for (const rig of [this._front, this._back]) {
      rig.root.scale.x = (isMirrored(facing) ? -1 : 1) * scale
    }
  }

  /** Walk cycle for the given duration (ms). */
  walk(duration: number) {
    this._walk = Math.max(this._walk, duration)
  }

  act(kind: PuppetAction, duration: number) {
    this._action = { kind, elapsed: 0, duration }
  }

  /** Recursively tint every graphic (hit flash). */
  flash(color: number) {
    const visit = (node: Container) => {
      for (const child of node.children) {
        if (child instanceof Graphics) child.tint = color
        if (child instanceof Container) visit(child)
      }
    }
    visit(this)
  }

  update(dt: number) {
    this._time += dt
    this._walk = Math.max(0, this._walk - dt)
    if (this._action) {
      this._action.elapsed += dt
      if (this._action.elapsed >= this._action.duration) this._action = null
    }

    const rig = this.rig
    const pose = computePose(
      this._time,
      this._walk > 0,
      this._action && {
        kind: this._action.kind,
        progress: this._action.elapsed / this._action.duration,
      },
      rig.armSwing,
      this._swimming,
    )

    rig.legFar.rotation = pose.legFar
    rig.legNear.rotation = pose.legNear
    rig.armFar.rotation = pose.armFar
    rig.armNear.rotation = pose.armNear
    rig.body.rotation = pose.bodyRot
    rig.body.pivot.set(0, rig.hip)
    rig.body.position.set(0, rig.hip + pose.bodyY)
    rig.torso.scale.y = pose.torsoScale
    rig.torso.y = (1 - pose.torsoScale) * -35
    rig.head.y = rig.headY + pose.headY
    rig.headBack.y = rig.head.y
    for (const g of rig.glows) {
      g.alpha =
        (0.55 + 0.25 * Math.sin(this._time / 260)) *
        Math.min(2.5, pose.glowBoost)
    }
  }
}

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
  /** How the character looks in deep water (swimmers and aquatics). */
  swim?: SwimKind
}

/**
 * Deep water forms: a crawl stroke with the head out (swimmers), a mermaid
 * floating upright with a tail (Néréa), only a dorsal fin (Squalor).
 */
type SwimKind = "crawl" | "mermaid" | "fin"

/** Mineral golem (Gorr): smooth massive stone, long arms, glowing eyes. */
interface GolemStyle {
  kind: "golem"
  scale: number
  stone: number
  stoneDark: number
  stoneLight: number
  eyes: number
  eyesLight: number
  swim?: undefined
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
    swim: "crawl",
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
    swim: "crawl",
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
    swim: "mermaid",
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
    swim: "fin",
  },
  gorr: {
    kind: "golem",
    scale: 1,
    // colors taken from Gorr's timeline icon
    stone: 0x868e96,
    stoneDark: 0x5c636a,
    stoneLight: 0xadb5bd,
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
  /** Shoulder of the off hand, and of the weapon arm (it strikes). */
  armFar: Container
  armNear: Container
  elbowFar: Container
  elbowNear: Container
  /** Grips that hold an item keep its own angle (null: rigid hand). */
  gripFar: Container | null
  gripNear: Container | null
  /** Rest angle of each held item (0 = upright, + = tilted forward). */
  itemFar: number
  itemNear: number
  /** Stance of the weapon arm added to every pose (a shield on guard). */
  guard: { arm: number; elbow: number }
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

// ─── Arms ───────────────────────────────────────────────────────────────────

/** Upper arm and forearm lengths (shoulder → elbow → wrist). */
const UPPER_ARM = 7.5
const FOREARM = 7

/**
 * An articulated arm: shoulder → upper arm → elbow → forearm → hand. A held
 * item hangs from the `grip` (in the hand), with its own angle: the puppet
 * keeps it upright (a staff, a bow) or points it (a thrust) whatever the
 * arm does. "Up" in the grip is the item's natural direction (-y).
 */
interface Arm {
  shoulder: Container
  elbow: Container
  grip: Container
  glows: Sprite[]
  /** Whether the grip holds an item that keeps its own angle. */
  holds: boolean
}

/**
 * Shield stance: arm slightly bent, the forearm across the flank, the
 * shield held close to the body and upright.
 */
const SHIELD_GUARD = { arm: 0, elbow: -0.45 }
const SHIELD_UPRIGHT = -(SHIELD_GUARD.arm + SHIELD_GUARD.elbow)

/** What a hand holds: the weapon arm, or the off hand. */
type Hand = "weapon" | "off"

function arm(style: Style, hand: Hand, front: boolean, shade: boolean): Arm {
  const sleeve = shade ? darken(style.sleeves, 0.82) : style.sleeves
  const skin = shade ? darken(style.hands, 0.82) : style.hands

  const shoulder = new Container()
  const upper = new Graphics()
    .roundRect(-2.6, -1.8, 5.2, UPPER_ARM + 3, 2.4)
    .fill(sleeve)
    .stroke(LINE)
  // armor: the pauldron belongs to the arm (it follows its depth)
  if (style.body.kind === "armor") {
    const plate = shade ? style.body.shade : style.body.color
    upper.circle(0, 0.5, 4.6).fill(plate).stroke(LINE)
    upper.ellipse(-1, -1, 2, 1.2).fill({ color: 0xffffff, alpha: 0.25 })
  }
  const elbow = new Container()
  elbow.position.set(0, UPPER_ARM)
  const forearm = new Graphics()
    .roundRect(-2.3, -1.6, 4.6, FOREARM + 1.8, 2.2)
    .fill(sleeve)
    .stroke(LINE)
  const grip = new Container()
  grip.position.set(0, FOREARM)
  const fist = new Graphics().circle(0, 0, 2.7).fill(skin).stroke(LINE)

  const item = new Graphics()
  /** Strapped to the forearm (a shield), drawn over it. */
  const strapped = new Graphics()
  const glows: Sprite[] = []
  let holds = false

  switch (style.weapon) {
    case "staff":
    case "crystalStaff":
      if (hand !== "weapon") break
      holds = true
      // held a third of the way down: the shaft goes through the fist
      item.roundRect(-1.3, -34, 2.6, 52, 1).fill(0x8d5a2b).stroke(LINE)
      if (style.weapon === "staff") {
        item.circle(0, -37, 4.2).fill(0x74c0fc).stroke(LINE)
        item.circle(-1.2, -38.2, 1.4).fill(0xffffff)
        glows.push(glow(0x74c0fc, 12, 0, -37))
      } else {
        item.poly([0, -45, 4, -38, 0, -31, -4, -38]).fill(0x69db7c).stroke(LINE)
        item
          .poly([0, -45, 1.5, -38, 0, -33])
          .fill({ color: 0xffffff, alpha: 0.5 })
        glows.push(glow(0x69db7c, 12, 0, -38))
      }
      break

    case "trident":
      if (hand !== "weapon") break
      holds = true
      item.roundRect(-1.1, -36, 2.3, 54, 1).fill(0xfab005).stroke(LINE)
      item.poly([-6, -38, 6, -38, 6, -36, -6, -36]).fill(0xfcc419).stroke(LINE)
      for (const x of [-5, 0, 5]) {
        item
          .poly([x - 1.2, -37, x + 1.2, -37, x, -45])
          .fill(0xfcc419)
          .stroke(LINE)
      }
      glows.push(glow(0x66d9e8, 8, 0, -40))
      break

    case "bow":
      if (hand !== "weapon") break
      holds = true
      // gripped in the middle; the limbs curve back towards the archer
      item
        .moveTo(-4, -16)
        .quadraticCurveTo(7, 0, -4, 16)
        .stroke({ width: 3.4, color: OUTLINE })
      item
        .moveTo(-4, -16)
        .quadraticCurveTo(7, 0, -4, 16)
        .stroke({ width: 2, color: 0xc08a4a })
      item
        .moveTo(-4, -16)
        .lineTo(-4, 16)
        .stroke({ width: 0.8, color: 0xe9ecef })
      break

    case "swordShield":
      if (hand === "off") {
        holds = true
        // hilt in the fist, blade above it
        item.roundRect(-1.1, -1, 2.2, 6, 1).fill(0x7f4f24).stroke(LINE)
        item.circle(0, 5.5, 1.6).fill(0xfab005).stroke(LINE)
        item.rect(-4.5, -3.2, 9, 2.2).fill(0xfab005).stroke(LINE)
        item
          .poly([-1.7, -3.2, 1.7, -3.2, 1.7, -22, 0, -25, -1.7, -22])
          .fill(shade ? 0xced4da : 0xf1f3f5)
          .stroke(LINE)
        item.rect(-0.3, -21, 0.6, 17).fill({ color: 0x868e96, alpha: 0.6 })
      } else {
        /*
         * Front view: the shield arm is the gaze side (the left arm), the
         * shield's face points away from us: we see its wooden back. Back
         * view: the painted face.
         */
        if (!front) {
          strapped.ellipse(0, 0, 6.5, 8.5).fill(0x1c7ed6).stroke({
            width: 1.6,
            color: OUTLINE,
          })
          strapped
            .ellipse(0, 0, 6.5, 8.5)
            .stroke({ width: 1.5, color: 0xfab005, alignment: 1 })
          strapped.ellipse(0.5, 0, 2, 2.5).fill(0xfab005).stroke(LINE)
          strapped
            .ellipse(-2.5, -3, 1.6, 2)
            .fill({ color: 0xffffff, alpha: 0.25 })
        } else {
          const wood = shade ? darken(0x7f4f24, 0.82) : 0x7f4f24
          strapped.ellipse(0, 0, 5, 8).fill(wood).stroke(LINE)
          strapped
            .ellipse(0, 0, 5, 8)
            .stroke({ width: 1.3, color: 0xadb5bd, alignment: 1 })
          for (const x of [-2, 2]) {
            strapped
              .moveTo(x, -7)
              .lineTo(x, 7)
              .stroke({ width: 0.8, color: darken(wood), alpha: 0.8 })
          }
          strapped.rect(-3.5, -1.5, 7, 3).fill(0x5c3a1a).stroke(LINE)
        }
        // strapped to the forearm, kept upright against the body
        strapped.position.set(1, FOREARM - 1)
        strapped.rotation = SHIELD_UPRIGHT
      }
      break

    case "daggers":
      holds = true
      item.roundRect(-1, -1, 2, 4.5, 0.8).fill(0x343a40).stroke(LINE)
      item
        .poly([-1.5, -1, 1.5, -1, 0.6, -10, 0, -12, -0.6, -10])
        .fill(shade ? 0xadb5bd : 0xe9ecef)
        .stroke(LINE)
      break

    case "claws":
      // the claws are part of the hand
      for (const dx of [-2, 0, 2]) {
        fist
          .poly([dx - 0.7, 1.5, dx + 0.7, 1.5, dx + 1.5, 6])
          .fill(0xf8f9fa)
          .stroke({ width: 0.8, color: OUTLINE })
      }
      break
  }

  // the fist closes over what it holds
  grip.addChild(item, ...glows, fist)
  elbow.addChild(forearm, grip, strapped)
  shoulder.addChild(upper, elbow)
  return { shoulder, elbow, grip, glows, holds }
}

/**
 * Natural angle of a held item, relative to the body (0 = straight up,
 * positive = tilted forward). The pose can then point it forward (thrust).
 */
function itemRest(weapon: Weapon, hand: Hand) {
  if (weapon === "daggers") return 1.15
  if (weapon === "swordShield" && hand === "off") return 2.4
  return 0
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
   * Which side faces the viewer. Facing SE (front view, looking to the
   * right), the character shows its left flank: the screen-left limbs are
   * near, the gaze-side ones (+x) far, behind everything (legs included).
   * Facing NE (back view), it is the other way round. The weapon arm stays
   * on the gaze side: in the front view it is held behind the body, like an
   * archer's bow arm or a shield arm stretched towards the target.
   */
  const legFar = leg(style, true)
  const legNear = leg(style, false)
  legFar.position.set(front ? 3.5 : -3.5, HIP)
  legNear.position.set(front ? -3 : 3, HIP)

  const weapon = arm(style, "weapon", front, front)
  const off = arm(style, "off", front, !front)
  // the arm behind the body sticks out of the torso, like a real arm seen
  // from three quarters; the one in front overlaps it
  weapon.shoulder.position.set(front ? 11 : 8, SHOULDER)
  off.shoulder.position.set(front ? -8.5 : -11, SHOULDER)
  const behind = front ? weapon.shoulder : off.shoulder
  const before = front ? off.shoulder : weapon.shoulder

  const t = torso(style, front)
  const hd = head(style, front)
  hd.container.position.set(1, HEAD_Y)
  hd.behind.position.copyFrom(hd.container.position)

  body.addChild(behind, legFar, legNear, hd.behind, t, hd.container, before)

  root.scale.set(style.scale)
  return {
    root,
    body,
    legFar,
    legNear,
    armFar: off.shoulder,
    armNear: weapon.shoulder,
    elbowFar: off.elbow,
    elbowNear: weapon.elbow,
    gripFar: off.holds ? off.grip : null,
    gripNear: weapon.holds ? weapon.grip : null,
    itemFar: itemRest(style.weapon, "off"),
    itemNear: itemRest(style.weapon, "weapon"),
    // a shield is held on guard, in front: the arm shows between the body
    // and the shield instead of hanging hidden behind them
    guard:
      style.weapon === "swordShield"
        ? { arm: SHIELD_GUARD.arm, elbow: SHIELD_GUARD.elbow }
        : { arm: 0, elbow: 0 },
    torso: t,
    head: hd.container,
    headBack: hd.behind,
    glows: [...off.glows, ...weapon.glows, ...hd.glows],
    hip: HIP,
    headY: HEAD_Y,
    armSwing: 1,
  }
}

// ─── Golem ──────────────────────────────────────────────────────────────────

const GOLEM_HIP = -12
const GOLEM_SHOULDER = -38
const GOLEM_HEAD_Y = -45

/**
 * Gorr, a mineral organism: smooth massive stone, a head sunk between the
 * shoulders, long two-part arms ending in round fists, glowing eyes and a
 * faint crystal core. Simple shapes, easy to read and to draw.
 */
function buildGolemRig(s: GolemStyle, front: boolean): Rig {
  const root = new Container()
  const body = new Container()
  root.addChild(body)
  const glows: Sprite[] = []

  const golemLeg = (dark: boolean) => {
    const c = new Container()
    const color = dark ? s.stoneDark : s.stone
    c.addChild(
      new Graphics()
        .roundRect(-5.5, -2, 11, 11, 5)
        .fill(color)
        .stroke(LINE)
        .roundRect(-6.5, 7, 14, 6.5, 3.2)
        .fill(dark ? darken(s.stoneDark) : s.stoneDark)
        .stroke(LINE),
    )
    return c
  }
  const legFar = golemLeg(true)
  const legNear = golemLeg(false)
  legFar.position.set(front ? 6.5 : -6.5, GOLEM_HIP)
  legNear.position.set(front ? -6.5 : 6.5, GOLEM_HIP)

  const golemArm = (dark: boolean) => {
    const color = dark ? s.stoneDark : s.stone
    const shoulder = new Container()
    const elbow = new Container()
    elbow.position.set(0, 12)
    const upper = new Graphics()
      .roundRect(-5.5, -4, 11, 18, 5.5)
      .fill(color)
      .stroke(LINE)
    const forearm = new Graphics()
      .roundRect(-6, -2, 12, 14, 6)
      .fill(color)
      .stroke(LINE)
      .circle(0, 14, 7.5)
      .fill(color)
      .stroke(LINE)
    if (!dark) {
      upper.ellipse(-2, 2, 2.2, 4).fill({ color: s.stoneLight, alpha: 0.7 })
      forearm.ellipse(-3, 11.5, 2.4, 1.8).fill({ color: 0xffffff, alpha: 0.2 })
    }
    elbow.addChild(forearm)
    shoulder.addChild(upper, elbow)
    return { shoulder, elbow }
  }
  // the striking arm is on the gaze side, like a humanoid's weapon arm
  const strike = golemArm(front)
  const other = golemArm(!front)
  strike.shoulder.position.set(15, GOLEM_SHOULDER)
  other.shoulder.position.set(-15, GOLEM_SHOULDER)
  const behind = front ? strike.shoulder : other.shoulder
  const before = front ? other.shoulder : strike.shoulder

  // a smooth boulder, shaded on the left, lit on the right
  const torso = new Container()
  const t = new Graphics()
  t.roundRect(-18, -48, 36, 39, 15).fill(s.stone).stroke(LINE)
  t.roundRect(-18, -48, 13, 39, 13).fill(s.stoneDark)
  t.roundRect(-18, -48, 36, 39, 15).stroke(LINE)
  t.ellipse(6, -40, 8, 3.5).fill({ color: s.stoneLight, alpha: 0.7 })
  if (front) {
    // faint crystal core
    t.poly([2, -33, 6, -28, 2, -23, -2, -28]).fill(s.eyesLight).stroke(LINE)
  } else {
    // smooth back ridge
    t.ellipse(0, -30, 4, 12).fill({ color: s.stoneDark, alpha: 0.5 })
  }
  torso.addChild(t)

  // the head sits low between the shoulders
  const head = new Container()
  const h = new Graphics()
  h.ellipse(0, 0, 10, 8.5).fill(s.stone).stroke(LINE)
  h.ellipse(-5, 0.5, 5, 7.5).fill(s.stoneDark)
  h.ellipse(0, 0, 10, 8.5).stroke(LINE)
  h.ellipse(3, -5, 4, 1.6).fill({ color: s.stoneLight, alpha: 0.7 })
  if (front) {
    h.roundRect(1, -1.5, 3.4, 2.6, 1.2).fill(s.eyes)
    h.roundRect(5.8, -1.5, 3.4, 2.6, 1.2).fill(s.eyes)
    h.rect(1.8, -1, 1.2, 1).fill(s.eyesLight)
    h.rect(6.6, -1, 1.2, 1).fill(s.eyesLight)
    glows.push(glow(s.eyes, 6, 2.7, -0.2), glow(s.eyes, 6, 7.5, -0.2))
  }
  head.addChild(h, ...glows)
  head.position.set(3, GOLEM_HEAD_Y)

  body.addChild(behind, legFar, legNear, torso, head, before)

  root.scale.set(s.scale)
  return {
    root,
    body,
    legFar,
    legNear,
    armFar: other.shoulder,
    armNear: strike.shoulder,
    elbowFar: other.elbow,
    elbowNear: strike.elbow,
    gripFar: null,
    gripNear: null,
    itemFar: 0,
    itemNear: 0,
    guard: { arm: 0, elbow: 0 },
    torso,
    head,
    headBack: new Container(),
    glows,
    hip: GOLEM_HIP,
    headY: GOLEM_HEAD_Y,
    armSwing: 0.6,
  }
}

// ─── Deep water forms ───────────────────────────────────────────────────────

/** How deep an upright swimmer floats (local pixels): chest out of water. */
const SWIM_SINK = 27

interface SwimForm {
  root: Container
  /** Floats upright (the normal rig, sunk to the chest, is shown too). */
  upright: boolean
  update(time: number, moving: boolean): void
}

/**
 * What a swimmer looks like in deep water, drawn around the surface (y = 0,
 * positive y under water, faded): Squalor is only a dorsal fin, the
 * swimmers crawl with their head out, Néréa floats with her tail.
 */
function buildSwimForm(style: Style, front: boolean): SwimForm | null {
  const root = new Container()
  const under = (color: number) => ({ color, alpha: 0.32 })

  switch (style.swim) {
    case "fin": {
      const body = new Graphics()
        .ellipse(-5, 7, 22, 6)
        .fill(under(style.body.shade))
        .poly([-25, 7, -33, 1, -32, 13])
        .fill(under(style.body.shade))
      const fin = new Graphics()
        .poly([-7, 1, 7, 1, 3, -4, -3, -17])
        .fill(style.skin)
        .stroke(LINE)
        .poly([-7, 1, -2, 1, -3, -17])
        .fill(style.skinShade)
      const wake = new Graphics()
      root.addChild(body, wake, fin)
      return {
        root,
        upright: false,
        update(time, moving) {
          fin.y = Math.sin(time / 260) * 1.2
          fin.x = Math.sin(time / 700) * 1.5
          wake.clear()
          const length = moving ? 3 : 1
          for (let i = 0; i < length; i++) {
            const x = -10 - i * 7 + ((time / 40) % 7)
            wake
              .moveTo(x, -1)
              .quadraticCurveTo(x - 3, 1, x - 6, 0.5)
              .stroke({ width: 1, color: 0xe7f5ff, alpha: 0.7 - i * 0.2 })
          }
        },
      }
    }

    case "crawl": {
      const body = new Graphics()
        .ellipse(-6, 6, 15, 5)
        .fill(under(style.body.color))
      const legs = new Graphics()
      const hd = head(style, front)
      const headBox = new Container()
      headBox.addChild(hd.behind, hd.container)
      headBox.scale.set(0.8)
      headBox.position.set(9, -5)
      const strokeArm = () => {
        const c = new Container()
        c.addChild(
          new Graphics()
            .roundRect(-2.4, -1, 4.8, 12, 2.2)
            .fill(style.sleeves)
            .stroke(LINE)
            .circle(0, 12, 2.6)
            .fill(style.hands)
            .stroke(LINE),
        )
        c.position.set(4, -1)
        return c
      }
      const armA = strokeArm()
      const armB = strokeArm()
      root.addChild(body, legs, armB, headBox, armA)
      return {
        root,
        upright: false,
        update(time, moving) {
          const phase = time / (moving ? 170 : 340)
          for (const [arm, offset] of [
            [armA, 0],
            [armB, Math.PI],
          ] as const) {
            arm.rotation = phase + offset
            // only the half of the stroke above the surface is crisp
            arm.alpha = Math.cos(arm.rotation) < 0 ? 1 : 0.3
          }
          headBox.y = -5 + Math.sin(phase * 2) * 0.8
          const kick = Math.sin(phase * 3) * 2
          legs
            .clear()
            .roundRect(-24, 4 + kick, 9, 3, 1.5)
            .fill(under(style.legs))
            .roundRect(-24, 7 - kick, 9, 3, 1.5)
            .fill(under(style.legs))
        },
      }
    }

    case "mermaid": {
      // the upright rig shows head and chest; the tail flicks at the surface
      const body = new Graphics()
        .ellipse(-6, 7, 12, 5)
        .fill(under(style.body.color))
      const tail = new Graphics()
        .poly([0, 0, -9, -6, -7, 0, -9, 6])
        .fill(style.body.trim ?? style.body.color)
        .stroke(LINE)
      tail.position.set(-16, 1)
      root.addChild(body, tail)
      return {
        root,
        upright: true,
        update(time) {
          tail.rotation = Math.sin(time / 260) * 0.4
          tail.y = 1 + Math.sin(time / 260) * 1.5
        },
      }
    }

    default:
      return null
  }
}

// ─── Puppet ─────────────────────────────────────────────────────────────────

export interface Pose {
  legFar: number
  legNear: number
  /** Shoulder angles (0 = arm down, negative = raised forward). */
  armFar: number
  armNear: number
  /** Elbow bends (negative = forearm forward). */
  elbowFar: number
  elbowNear: number
  /** How much the weapon points forward (0 = held upright, 1 = thrust). */
  thrust: number
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
    elbowFar: -0.3,
    elbowNear: -0.35 - breathe * 0.03,
    thrust: 0,
    bodyY: 0,
    bodyRot: 0,
    headY: breathe * 0.6,
    torsoScale: 1 + breathe * 0.015,
    glowBoost: 1,
  }

  if (swimming) {
    // treading water, upright: calm sculling arms, a gentle bob
    const phase = time / (walking ? 140 : 320)
    pose.armNear = -0.35 + Math.sin(phase) * 0.25
    pose.armFar = -0.3 + Math.sin(phase + 1) * 0.25
    pose.elbowNear = -0.7
    pose.elbowFar = -0.7
    pose.legFar = Math.sin(phase * 2) * 0.3
    pose.legNear = -pose.legFar
    pose.bodyY = Math.sin(phase) * 1.2
  } else if (walking) {
    const phase = time / 85
    pose.legFar = Math.sin(phase) * 0.55
    pose.legNear = -pose.legFar
    pose.armFar = -Math.sin(phase) * 0.45 * armSwing
    pose.armNear = Math.sin(phase) * 0.45 * armSwing
    pose.elbowFar = -0.45 - Math.max(0, Math.sin(phase)) * 0.3
    pose.elbowNear = -0.45 - Math.max(0, -Math.sin(phase)) * 0.3
    pose.bodyY = -Math.abs(Math.sin(phase)) * 1.8
  }

  if (action) {
    const p = Math.max(0, Math.min(1, action.progress))
    const bell = Math.sin(p * Math.PI)
    switch (action.kind) {
      case "melee": {
        // wind up (arm back, elbow bent), then strike forward, arm extended
        const windUp = p < 0.35 ? p / 0.35 : 1 - (p - 0.35) / 0.65
        pose.armNear =
          p < 0.35 ? 1.3 * (p / 0.35) : 1.3 - 3 * ((p - 0.35) / 0.65)
        pose.elbowNear = -1.5 * windUp
        pose.thrust = p < 0.35 ? 0 : Math.sin(((p - 0.35) / 0.65) * Math.PI)
        pose.armFar = -0.6 * bell
        pose.bodyRot = 0.18 * bell
        pose.legNear = -0.35 * bell
        break
      }
      case "shoot":
        // bow arm straight towards the target, the other draws the string
        pose.armNear = -1.45 * Math.min(1, p * 4)
        pose.elbowNear = 0
        pose.armFar = -1.2 + 0.9 * Math.max(0, (p - 0.6) / 0.4)
        pose.elbowFar =
          p < 0.6 ? 2.5 * Math.min(1, p * 4) : 2.5 * (1 - (p - 0.6) / 0.4)
        pose.bodyRot = -0.05 * bell
        break
      case "cast":
        pose.armNear = -2.5 * bell
        pose.armFar = -2.2 * bell
        pose.elbowNear = -0.3 * bell
        pose.elbowFar = -0.3 * bell
        pose.bodyY -= 2 * bell
        pose.glowBoost = 1 + 2.5 * bell
        break
      case "roar":
        pose.armNear = -2.6 * bell
        pose.armFar = -2.6 * bell
        pose.elbowNear = -0.7 * bell
        pose.elbowFar = -0.7 * bell
        pose.bodyRot = -0.12 * bell
        pose.headY -= 2 * bell
        pose.glowBoost = 1 + 1.5 * bell
        break
      case "hit":
        pose.bodyRot = -0.3 * bell
        pose.armNear = 0.6 * bell
        pose.armFar = 0.6 * bell
        pose.elbowNear = -0.8 * bell
        pose.elbowFar = -0.8 * bell
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
  private _swimFront: SwimForm | null
  private _swimBack: SwimForm | null
  /** Hides what is under the surface of an upright swimmer. */
  private _waterMask: Graphics
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
    const swim = (front: boolean) =>
      style.kind === "golem" ? null : buildSwimForm(style, front)
    this._swimFront = swim(true)
    this._swimBack = swim(false)
    this._waterMask = new Graphics().rect(-90, -300, 180, 300).fill(0xffffff)
    this._waterMask.visible = false
    // the rigs first: front, then back
    this.addChild(this._front.root, this._back.root)
    for (const form of [this._swimFront, this._swimBack]) {
      if (form) {
        form.root.scale.set(style.scale)
        this.addChild(form.root)
      }
    }
    this.addChild(this._waterMask)
    this.setFacing("SE")
  }

  get facing() {
    return this._facing
  }

  /** Visible rig (front or back view). */
  get rig() {
    return isBackFacing(this._facing) ? this._back : this._front
  }

  /** Deep water form of the current view (swimmers and aquatics). */
  get swimForm() {
    return isBackFacing(this._facing) ? this._swimBack : this._swimFront
  }

  /** Whether the character changes shape in deep water. */
  get hasSwimForm() {
    return this._swimFront !== null
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

  /** Deep water: swim form, or treading water upright. */
  setSwimming(swimming: boolean) {
    this._swimming = swimming
    this._refreshViews()
  }

  setFacing(facing: Facing) {
    this._facing = facing
    const scale = STYLES[this.presetId].scale
    for (const rig of [this._front, this._back]) {
      rig.root.scale.x = (isMirrored(facing) ? -1 : 1) * scale
    }
    for (const form of [this._swimFront, this._swimBack]) {
      if (form) form.root.scale.x = (isMirrored(facing) ? -1 : 1) * scale
    }
    this._refreshViews()
  }

  /** Walk cycle for the given duration (ms). */
  walk(duration: number) {
    this._walk = Math.max(this._walk, duration)
  }

  act(kind: PuppetAction, duration: number) {
    this._action = { kind, elapsed: 0, duration }
    this._refreshViews()
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

  /**
   * Which views are shown: in deep water, the swim form replaces the body
   * (except while acting: the swimmer rises to strike), or completes the
   * upright body sunk to the chest.
   */
  private _refreshViews() {
    const back = isBackFacing(this._facing)
    const form = this._swimming ? this.swimForm : null
    const formOnly = !!form && !form.upright && !this._action
    for (const [rig, isBack] of [
      [this._front, false],
      [this._back, true],
    ] as const) {
      rig.root.visible = isBack === back && !formOnly
      const sunk = !!form && !formOnly
      rig.root.y = sunk ? SWIM_SINK : 0
      rig.root.mask = sunk ? this._waterMask : null
    }
    this._waterMask.visible = !!form && !formOnly
    if (this._swimFront) this._swimFront.root.visible = form === this._swimFront
    if (this._swimBack) this._swimBack.root.visible = form === this._swimBack
  }

  update(dt: number) {
    this._time += dt
    this._walk = Math.max(0, this._walk - dt)
    if (this._action) {
      this._action.elapsed += dt
      if (this._action.elapsed >= this._action.duration) {
        this._action = null
        this._refreshViews()
      }
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
    const armNear = pose.armNear + rig.guard.arm
    const elbowNear = pose.elbowNear + rig.guard.elbow
    rig.armNear.rotation = armNear
    rig.elbowFar.rotation = pose.elbowFar
    rig.elbowNear.rotation = elbowNear
    // held items keep their own angle (upright), or point forward to thrust
    if (rig.gripNear) {
      const angle = rig.itemNear + (Math.PI / 2 - rig.itemNear) * pose.thrust
      rig.gripNear.rotation = angle - armNear - elbowNear
    }
    if (rig.gripFar) {
      rig.gripFar.rotation = rig.itemFar - pose.armFar - pose.elbowFar
    }
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
    if (this._swimming) this.swimForm?.update(this._time, this._walk > 0)
  }
}

/**
 * Pieces of the modular puppet. They plug into the existing rig of
 * `view/Puppet.ts` (same hip, shoulders, head anchor, same two views:
 * front ¾ and back ¾, mirrored for the other two facings), so every
 * animation of the other puppets works on them unchanged.
 *
 * Layering per view (the rig draws, in order):
 *   front view  cape behind everything, far arm, legs, long hair, torso,
 *               head, near arm
 *   back view   far arm, legs, torso, cape over the torso and the legs,
 *               head, near arm
 * so the cape hangs behind the body when the character faces the camera,
 * and covers its back when it turns away. Faces, marks and the front of
 * accessories are drawn in the front view only; the back view shows the
 * hair, the helmet, the strap of the goggles, the back of the satchel...
 */
import { Container, Graphics } from "pixi.js"
import { HEAD_SCALES, type ResolvedLook, shadeOf } from "./lookPalettes"

const OUTLINE = 0x1b1424
const LINE = { width: 1.4, color: OUTLINE, alignment: 0.5 }

const darken = shadeOf

// ─── Legs ───────────────────────────────────────────────────────────────────

/** A leg hanging from the hip (same box as the reference puppets'). */
export function legPiece(r: ResolvedLook, shade: boolean) {
  const c = new Container()
  const g = new Graphics()
  const d = (color: number) => (shade ? darken(color) : color)
  const w = r.build.legW
  const cloth = d(r.cloth2)
  const boot = d(r.boots)
  const foot = () =>
    g
      .ellipse(1.6, 14.5, 3.8 * w, 2.4)
      .fill(boot)
      .stroke(LINE)

  switch (r.look.legs % 5) {
    case 0: // trousers
      g.roundRect(-2.6 * w, -1, 5.2 * w, 14, 2)
        .fill(cloth)
        .stroke(LINE)
      foot()
      break
    case 1: // shorts, bare legs
      g.roundRect(-2.2 * w, 4, 4.4 * w, 10, 1.6)
        .fill(d(r.skin))
        .stroke(LINE)
      g.roundRect(-2.9 * w, -1, 5.8 * w, 7, 2)
        .fill(cloth)
        .stroke(LINE)
      foot()
      break
    case 2: // tall boots
      g.roundRect(-2.6 * w, -1, 5.2 * w, 9, 2)
        .fill(cloth)
        .stroke(LINE)
      g.roundRect(-3 * w, 5, 6 * w, 9, 2)
        .fill(boot)
        .stroke(LINE)
      g.rect(-3 * w, 5, 6 * w, 1.8).fill(d(r.metal))
      foot()
      break
    case 3: // greaves
      g.roundRect(-2.6 * w, -1, 5.2 * w, 8, 2)
        .fill(cloth)
        .stroke(LINE)
      g.roundRect(-2.9 * w, 5.5, 5.8 * w, 8.5, 2)
        .fill(d(r.metal))
        .stroke(LINE)
      g.circle(0.4, 5.5, 3 * w)
        .fill(d(r.metal))
        .stroke(LINE)
      g.ellipse(1.6, 14.5, 3.9 * w, 2.5)
        .fill(d(r.metalShade))
        .stroke(LINE)
      break
    default: // baggy trousers gathered at the ankle
      g.roundRect(-3.7 * w, -1, 7.4 * w, 12, 3)
        .fill(cloth)
        .stroke(LINE)
      g.rect(-2.8 * w, 10, 5.6 * w, 1.8)
        .fill(d(r.cloth))
        .stroke(LINE)
      g.ellipse(1.6, 13.6, 3.4 * w, 2.2)
        .fill(boot)
        .stroke(LINE)
      break
  }
  c.addChild(g)
  return c
}

// ─── Torso ──────────────────────────────────────────────────────────────────

/** Clothes of the upper body, with the accessories that hang on it. */
export function torsoPiece(r: ResolvedLook, front: boolean, bow: boolean) {
  const c = new Container()
  const g = new Graphics()
  const cloth = r.cloth
  const shade = r.clothShade
  const trim = r.cloth2
  let bottom = -12
  let edge = 9.5

  switch (r.look.top % 6) {
    case 0: // tunic
      g.poly([-8, -35, 8, -35, 9.5, -12, -9.5, -12]).fill(cloth).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -12, -9.5, -12]).fill(shade)
      g.rect(-9.2, -19, 18.4, 3).fill(trim)
      if (front) g.rect(1, -19, 3, 3).fill(r.metal)
      break
    case 1: // robe
      g.poly([-8, -35, 8, -35, 12, -2, -12, -2]).fill(cloth).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -2, -12, -2]).fill(shade)
      g.rect(-12, -5, 24, 3).fill(trim)
      g.rect(-9.5, -21, 19, 2.6).fill(r.metal)
      if (front) g.poly([-2, -35, 2, -35, 1, -21, -1, -21]).fill(shade)
      bottom = -2
      edge = 12
      break
    case 2: // jerkin: laced leather over a shirt, tabs under the belt
      g.poly([-8, -35, 8, -35, 9, -14, -9, -14]).fill(trim).stroke(LINE)
      g.poly([-7, -35, 7, -35, 8, -14, -8, -14]).fill(cloth)
      g.poly([-7, -35, -3, -35, -4, -14, -8, -14]).fill(shade)
      for (const x of [-6.5, -2, 2.5, 7]) {
        g.rect(x - 1.6, -15, 3.4, 5)
          .fill(shade)
          .stroke(LINE)
      }
      g.rect(-9, -18, 18, 3).fill(darken(r.boots, 1.2)).stroke(LINE)
      if (front) {
        for (let y = -33; y < -20; y += 3.4) {
          g.moveTo(0, y)
            .lineTo(4, y + 1.7)
            .stroke({ width: 0.8, color: trim })
        }
        g.rect(2, -19, 3, 3).fill(r.metal)
      }
      break
    case 3: // plate
      g.poly([-9, -35, 9, -35, 10, -13, -10, -13]).fill(r.metal).stroke(LINE)
      g.poly([-9, -35, -3, -35, -4, -13, -10, -13]).fill(r.metalShade)
      if (front) {
        g.poly([-5, -32, 7, -32, 6, -22, -4, -22]).fill({
          color: 0xffffff,
          alpha: 0.25,
        })
        g.circle(1, -27, 2).fill(cloth).stroke(LINE)
      }
      g.rect(-10, -18, 20, 3).fill(trim)
      g.poly([-10, -13, 10, -13, 8, -8, -8, -8]).fill(r.metalShade).stroke(LINE)
      break
    case 4: // long coat, lined with the second colour
      g.poly([-8, -35, 8, -35, 11, -6, -11, -6]).fill(cloth).stroke(LINE)
      g.poly([-8, -35, -3, -35, -4, -6, -11, -6]).fill(shade)
      if (front) {
        g.poly([-1, -35, 3, -35, 4, -6, 0, -6]).fill(trim)
        g.poly([-3, -35, 1, -35, 4, -27, -1, -22]).fill(shade).stroke(LINE)
        for (const y of [-26, -19, -12]) g.circle(2, y, 1).fill(r.metal)
      } else {
        g.moveTo(0, -33).lineTo(0, -6).stroke({ width: 1, color: shade })
      }
      g.rect(-11, -9, 22, 3).fill(trim)
      bottom = -6
      edge = 11
      break
    default: // vest over a shirt
      g.poly([-8, -35, 8, -35, 9, -14, -9, -14]).fill(trim).stroke(LINE)
      if (front) {
        g.poly([-8, -35, -1, -35, 3, -26, 2, -14, -9, -14])
          .fill(cloth)
          .stroke(LINE)
        g.poly([4, -35, 8, -35, 9, -14, 3, -14, 5, -26])
          .fill(cloth)
          .stroke(LINE)
      } else {
        g.poly([-8, -35, 8, -35, 9, -14, -9, -14]).fill(cloth).stroke(LINE)
      }
      g.poly([-8, -35, -3, -35, -4, -14, -9, -14]).fill({
        color: 0x000000,
        alpha: 0.2,
      })
      g.rect(-9, -19, 18, 2.6).fill(r.metal)
      break
  }

  // rim light on the lit side
  g.poly([5, -35, 8, -35, edge, bottom, edge - 3, bottom]).fill({
    color: 0xffffff,
    alpha: 0.14,
  })

  accessoryOnTorso(g, r, front)

  if (bow && !front) {
    g.roundRect(-6, -38, 5, 17, 2).fill(0x7f4f24).stroke(LINE)
    g.rect(-5.5, -41, 1.5, 4).fill(0xe03131)
    g.rect(-3.5, -42, 1.5, 5).fill(0xe03131)
  }

  c.addChild(g)
  c.scale.x = r.build.w
  return c
}

/** Scarf, satchel and amulet (the goggles are part of the head). */
function accessoryOnTorso(g: Graphics, r: ResolvedLook, front: boolean) {
  const trim = r.cloth2
  switch (r.look.accessory % 5) {
    case 2: // scarf, its end hanging on the gaze side
      g.roundRect(-8.5, -36.5, 17, 5.5, 2.6).fill(trim).stroke(LINE)
      if (front) {
        g.poly([3, -32, 8, -32, 9, -21, 4, -23]).fill(trim).stroke(LINE)
        g.poly([3, -32, 5, -32, 6, -22, 4, -23]).fill(darken(trim))
      } else {
        g.poly([-3, -31, 3, -31, 4, -20, -4, -20]).fill(trim).stroke(LINE)
      }
      break
    case 3: // satchel
      if (front) {
        g.poly([-8, -35, -5, -35, 8, -16, 5, -16])
          .fill(darken(r.boots, 1.3))
          .stroke(LINE)
        g.roundRect(-13, -21, 8, 9, 2).fill(r.cloth2).stroke(LINE)
        g.rect(-13, -21, 8, 3).fill(darken(r.cloth2))
      } else {
        g.roundRect(-6.5, -28, 13, 12, 2).fill(r.cloth2).stroke(LINE)
        g.rect(-6.5, -28, 13, 4).fill(darken(r.cloth2))
        g.rect(-1, -25, 2, 3).fill(r.metal)
      }
      break
    case 4: // amulet on a cord
      if (front) {
        g.moveTo(-3, -35)
          .lineTo(1, -26)
          .lineTo(5, -35)
          .stroke({ width: 0.9, color: darken(r.boots, 1.4) })
        g.circle(1, -25, 2.6).fill(r.metal).stroke(LINE)
        g.circle(1, -25, 1.2).fill(r.cloth2)
      } else {
        g.moveTo(-7, -34)
          .lineTo(0, -31)
          .lineTo(7, -34)
          .stroke({ width: 0.9, color: darken(r.boots, 1.4) })
      }
      break
  }
}

// ─── Cape ───────────────────────────────────────────────────────────────────

/**
 * The cape, or null. Front view: behind the body (only its edges show, and
 * its hem below the hips). Back view: over the torso.
 */
export function capePiece(r: ResolvedLook, front: boolean) {
  const kind = r.look.cape % 4
  if (kind === 0) return null
  const g = new Graphics()
  const cloth = r.cloth2
  const shade = darken(cloth)
  // seen from the front the cape is wider than the torso, to peek out
  const spread = front ? 1.12 : 1
  const x = (v: number) => v * spread
  const poly = (pts: number[]) => {
    const out: number[] = []
    for (let i = 0; i < pts.length; i += 2) out.push(x(pts[i]), pts[i + 1])
    return out
  }
  switch (kind) {
    case 1: // short cape
      g.poly(poly([-9, -35, 9, -35, 12, -18, 0, -15, -12, -18]))
        .fill(cloth)
        .stroke(LINE)
      g.poly(poly([-9, -35, -3, -35, -4, -16, -12, -18])).fill(shade)
      break
    case 2: // long cape
      g.poly(poly([-9, -35, 9, -35, 13, -4, 0, -1, -13, -4]))
        .fill(cloth)
        .stroke(LINE)
      g.poly(poly([-9, -35, -3, -35, -4, -2, -13, -4])).fill(shade)
      break
    default: // tattered cloak with a lining and a high collar
      g.poly(
        poly([
          -9, -35, 9, -35, 13, -6, 9, -2, 6, -6, 2, -1, -2, -6, -6, -2, -9, -6,
          -13, -5,
        ]),
      )
        .fill(cloth)
        .stroke(LINE)
      g.poly(poly([-9, -35, -3, -35, -4, -5, -13, -5])).fill(shade)
      g.poly(poly([5, -35, 9, -35, 13, -6, 9, -6])).fill(r.cloth)
      g.roundRect(x(-9.5), -37, x(19), 4.5, 2).fill(r.cloth).stroke(LINE)
      break
  }
  const c = new Container()
  c.addChild(g)
  c.scale.x = r.build.w
  return c
}

// ─── Head ───────────────────────────────────────────────────────────────────

const SKIN_LINE = 0x7a4a32

/**
 * Head of the modular puppet: shape, face, hair or helmet, mark and the
 * goggles. Same contract as the reference heads (`container`, `behind`
 * for long hair, glows). The face looks towards +x in the front view.
 */
export function headPiece(r: ResolvedLook, front: boolean) {
  const c = new Container()
  const g = new Graphics()
  const behind = new Graphics()
  const { look } = r
  const scale = HEAD_SCALES[look.head % HEAD_SCALES.length]
  c.scale.set(scale.x, scale.y)
  behind.scale.set(scale.x, scale.y)

  const hair = look.hair % 9
  const fullHelm = hair === 8
  const hooded = hair === 6

  // under layer: the hood
  if (hooded) {
    g.circle(0, 0, 9.8).fill(r.cloth).stroke(LINE)
    g.poly([-9.8, 0, -6, -8, -5, 8]).fill(r.clothShade)
    g.poly([-3, -9, 3, -9, -6, -15]).fill(r.cloth).stroke(LINE)
  }

  // the skull
  const skull = () => {
    if (look.head % 4 === 2) g.roundRect(-8.5, -8, 17, 16, 4.2)
    else g.circle(0, 0, 8.5)
  }
  if (hooded && front) {
    g.ellipse(2.5, 1.5, 6.5, 6.8).fill(r.skin).stroke(LINE)
  } else if (!hooded) {
    skull()
    g.fill(r.skin).stroke(LINE)
    g.poly([-8.5, 0, -4, -7, -6, 2, -5, 7]).fill(r.skinShade)
  }

  if (front && !fullHelm) drawFace(g, r)
  if (front && !fullHelm) drawMark(g, r)

  drawHair(g, behind, r, front, hair)

  // goggles on the forehead
  if (look.accessory % 5 === 1 && !fullHelm) {
    const strap = 0x343a40
    if (front) {
      g.rect(-8.7, -7.8, 17.4, 2.2).fill(strap).stroke(LINE)
      for (const x of [2.4, 6.6]) {
        g.circle(x, -6.7, 2.7).fill(r.metal).stroke(LINE)
        g.circle(x, -6.7, 1.5).fill(0x74c0fc)
        g.circle(x - 0.5, -7.2, 0.5).fill(0xffffff)
      }
    } else {
      g.rect(-8.9, -7.8, 17.8, 2.2).fill(strap).stroke(LINE)
      g.rect(-1, -8, 2, 2.6).fill(r.metal)
    }
  }

  c.addChild(g)
  return { container: c, glows: [] as never[], behind }
}

function drawFace(g: Graphics, r: ResolvedLook) {
  const face = r.look.face % 4
  const dark = OUTLINE
  const lowered = r.look.head % 4 === 3 ? 1.2 : r.look.head % 4 === 1 ? 0.8 : 0
  const y = lowered
  switch (face) {
    case 0: // calm
      g.rect(1.6, -1.5 + y, 1.8, 2.6).fill(dark)
      g.rect(5.4, -1.5 + y, 1.8, 2.6).fill(dark)
      g.moveTo(4.2, 4.6 + y)
        .lineTo(7, 4.6 + y)
        .stroke({ width: 0.9, color: SKIN_LINE })
      break
    case 1: // stern: slanted brows, flat mouth
      g.rect(1.6, -1 + y, 1.8, 2.2).fill(dark)
      g.rect(5.4, -1 + y, 1.8, 2.2).fill(dark)
      g.moveTo(0.8, -3.6 + y)
        .lineTo(3.8, -2.2 + y)
        .stroke({ width: 1.2, color: dark })
      g.moveTo(8, -3.6 + y)
        .lineTo(5, -2.2 + y)
        .stroke({ width: 1.2, color: dark })
      g.moveTo(4.4, 5 + y)
        .lineTo(7.4, 4.4 + y)
        .stroke({ width: 0.9, color: SKIN_LINE })
      break
    case 2: // cheerful: big eyes, smile and blush
      g.circle(2.5, -0.4 + y, 1.5).fill(dark)
      g.circle(6.3, -0.4 + y, 1.5).fill(dark)
      g.circle(2.9, -0.9 + y, 0.5).fill(0xffffff)
      g.circle(6.7, -0.9 + y, 0.5).fill(0xffffff)
      g.arc(5.6, 3 + y, 2.4, 0.3, Math.PI - 0.3).stroke({
        width: 1,
        color: SKIN_LINE,
      })
      g.circle(1.2, 3.6 + y, 1.3).fill({ color: 0xf783ac, alpha: 0.6 })
      g.circle(8.6, 3.6 + y, 1.3).fill({ color: 0xf783ac, alpha: 0.6 })
      break
    default: // masked: a band over the eyes, only glints show
      g.poly([-0.5, -3.6 + y, 9, -3.6 + y, 9, 2.6 + y, -0.5, 2.6 + y])
        .fill(r.cloth2)
        .stroke(LINE)
      g.rect(1.6, -1 + y, 2, 1.4).fill(0xffffff)
      g.rect(5.6, -1 + y, 2, 1.4).fill(0xffffff)
      g.moveTo(4.6, 5.2 + y)
        .lineTo(7, 5.2 + y)
        .stroke({ width: 0.9, color: SKIN_LINE })
      break
  }
}

function drawMark(g: Graphics, r: ResolvedLook) {
  switch (r.look.mark % 4) {
    case 1: // scar across the eye
      g.moveTo(2.2, -5.6).lineTo(7, 4).stroke({ width: 1.2, color: 0xb04a4a })
      for (const [x, y] of [
        [3.6, -2.6],
        [5, 0.2],
        [6.2, 2.4],
      ])
        g.moveTo(x - 1, y)
          .lineTo(x + 1, y)
          .stroke({ width: 0.7, color: 0xf1c0c0 })
      break
    case 2: // war paint under the eyes
      g.rect(1, 2.2, 3.4, 1.5).fill(r.cloth2)
      g.rect(5, 2.2, 3.6, 1.5).fill(r.cloth2)
      g.rect(1.4, 4.2, 2.6, 1.2).fill(r.cloth2)
      break
    case 3: // a glowing rune on the forehead
      g.poly([4.4, -7.2, 6, -5, 4.4, -2.8, 2.8, -5])
        .fill(0xffe066)
        .stroke({ width: 0.8, color: r.cloth2 })
      break
  }
}

function drawHair(
  g: Graphics,
  behind: Graphics,
  r: ResolvedLook,
  front: boolean,
  kind: number,
) {
  const h = r.hair
  const s = r.hairShade
  const crop = [-9, -1, -8, -8, 0, -11, 8, -8, 9, -2, 4, -6, -3, -5]
  /** The whole back of the head (back view). */
  const backCap = (color = h) => g.circle(0, 0, 8.8).fill(color).stroke(LINE)

  switch (kind) {
    case 0: // bald
      break
    case 1: // crop
      if (front) g.poly(crop).fill(h).stroke(LINE)
      else backCap()
      break
    case 2: // spiky
      if (front)
        g.poly([
          -9, -1, -9, -10, -5, -7, -3, -13, 0, -8, 3, -14, 5, -7, 9, -11, 9, -2,
          4, -6, -3, -5,
        ])
          .fill(h)
          .stroke(LINE)
      else {
        backCap()
        g.poly([-8, -6, -7, -13, -3, -8, 0, -14, 3, -8, 7, -13, 8, -6])
          .fill(h)
          .stroke(LINE)
      }
      break
    case 3: // long hair, falling behind the shoulders
      if (front) {
        behind.poly([-9, -2, 9, -2, 11, 17, -11, 17]).fill(s).stroke(LINE)
        behind.poly([-9, -2, -3, -2, -5, 17, -11, 17]).fill(darken(s))
        g.poly(crop).fill(h).stroke(LINE)
      } else {
        g.poly([-9, 0, 9, 0, 10, 18, -10, 18]).fill(h).stroke(LINE)
        g.circle(0, 0, 8.8).fill(h).stroke(LINE)
        for (const x of [-5, 0, 5])
          g.moveTo(x, -4)
            .lineTo(x * 1.1, 17)
            .stroke({ width: 1, color: s, alpha: 0.8 })
      }
      break
    case 4: // ponytail
      if (front) {
        behind
          .poly([-8, -5, -13, 1, -13, 14, -9, 12, -8, 4])
          .fill(h)
          .stroke(LINE)
        g.poly(crop).fill(h).stroke(LINE)
        g.circle(-8, -3, 1.6).fill(r.cloth2).stroke(LINE)
      } else {
        backCap()
        g.poly([-2.5, -2, 3, -2, 4.5, 15, 0, 19, -3.5, 14]).fill(h).stroke(LINE)
        g.circle(0, -2, 1.8).fill(r.cloth2).stroke(LINE)
      }
      break
    case 5: // mohawk
      if (!front) g.rect(-1.6, -9, 3.2, 14).fill(h).stroke(LINE)
      g.poly([-7, -6, -6, -14, -3, -9, 0, -16, 3, -9, 6, -14, 7, -6])
        .fill(h)
        .stroke(LINE)
      break
    case 6: // hood: drawn under the face already
      if (front) g.poly([-4, -5, 6, -6, 9, -1, 0, -2]).fill(h)
      else g.poly([-6, 4, 4, 4, 2, 14, -4, 13]).fill(h).stroke(LINE)
      break
    case 7: // open helm with a nasal bar and a crest
      if (!front) g.circle(0, 0, 8.9).fill(r.metal).stroke(LINE)
      g.arc(0, -0.5, 9.2, Math.PI, 0).fill(r.metal).stroke(LINE)
      g.rect(-9.2, -2.5, 18.4, 2.5).fill(r.metalShade).stroke(LINE)
      if (front) g.rect(3.5, -2.5, 1.8, 6).fill(r.metalShade)
      g.ellipse(-2, -6, 3, 1.5).fill({ color: 0xffffff, alpha: 0.4 })
      g.poly([-1, -9, 3, -12, -5, -16, -12, -12, -10, -8])
        .fill(r.cloth2)
        .stroke(LINE)
      break
    default: // full helm: the face is hidden behind a visor
      g.circle(0, 0, 9.6).fill(r.metal).stroke(LINE)
      g.poly([-9.6, 0, -6, -8, -5, 8]).fill(r.metalShade)
      if (front) {
        g.rect(1, -2, 9, 3).fill(0x212529).stroke(LINE)
        g.rect(3, -1.4, 5, 0.9).fill(0xffe066)
        for (const y of [3.2, 5.4])
          g.moveTo(3, y)
            .lineTo(9, y)
            .stroke({ width: 0.8, color: r.metalShade })
      } else {
        g.moveTo(0, -9).lineTo(0, 9).stroke({ width: 1, color: r.metalShade })
      }
      g.ellipse(-2, -6, 3, 1.5).fill({ color: 0xffffff, alpha: 0.4 })
      g.poly([-2, -9, 2, -9, 6, -17, 1, -14, -4, -18])
        .fill(r.cloth2)
        .stroke(LINE)
      break
  }
}

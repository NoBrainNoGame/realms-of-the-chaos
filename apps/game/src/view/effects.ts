import * as booyah from "@ghom/booyah"
import { Container, Graphics, Sprite, Text, Texture } from "pixi.js"
import { iconTexture } from "./textures"
import { FONT } from "./theme"

export type XY = { x: number; y: number }

// ─── Shared textures ────────────────────────────────────────────────────────

let softTexture: Texture | null = null
let squareTexture: Texture | null = null

/** White radial gradient, used for lights, smoke and glows. */
export function softCircle(): Texture {
  if (softTexture) return softTexture
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, "rgba(255,255,255,1)")
  gradient.addColorStop(0.35, "rgba(255,255,255,0.65)")
  gradient.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  softTexture = Texture.from(canvas)
  softTexture.source.scaleMode = "linear"
  return softTexture
}

/** Small hard square, used for sparks, debris and ice shards. */
function square(): Texture {
  if (squareTexture) return squareTexture
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 4
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, 4, 4)
  squareTexture = Texture.from(canvas)
  return squareTexture
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)]

// ─── Particles ──────────────────────────────────────────────────────────────

export interface ParticleConfig {
  count: number
  colors: number[]
  /** "add" for fire, light and magic; "normal" for smoke and dust. */
  blend?: "add" | "normal"
  shape?: "soft" | "square"
  /** Pixels per second. */
  speed: [number, number]
  /** Emission angle range in radians (default: all around). */
  angle?: [number, number]
  /** Pixels per second²; negative values make particles rise. */
  gravity?: number
  /** Velocity kept after one second (0..1). */
  drag?: number
  /** Lifetime in ms. */
  life: [number, number]
  /** Start size in pixels. */
  size: [number, number]
  /** Size multiplier at the end of life. */
  grow?: number
  alpha?: number
  /** Spawn radius around the origin. */
  spread?: number
  /** Vertical squash of the spawn area and velocities (isometric look). */
  squash?: number
  /** Stretch square particles along their velocity (sparks). */
  stretch?: boolean
}

interface Particle {
  sprite: Sprite
  vx: number
  vy: number
  age: number
  life: number
  size: number
}

/** A burst of particles; terminates when the last one dies. */
export class Particles extends booyah.ChipBase {
  private _particles: Particle[] = []

  constructor(
    private readonly _layer: Container,
    private readonly _at: XY,
    private readonly _config: ParticleConfig,
  ) {
    super()
  }

  protected _onActivate() {
    const c = this._config
    const texture = c.shape === "square" ? square() : softCircle()
    const squash = c.squash ?? 0.5
    for (let i = 0; i < c.count; i++) {
      const angle = c.angle
        ? rand(c.angle[0], c.angle[1])
        : rand(0, Math.PI * 2)
      const speed = rand(c.speed[0], c.speed[1])
      const r = rand(0, c.spread ?? 0)
      const a = rand(0, Math.PI * 2)
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.tint = pick(c.colors)
      sprite.blendMode = c.blend === "add" ? "add" : "normal"
      sprite.position.set(
        this._at.x + Math.cos(a) * r,
        this._at.y + Math.sin(a) * r * squash,
      )
      sprite.zIndex = 999_990
      const size = rand(c.size[0], c.size[1])
      this._layer.addChild(sprite)
      this._particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * (c.angle ? 1 : squash),
        age: 0,
        life: rand(c.life[0], c.life[1]),
        size,
      })
    }
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick / 1000
    const c = this._config
    const drag = (c.drag ?? 0.3) ** dt
    const textureSize = c.shape === "square" ? 4 : 64

    for (const p of this._particles) {
      p.age += dt * 1000
      const t = p.age / p.life
      if (t >= 1) {
        p.sprite.visible = false
        continue
      }
      p.vx *= drag
      p.vy = p.vy * drag + (c.gravity ?? 0) * dt
      p.sprite.x += p.vx * dt
      p.sprite.y += p.vy * dt
      const size = p.size * (1 + ((c.grow ?? 1) - 1) * t)
      const scale = size / textureSize
      if (c.stretch) {
        p.sprite.rotation = Math.atan2(p.vy, p.vx)
        p.sprite.scale.set(scale * (1 + Math.hypot(p.vx, p.vy) / 60), scale)
      } else {
        p.sprite.scale.set(scale)
      }
      p.sprite.alpha =
        (c.alpha ?? 1) * (t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9)
    }

    if (this._particles.every((p) => p.age >= p.life)) this.terminate()
  }

  protected _onTerminate() {
    for (const p of this._particles) p.sprite.destroy()
    this._particles = []
  }
}

/** Ready-made particle looks. */
export const FX = {
  fire: (spread = 14): ParticleConfig => ({
    count: 36,
    colors: [0xffd43b, 0xff922b, 0xf03e3e, 0xffe066],
    blend: "add",
    speed: [30, 140],
    gravity: -120,
    drag: 0.15,
    life: [300, 700],
    size: [10, 22],
    grow: 0.3,
    spread,
  }),
  smoke: (spread = 16, color = 0x868e96): ParticleConfig => ({
    count: 14,
    colors: [color, 0x495057, 0xadb5bd],
    speed: [10, 40],
    gravity: -30,
    drag: 0.4,
    life: [700, 1300],
    size: [12, 20],
    grow: 2.6,
    alpha: 0.55,
    spread,
  }),
  dust: (spread = 16): ParticleConfig => ({
    count: 12,
    colors: [0xc2b280, 0xa68b5b, 0xd8c99b],
    speed: [30, 90],
    gravity: -10,
    drag: 0.1,
    life: [400, 800],
    size: [6, 12],
    grow: 2,
    alpha: 0.6,
    spread,
  }),
  sparks: (colors = [0xffffff, 0xffe066]): ParticleConfig => ({
    count: 18,
    colors,
    blend: "add",
    shape: "square",
    stretch: true,
    speed: [120, 300],
    gravity: 400,
    drag: 0.05,
    life: [200, 450],
    size: [2, 3],
  }),
  debris: (colors = [0x868e96, 0x5c636a, 0x7f764c]): ParticleConfig => ({
    count: 16,
    colors,
    shape: "square",
    speed: [80, 200],
    angle: [-Math.PI * 0.95, -Math.PI * 0.05],
    gravity: 700,
    drag: 0.6,
    life: [400, 700],
    size: [3, 6],
  }),
  /**
   * Dispersion (death): heat and light spreading sideways and fading, no
   * rising soul. `side` is the horizontal direction (-1 left, 1 right).
   */
  dispersion: (side: 1 | -1): ParticleConfig => ({
    count: 14,
    colors: [0xffe8cc, 0xffd8a8, 0xe5dbff, 0xffffff],
    blend: "add",
    speed: [30, 110],
    angle: side > 0 ? [-0.35, 0.2] : [Math.PI - 0.2, Math.PI + 0.35],
    gravity: -8,
    drag: 0.35,
    life: [500, 1100],
    size: [3, 7],
    spread: 6,
  }),
  /** Steam: heat rejected by a repair. */
  steam: (spread = 14): ParticleConfig => ({
    count: 10,
    colors: [0xf8f9fa, 0xdee2e6, 0xe9ecef],
    speed: [12, 40],
    gravity: -60,
    drag: 0.3,
    life: [600, 1100],
    size: [8, 14],
    grow: 2,
    alpha: 0.45,
    spread,
  }),
  splash: (): ParticleConfig => ({
    count: 14,
    colors: [0xa5d8ff, 0xe7f5ff, 0x4dabf7],
    blend: "add",
    shape: "square",
    speed: [60, 140],
    angle: [-Math.PI * 0.9, -Math.PI * 0.1],
    gravity: 500,
    drag: 0.5,
    life: [300, 500],
    size: [2, 4],
  }),
  sparkles: (colors: number[], spread = 18): ParticleConfig => ({
    count: 22,
    colors,
    blend: "add",
    speed: [5, 30],
    gravity: -70,
    drag: 0.5,
    life: [600, 1100],
    size: [4, 8],
    grow: 0.4,
    spread,
  }),
  bubbles: (): ParticleConfig => ({
    count: 14,
    colors: [0x82c91e, 0x5c940d, 0xc0eb75],
    speed: [5, 25],
    gravity: -60,
    drag: 0.5,
    life: [500, 1000],
    size: [4, 8],
    grow: 1.4,
    alpha: 0.8,
    spread: 12,
  }),
  ice: (): ParticleConfig => ({
    count: 20,
    colors: [0xe7f5ff, 0xa5d8ff, 0x74c0fc],
    blend: "add",
    shape: "square",
    stretch: true,
    speed: [80, 220],
    gravity: 250,
    drag: 0.2,
    life: [300, 600],
    size: [2, 4],
  }),
}

export const particles = (layer: Container, at: XY, config: ParticleConfig) =>
  new Particles(layer, at, config)

// ─── Lights ─────────────────────────────────────────────────────────────────

/** Additive glow that expands and fades: explosions, heals, impacts. */
export function lightFlash(
  layer: Container,
  at: XY,
  color: number,
  radius = 60,
  duration = 450,
) {
  const sprite = new Sprite(softCircle())
  sprite.anchor.set(0.5)
  sprite.tint = color
  sprite.blendMode = "add"
  sprite.zIndex = 999_995
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => {
      sprite.position.set(at.x, at.y)
      layer.addChild(sprite)
    },
    onTick: (t) => {
      const size = (radius * 2 * (0.5 + t * 0.7)) / 64
      sprite.scale.set(size, size * 0.75)
      sprite.alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
    },
    onTerminate: () => sprite.destroy(),
  })
}

/** Jagged bolt striking from the sky, flickering a few times. */
export function lightning(
  layer: Container,
  to: XY,
  color: number,
  duration = 380,
) {
  const g = new Graphics()
  g.blendMode = "add"
  g.zIndex = 999_996
  const from = { x: to.x + rand(-40, 40), y: to.y - 260 }
  let last = -1

  const draw = () => {
    const points: number[] = [from.x, from.y]
    const steps = 9
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      points.push(
        booyah.lerp(from.x, to.x, t) + rand(-14, 14),
        booyah.lerp(from.y, to.y, t),
      )
    }
    points.push(to.x, to.y)
    g.clear()
      .poly(points, false)
      .stroke({ width: 9, color, alpha: 0.25 })
      .poly(points, false)
      .stroke({ width: 4, color, alpha: 0.7 })
      .poly(points, false)
      .stroke({ width: 1.5, color: 0xffffff, alpha: 1 })
  }

  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      const frame = Math.floor(t * 5)
      if (frame !== last) {
        last = frame
        draw()
      }
      g.alpha = t < 0.7 ? (frame % 2 === 0 ? 1 : 0.6) : 1 - (t - 0.7) / 0.3
    },
    onTerminate: () => g.destroy(),
  })
}

/** Curved blade trail for melee slashes. */
export function slash(
  layer: Container,
  at: XY,
  color: number,
  flip = false,
  duration = 260,
) {
  const g = new Graphics()
  g.blendMode = "add"
  g.zIndex = 999_996
  g.position.set(at.x, at.y)
  g.scale.x = flip ? -1 : 1
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      const start = -2.4 + t * 1.6
      g.clear()
        .moveTo(Math.cos(start) * 22, Math.sin(start) * 22)
        .arc(0, 0, 22, start, start + 1.8)
        .stroke({ width: 6 * (1 - t) + 1, color, alpha: 0.9 * (1 - t) })
        .moveTo(Math.cos(start + 0.4) * 22, Math.sin(start + 0.4) * 22)
        .arc(0, 0, 22, start + 0.4, start + 1.6)
        .stroke({ width: 2, color: 0xffffff, alpha: 1 - t })
    },
    onTerminate: () => g.destroy(),
  })
}

// ─── Texts, projectiles, rings ──────────────────────────────────────────────

/** Text rising and fading above a point. Does not block the queue. */
export function floatingText(
  layer: Container,
  at: XY,
  text: string,
  color: number,
  size = 16,
) {
  const label = new Text({
    text,
    style: {
      fontFamily: FONT,
      fontSize: size,
      fontWeight: "700",
      fill: color,
      stroke: { color: 0x000000, width: 4 },
    },
  })
  label.anchor.set(0.5)
  label.zIndex = 1_000_000

  return new booyah.Tween({
    from: 0,
    to: 1,
    duration: 900,
    onActivate: () => {
      label.position.set(at.x, at.y)
      layer.addChild(label)
    },
    onTick: (t) => {
      label.y = at.y - 30 * booyah.easeOutCubic(t)
      label.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
      label.scale.set(
        t < 0.15 ? 0.6 + (t / 0.15) * 0.6 : 1.2 - Math.min(0.2, t),
      )
    },
    onTerminate: () => label.destroy(),
  })
}

export interface ProjectileStyle {
  color: number
  /** Icon id used as projectile sprite, otherwise a glowing orb. */
  icon?: string
  arc?: number
  size?: number
  /** Particles left behind while flying. */
  trail?: () => ParticleConfig
}

export function projectile(
  layer: Container,
  from: XY,
  to: XY,
  duration: number,
  style: ProjectileStyle,
  spawn?: (chip: booyah.ChipResolvable) => void,
) {
  const node = new Container()
  node.zIndex = 999_999
  if (style.icon) {
    const sprite = new Sprite(iconTexture(style.icon))
    sprite.anchor.set(0.5)
    sprite.scale.set(2)
    node.addChild(sprite)
  } else {
    const size = style.size ?? 6
    const glow = new Sprite(softCircle())
    glow.anchor.set(0.5)
    glow.tint = style.color
    glow.blendMode = "add"
    glow.scale.set((size * 5) / 64)
    const core = new Graphics()
      .circle(0, 0, size)
      .fill(style.color)
      .circle(-size / 3, -size / 3, size / 2.5)
      .fill({ color: 0xffffff, alpha: 0.9 })
    node.addChild(glow, core)
  }

  let lastTrail = 0
  let previous = { ...from }
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => {
      node.position.set(from.x, from.y)
      layer.addChild(node)
    },
    onTick: (t) => {
      const arc = style.arc ?? 20
      node.x = booyah.lerp(from.x, to.x, t)
      node.y = booyah.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * arc
      if (style.icon) {
        node.rotation =
          Math.atan2(node.y - previous.y, node.x - previous.x) + Math.PI / 4
      }
      previous = { x: node.x, y: node.y }
      if (style.trail && spawn && t - lastTrail > 0.12) {
        lastTrail = t
        spawn(particles(layer, { x: node.x, y: node.y }, style.trail()))
      }
    },
    onTerminate: () => node.destroy({ children: true }),
  })
}

/** Expanding ring, used for impacts and area effects. */
export function burst(
  layer: Container,
  at: XY,
  color: number,
  radius = 28,
  duration = 350,
) {
  const g = new Graphics()
  g.zIndex = 999_998
  g.blendMode = "add"
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      g.clear()
        .ellipse(at.x, at.y, radius * t, radius * t * 0.5)
        .stroke({ width: 4 * (1 - t) + 1, color, alpha: 1 - t })
        .ellipse(at.x, at.y, radius * t * 0.6, radius * t * 0.3)
        .fill({ color, alpha: 0.35 * (1 - t) })
    },
    onTerminate: () => g.destroy(),
  })
}

/** Vertical beam of light (blessings, auras). */
export function lightBeam(
  layer: Container,
  at: XY,
  color: number,
  duration = 700,
) {
  const g = new Graphics()
  g.blendMode = "add"
  g.zIndex = 999_994
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      const width = 22 * Math.sin(t * Math.PI)
      g.clear()
        .rect(at.x - width / 2, at.y - 160, width, 160)
        .fill({ color, alpha: 0.25 * (1 - t) })
        .rect(at.x - width / 6, at.y - 160, width / 3, 160)
        .fill({ color: 0xffffff, alpha: 0.4 * (1 - t) })
    },
    onTerminate: () => g.destroy(),
  })
}

/**
 * Gravitational lens (Distortion): rings tightening around the target, as
 * if space bent towards it, with a bright Einstein ring.
 */
export function lens(layer: Container, at: XY, color: number, duration = 700) {
  const g = new Graphics()
  g.blendMode = "add"
  g.zIndex = 999_997
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      g.clear()
      for (let i = 0; i < 3; i++) {
        const k = (1 - ((t + i / 3) % 1)) * 46 + 8
        g.ellipse(at.x, at.y, k, k * 0.55).stroke({
          width: 1.5,
          color,
          alpha: 0.6 * (1 - t) * (k / 54),
        })
      }
      g.ellipse(at.x, at.y, 12, 6.6).stroke({
        width: 3 * Math.sin(t * Math.PI) + 0.5,
        color: 0xffffff,
        alpha: 0.8 * Math.sin(t * Math.PI),
      })
    },
    onTerminate: () => g.destroy(),
  })
}

/** Energy converging into a point (repairs, focused energy). */
export function converge(
  layer: Container,
  at: XY,
  color: number,
  duration = 650,
  count = 12,
) {
  const sprites = Array.from({ length: count }, (_, i) => {
    const sprite = new Sprite(softCircle())
    sprite.anchor.set(0.5)
    sprite.tint = color
    sprite.blendMode = "add"
    sprite.scale.set(6 / 64)
    sprite.zIndex = 999_996
    const angle = (i / count) * Math.PI * 2
    return { sprite, angle, radius: 34 + (i % 3) * 8 }
  })
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => {
      for (const s of sprites) layer.addChild(s.sprite)
    },
    onTick: (t) => {
      for (const s of sprites) {
        const r = s.radius * (1 - t)
        const a = s.angle + t * 1.2
        s.sprite.position.set(
          at.x + Math.cos(a) * r,
          at.y + Math.sin(a) * r * 0.5,
        )
        s.sprite.alpha = Math.min(1, t * 3) * (1 - t * 0.5)
      }
    },
    onTerminate: () => {
      for (const s of sprites) s.sprite.destroy()
    },
  })
}

/** Crystalline force field around a fighter (the Field). */
export function forceField(
  layer: Container,
  at: XY,
  color: number,
  duration = 700,
) {
  const g = new Graphics()
  g.blendMode = "add"
  g.zIndex = 999_995
  // a faceted dome: hexagon outline and a few inner facets
  const facets = (r: number) => {
    const points: number[] = []
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3
      points.push(at.x + Math.cos(a) * r, at.y - 18 + Math.sin(a) * r * 1.1)
    }
    return points
  }
  return new booyah.Tween({
    from: 0,
    to: 1,
    duration,
    onActivate: () => layer.addChild(g),
    onTick: (t) => {
      const grow = Math.min(1, t * 3)
      const fade = 1 - Math.max(0, (t - 0.5) / 0.5)
      const r = 24 * grow
      const outline = facets(r)
      g.clear()
        .poly(outline)
        .fill({ color, alpha: 0.18 * fade })
        .poly(outline)
        .stroke({ width: 1.6, color, alpha: 0.9 * fade })
      for (let i = 0; i < 6; i += 2) {
        g.moveTo(at.x, at.y - 18)
          .lineTo(outline[i * 2], outline[i * 2 + 1])
          .stroke({ width: 0.8, color: 0xffffff, alpha: 0.5 * fade })
      }
    },
    onTerminate: () => g.destroy(),
  })
}

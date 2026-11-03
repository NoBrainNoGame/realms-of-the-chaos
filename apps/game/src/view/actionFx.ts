/**
 * Visual "juice" of actions and divine powers: how the launcher moves,
 * what flies, and what happens on impact (shockwaves, particles, lights,
 * lightning, screen shake). Purely cosmetic: everything is fire-and-forget.
 */
import type * as booyah from "@ghom/booyah"
import { type Point, zoneCells } from "@realms/engine"
import type { Container } from "pixi.js"
import type BoardView from "./BoardView"
import {
  burst,
  FX,
  lightBeam,
  lightFlash,
  lightning,
  type ProjectileStyle,
  particles,
  slash,
  type XY,
} from "./effects"
import type { PuppetAction } from "./Puppet"

export interface FxContext {
  layer: Container
  board: BoardView
  /** Scale a duration by the current game speed. */
  ms(duration: number): number
  /** Start a chip without blocking the animation sequence. */
  spawn(chip: booyah.ChipResolvable): void
  shake(intensity: number, duration: number): void
  inBounds(p: Point): boolean
  /** Water cell (splashes instead of dust). */
  isWater(p: Point): boolean
}

/** Body animation of the launcher for each action. */
export const ACTION_POSE: Record<string, PuppetAction> = {
  kick: "melee",
  fireball: "cast",
  frost: "cast",
  arrow: "shoot",
  poisonArrow: "shoot",
  shieldBash: "melee",
  warCry: "roar",
  heal: "cast",
  aegis: "cast",
  quicken: "cast",
  blade: "melee",
  leap: "melee",
  smash: "melee",
  tremor: "roar",
  trident: "melee",
  tidalWave: "cast",
  bubble: "cast",
  bite: "melee",
  dive: "melee",
}

export const PROJECTILES: Record<string, ProjectileStyle> = {
  arrow: { color: 0xffffff, icon: "arrow", arc: 18 },
  poisonArrow: {
    color: 0x82c91e,
    icon: "poisonArrow",
    arc: 18,
    trail: FX.bubbles,
  },
  fireball: {
    color: 0xff922b,
    arc: 40,
    size: 6,
    trail: () => ({ ...FX.fire(3), count: 6, life: [200, 400], size: [6, 12] }),
  },
  frost: {
    color: 0x74c0fc,
    arc: 10,
    size: 5,
    trail: () => ({ ...FX.sparkles([0xe7f5ff, 0x74c0fc], 2), count: 4 }),
  },
  heal: {
    color: 0x51cf66,
    arc: 30,
    size: 4,
    trail: () => ({ ...FX.sparkles([0x51cf66, 0xd3f9d8], 2), count: 4 }),
  },
  aegis: { color: 0xffe066, arc: 30, size: 4 },
  quicken: { color: 0xfcc419, arc: 30, size: 3 },
  tidalWave: {
    color: 0x4dabf7,
    arc: 24,
    size: 6,
    trail: () => ({ ...FX.splash(), count: 5 }),
  },
  bubble: {
    color: 0x66d9e8,
    arc: 30,
    size: 5,
    trail: () => ({ ...FX.sparkles([0x66d9e8, 0xffffff], 2), count: 3 }),
  },
}

/** Melee actions that hit an adjacent cell. */
export const isMelee = (actionId: string) => ACTION_POSE[actionId] === "melee"

function top(ctx: FxContext, p: Point): XY {
  return ctx.board.cellTop(p)
}

function above(ctx: FxContext, p: Point, dy = -22): XY {
  const t = top(ctx, p)
  return { x: t.x, y: t.y + dy }
}

/**
 * Impact of an action on its target zone. `damaging` actions always sink
 * the zone with a shockwave starting from the aimed cell.
 */
export function impactFx(
  ctx: FxContext,
  actionId: string,
  launcher: Point,
  target: Point,
  cells: Point[],
  damaging: boolean,
) {
  const { layer, spawn, ms } = ctx
  const at = top(ctx, target)
  const zone = cells.length > 0 ? cells : [target]

  if (damaging) {
    const strength: Record<string, number> = {
      fireball: 9,
      smash: 11,
      tremor: 8,
      shieldBash: 7,
    }
    ctx.board.shockwave(target, zone, strength[actionId] ?? 5, {
      duration: ms(460),
      step: ms(80),
    })
  }

  switch (actionId) {
    case "kick":
      spawn(particles(layer, at, FX.dust(8)))
      spawn(lightFlash(layer, above(ctx, target), 0xffffff, 26, ms(200)))
      break

    case "fireball":
      spawn(lightFlash(layer, above(ctx, target, -10), 0xff922b, 95, ms(600)))
      for (const c of zone)
        spawn(particles(layer, above(ctx, c, -6), FX.fire(16)))
      for (const c of zone) {
        spawn(
          particles(layer, above(ctx, c, -10), {
            ...FX.smoke(14, 0x495057),
            count: 6,
          }),
        )
      }
      spawn(particles(layer, at, FX.debris([0x5b8c3a, 0x3f6428, 0x868e96])))
      ctx.shake(7, ms(320))
      break

    case "frost":
      spawn(lightFlash(layer, above(ctx, target), 0x74c0fc, 55, ms(450)))
      spawn(particles(layer, above(ctx, target), FX.ice()))
      spawn(particles(layer, at, { ...FX.smoke(12, 0xd0ebff), alpha: 0.4 }))
      break

    case "arrow":
      spawn(particles(layer, above(ctx, target), FX.sparks()))
      spawn(particles(layer, at, { ...FX.dust(6), count: 6 }))
      break

    case "poisonArrow":
      spawn(particles(layer, above(ctx, target), FX.bubbles()))
      spawn(lightFlash(layer, above(ctx, target), 0x82c91e, 34, ms(400)))
      break

    case "shieldBash":
      spawn(
        particles(
          layer,
          above(ctx, target, -26),
          FX.sparks([0xffffff, 0xffe066, 0x74c0fc]),
        ),
      )
      spawn(lightFlash(layer, above(ctx, target, -26), 0xffffff, 40, ms(250)))
      spawn(particles(layer, at, FX.dust(12)))
      ctx.shake(4, ms(220))
      break

    case "warCry":
      spawn(lightFlash(layer, above(ctx, launcher, -30), 0xf03e3e, 70, ms(500)))
      spawn(burst(layer, top(ctx, launcher), 0xf03e3e, 40, ms(420)))
      spawn(burst(layer, top(ctx, launcher), 0xff922b, 60, ms(600)))
      spawn(
        particles(
          layer,
          above(ctx, launcher, -20),
          FX.sparkles([0xf03e3e, 0xff922b], 14),
        ),
      )
      ctx.shake(3, ms(300))
      break

    case "heal":
      spawn(lightFlash(layer, above(ctx, target, -26), 0x51cf66, 50, ms(600)))
      spawn(lightBeam(layer, at, 0x8ce99a, ms(650)))
      spawn(
        particles(
          layer,
          above(ctx, target, -10),
          FX.sparkles([0x51cf66, 0xd3f9d8, 0xffffff]),
        ),
      )
      break

    case "aegis":
      spawn(lightFlash(layer, above(ctx, target, -26), 0xffe066, 55, ms(600)))
      spawn(burst(layer, at, 0xffe066, 34, ms(500)))
      spawn(
        particles(
          layer,
          above(ctx, target, -20),
          FX.sparkles([0xffe066, 0xfff3bf]),
        ),
      )
      break

    case "quicken":
      spawn(lightning(layer, above(ctx, target, -20), 0xfcc419, ms(380)))
      spawn(lightFlash(layer, above(ctx, target, -20), 0xfcc419, 60, ms(400)))
      spawn(
        particles(
          layer,
          above(ctx, target, -20),
          FX.sparks([0xffffff, 0xfcc419]),
        ),
      )
      break

    case "blade": {
      const flip = top(ctx, target).x < top(ctx, launcher).x
      spawn(slash(layer, above(ctx, target, -26), 0x9775fa, flip, ms(260)))
      spawn(
        particles(
          layer,
          above(ctx, target, -26),
          FX.sparks([0xffffff, 0xd0bfff]),
        ),
      )
      break
    }

    case "smash":
      spawn(lightFlash(layer, above(ctx, target, -8), 0xffffff, 50, ms(250)))
      for (const c of zone) spawn(particles(layer, top(ctx, c), FX.dust(16)))
      spawn(particles(layer, at, FX.debris()))
      ctx.shake(9, ms(380))
      break

    case "tremor":
      for (const c of zone) spawn(particles(layer, top(ctx, c), FX.dust(14)))
      spawn(burst(layer, top(ctx, launcher), 0xa5d8ff, 70, ms(500)))
      ctx.shake(6, ms(360))
      break

    case "trident":
      spawn(
        particles(
          layer,
          above(ctx, target, -24),
          FX.sparks([0xffffff, 0xfcc419]),
        ),
      )
      spawn(lightFlash(layer, above(ctx, target, -24), 0x66d9e8, 30, ms(250)))
      spawn(
        particles(layer, at, ctx.isWater(target) ? FX.splash() : FX.dust(8)),
      )
      break

    case "tidalWave":
      spawn(lightFlash(layer, above(ctx, target, -10), 0x4dabf7, 70, ms(500)))
      for (const c of zone) {
        spawn(
          particles(layer, top(ctx, c), {
            ...FX.splash(),
            count: 18,
            speed: [80, 180],
          }),
        )
        spawn(burst(layer, top(ctx, c), 0x74c0fc, 30, ms(450)))
      }
      ctx.shake(4, ms(280))
      break

    case "bubble":
      spawn(lightFlash(layer, above(ctx, target, -26), 0x66d9e8, 50, ms(550)))
      spawn(burst(layer, at, 0x66d9e8, 34, ms(500)))
      spawn(
        particles(layer, above(ctx, target, -10), {
          ...FX.bubbles(),
          colors: [0x66d9e8, 0xe3fafc, 0xffffff],
        }),
      )
      break

    case "bite": {
      const flip = top(ctx, target).x < top(ctx, launcher).x
      spawn(slash(layer, above(ctx, target, -24), 0xff6b6b, flip, ms(240)))
      spawn(
        particles(
          layer,
          above(ctx, target, -24),
          FX.sparks([0xff6b6b, 0xc92a2a]),
        ),
      )
      ctx.shake(3, ms(200))
      break
    }

    case "dive":
      // the launcher has just landed on the target cell
      spawn(lightFlash(layer, above(ctx, target, -10), 0x74c0fc, 60, ms(400)))
      spawn(
        particles(layer, at, { ...FX.splash(), count: 30, speed: [100, 220] }),
      )
      for (const c of zone)
        spawn(particles(layer, top(ctx, c), { ...FX.splash(), count: 8 }))
      ctx.shake(5, ms(300))
      break
  }
}

/** Takeoff of a leap or dive. */
export function leapTakeoffFx(ctx: FxContext, from: Point) {
  if (ctx.isWater(from)) {
    ctx.spawn(particles(ctx.layer, top(ctx, from), FX.splash()))
    return
  }
  ctx.spawn(
    particles(ctx.layer, top(ctx, from), {
      ...FX.smoke(10, 0x845ef7),
      count: 10,
    }),
  )
}

/** Landing after a leap or dash (a big splash in water). */
export function landingFx(ctx: FxContext, at: Point) {
  if (ctx.isWater(at)) {
    ctx.spawn(particles(ctx.layer, top(ctx, at), { ...FX.splash(), count: 24 }))
  } else {
    ctx.spawn(particles(ctx.layer, top(ctx, at), FX.dust(14)))
    ctx.spawn(
      particles(ctx.layer, top(ctx, at), {
        ...FX.smoke(10, 0x845ef7),
        count: 8,
      }),
    )
  }
  ctx.board.shockwave(at, [at], 4, { duration: ctx.ms(360) })
}

/** Step feedback: splashes in water. */
export function stepFx(ctx: FxContext, at: Point, water: boolean) {
  if (water) ctx.spawn(particles(ctx.layer, top(ctx, at), FX.splash()))
}

/** A fighter is hit. */
export function hitFx(ctx: FxContext, at: Point, critical: boolean) {
  const p = above(ctx, at, -26)
  ctx.spawn(
    lightFlash(
      ctx.layer,
      p,
      critical ? 0xffd43b : 0xffffff,
      critical ? 50 : 28,
      ctx.ms(220),
    ),
  )
  if (critical) {
    ctx.spawn(particles(ctx.layer, p, FX.sparks([0xffd43b, 0xffffff])))
    ctx.shake(6, ctx.ms(260))
  }
}

/** A fighter dies: smoke and a rising soul light. */
export function deathFx(ctx: FxContext, at: Point) {
  ctx.spawn(
    particles(ctx.layer, above(ctx, at, -10), { ...FX.smoke(14), count: 18 }),
  )
  ctx.spawn(
    lightFlash(ctx.layer, above(ctx, at, -30), 0xe5dbff, 40, ctx.ms(700)),
  )
  ctx.spawn(
    particles(ctx.layer, above(ctx, at, -30), {
      ...FX.sparkles([0xffffff, 0xe5dbff], 6),
      count: 14,
      gravity: -140,
    }),
  )
}

/** Divine powers. */
export function divineFx(
  ctx: FxContext,
  divineId: string,
  target: Point | null,
  allies: Point[],
) {
  const { layer, spawn, ms } = ctx
  switch (divineId) {
    case "timeWarp":
      if (!target) return
      spawn(lightning(layer, above(ctx, target, -20), 0xb197fc, ms(500)))
      spawn(lightFlash(layer, above(ctx, target, -20), 0xb197fc, 70, ms(600)))
      spawn(burst(layer, top(ctx, target), 0xb197fc, 50, ms(600)))
      spawn(
        particles(
          layer,
          above(ctx, target, -20),
          FX.sparkles([0xb197fc, 0xe5dbff]),
        ),
      )
      ctx.shake(4, ms(250))
      break

    case "earthquake": {
      if (!target) return
      const zone = zoneCells(target, { shape: "diamond", max: 2 }).filter(
        ctx.inBounds,
      )
      ctx.board.shockwave(target, zone, 12, { duration: ms(600), step: ms(90) })
      spawn(lightning(layer, above(ctx, target, 0), 0xff922b, ms(350)))
      spawn(particles(layer, top(ctx, target), FX.debris()))
      for (const c of zone)
        spawn(particles(layer, top(ctx, c), { ...FX.dust(12), count: 5 }))
      ctx.shake(12, ms(600))
      break
    }

    case "blessing":
      for (const p of allies) {
        spawn(lightBeam(layer, top(ctx, p), 0xffe066, ms(900)))
        spawn(
          particles(
            layer,
            above(ctx, p, -10),
            FX.sparkles([0xffe066, 0xfff3bf, 0xffffff]),
          ),
        )
      }
      break
  }
}

/** Two allies on the same cell join forces (combined action). */
export function comboFx(ctx: FxContext, cell: Point) {
  const { layer, spawn, ms } = ctx
  spawn(lightFlash(layer, above(ctx, cell, -24), 0x63e6be, 60, ms(500)))
  spawn(burst(layer, top(ctx, cell), 0x63e6be, 40, ms(500)))
  spawn(
    particles(
      layer,
      above(ctx, cell, -16),
      FX.sparkles([0x63e6be, 0xffffff, 0xb197fc], 12),
    ),
  )
}

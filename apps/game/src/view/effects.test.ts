import { describe, expect, test } from "bun:test"
import type * as booyah from "@ghom/booyah"
import {
  ACTIONS,
  Board,
  buildSpell,
  DIVINE_ACTIONS,
  generateSpell,
  type Point,
} from "@realms/engine"
import { Container } from "pixi.js"
import { CHARACTER_ART } from "../art/pixelArt"
import { mount, runToEnd, tick } from "../test/harness"
import {
  ACTION_POSE,
  actionIcon,
  comboFx,
  deathFx,
  divineFx,
  type FxContext,
  genericPose,
  genericProjectile,
  hasOwnFx,
  hitFx,
  impactFx,
  isMelee,
  landingFx,
  leapTakeoffFx,
  PROJECTILES,
  stepFx,
} from "./actionFx"
import BoardView from "./BoardView"
import {
  burst,
  FX,
  floatingText,
  lightBeam,
  lightFlash,
  lightning,
  Particles,
  particles,
  projectile,
  slash,
  softCircle,
} from "./effects"
import { artToTexture, characterTexture, iconTexture } from "./textures"

describe("visual effects", () => {
  test("soft circle texture is cached", () => {
    expect(softCircle()).toBe(softCircle())
  })

  test("every particle preset bursts and cleans up", () => {
    const presets = [
      FX.fire(),
      FX.smoke(),
      FX.dust(),
      FX.sparks(),
      FX.debris(),
      FX.splash(),
      FX.sparkles([0xffffff]),
      FX.bubbles(),
      FX.ice(),
    ]
    for (const config of presets) {
      const layer = new Container()
      const chip = new Particles(layer, { x: 0, y: 0 }, config)
      mount(chip, layer)
      expect(layer.children.length).toBe(config.count)
      tick(chip, 3000)
      expect(chip.state).toBe("inactive")
      expect(layer.children.length).toBe(0)
    }
  })

  test("particles move and fade over time", () => {
    const layer = new Container()
    const chip = particles(
      layer,
      { x: 0, y: 0 },
      { ...FX.sparks(), count: 1, life: [500, 500] },
    )
    mount(chip, layer)
    const sprite = layer.children[0]
    tick(chip, 100)
    expect(sprite.x !== 0 || sprite.y !== 0).toBe(true)
    expect(sprite.alpha).toBeLessThan(1)
  })

  const timed: [string, (layer: Container) => booyah.Chip][] = [
    ["lightFlash", (l) => lightFlash(l, { x: 0, y: 0 }, 0xffffff, 40, 200)],
    ["lightning", (l) => lightning(l, { x: 0, y: 0 }, 0xffffff, 200)],
    ["slash", (l) => slash(l, { x: 0, y: 0 }, 0xffffff, true, 200)],
    ["burst", (l) => burst(l, { x: 0, y: 0 }, 0xffffff, 30, 200)],
    ["lightBeam", (l) => lightBeam(l, { x: 0, y: 0 }, 0xffffff, 200)],
    ["floatingText", (l) => floatingText(l, { x: 0, y: 0 }, "-12", 0xff0000)],
    [
      "projectile (orb)",
      (l) => projectile(l, { x: 0, y: 0 }, { x: 100, y: 0 }, 200, { color: 1 }),
    ],
    [
      "projectile (icon)",
      (l) =>
        projectile(l, { x: 0, y: 0 }, { x: 100, y: 0 }, 200, PROJECTILES.arrow),
    ],
  ]
  for (const [name, make] of timed) {
    test(`${name} plays and removes itself`, () => {
      const layer = new Container()
      const chip = make(layer)
      mount(chip, layer)
      expect(layer.children.length).toBeGreaterThan(0)
      tick(chip, 1500)
      expect(chip.state).toBe("inactive")
      expect(layer.children.length).toBe(0)
    })
  }

  test("projectiles leave a trail", () => {
    const layer = new Container()
    const spawned: booyah.ChipResolvable[] = []
    const chip = projectile(
      layer,
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      400,
      PROJECTILES.fireball,
      (c) => spawned.push(c),
    )
    runToEnd(chip)
    expect(spawned.length).toBeGreaterThan(3)
  })
})

describe("action staging", () => {
  // movement actions (sprint) are staged as steps, without pose or impact
  const staged = Object.values(ACTIONS).filter((a) => !a.movement)

  test("every action has a pose, ranged ones a projectile", () => {
    for (const action of staged) {
      expect(ACTION_POSE[action.id]).toBeDefined()
      if (ACTION_POSE[action.id] === "shoot")
        expect(PROJECTILES[action.id]).toBeDefined()
    }
    expect(isMelee("kick")).toBe(true)
    expect(isMelee("arrow")).toBe(false)
  })

  function context() {
    const board = new Board(9, 9)
    const view = new BoardView(board, new Container(), new Container())
    mount(view)
    const spawned: booyah.ChipResolvable[] = []
    const shakes: number[] = []
    const waves: Point[][] = []
    const original = view.shockwave.bind(view)
    view.shockwave = (center, cells, ...rest) => {
      waves.push(cells)
      original(center, cells, ...rest)
    }
    const ctx: FxContext = {
      layer: new Container(),
      board: view,
      ms: (d) => d,
      spawn: (chip) => spawned.push(chip),
      shake: (intensity) => shakes.push(intensity),
      inBounds: (p) => board.inBounds(p),
      isWater: (p) => p.x === 4 && p.y === 4,
    }
    return { ctx, spawned, shakes, waves, view }
  }

  test("every action impact spawns effects; damaging ones sink the zone", () => {
    for (const action of staged) {
      const { ctx, spawned, waves } = context()
      const damaging = action.effects.some((e) => e.type === "damage")
      const target = { x: 4, y: 4 }
      impactFx(ctx, action.id, { x: 3, y: 4 }, target, [target], damaging)
      if (action.id !== "leap") expect(spawned.length).toBeGreaterThan(0)
      expect(waves.length).toBe(damaging ? 1 : 0)
    }
  })

  test("forged spells get generic visuals, whatever their parts", () => {
    for (let seed = 0; seed < 60; seed++) {
      const def = buildSpell(generateSpell(seed))
      expect(hasOwnFx(def.id)).toBe(false)
      expect(["melee", "cast", "shoot", "roar"]).toContain(genericPose(def))
      expect(iconTexture(actionIcon(def))).toBeDefined()
      const { ctx, spawned } = context()
      const target = { x: 4, y: 4 }
      const zone = def.area
        ? [target, { x: 5, y: 4 }, { x: 3, y: 4 }]
        : [target]
      const damaging = def.effects.some((e) => e.type === "damage")
      impactFx(ctx, def.id, { x: 3, y: 4 }, target, zone, damaging, def)
      expect(spawned.length).toBeGreaterThan(0)
      if (genericPose(def) !== "melee") {
        const chip = projectile(
          new Container(),
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          200,
          genericProjectile(def),
        )
        runToEnd(chip)
      }
    }
  })

  test("the shockwave covers the whole zone", () => {
    const { ctx, view } = context()
    const zone = [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 3, y: 4 },
    ]
    impactFx(ctx, "fireball", { x: 0, y: 4 }, { x: 4, y: 4 }, zone, true)
    tick(view, 100)
    expect(view.cellOffset({ x: 4, y: 4 })).toBeGreaterThan(0)
  })

  test("hits, deaths, steps, leaps, combos and divine powers", () => {
    const { ctx, spawned, shakes, waves } = context()
    hitFx(ctx, { x: 1, y: 1 }, false)
    expect(shakes).toHaveLength(0)
    hitFx(ctx, { x: 1, y: 1 }, true)
    expect(shakes).toHaveLength(1)
    deathFx(ctx, { x: 1, y: 1 })
    stepFx(ctx, { x: 1, y: 1 }, false)
    const before = spawned.length
    stepFx(ctx, { x: 1, y: 1 }, true)
    expect(spawned.length).toBe(before + 1)
    leapTakeoffFx(ctx, { x: 1, y: 1 })
    landingFx(ctx, { x: 2, y: 1 })
    comboFx(ctx, { x: 2, y: 1 })
    for (const id of Object.keys(DIVINE_ACTIONS)) {
      divineFx(ctx, id, { x: 4, y: 4 }, [{ x: 0, y: 0 }])
    }
    divineFx(ctx, "timeWarp", null, [])
    divineFx(ctx, "earthquake", null, [])
    expect(waves.length).toBeGreaterThanOrEqual(2) // landing + earthquake
    expect(spawned.length).toBeGreaterThan(15)
  })
})

describe("textures", () => {
  test("pixel art textures are cached per key", () => {
    expect(characterTexture("eva")).toBe(characterTexture("eva"))
    expect(iconTexture("arrow")).toBe(iconTexture("arrow"))
    expect(artToTexture("test", CHARACTER_ART.eva).width).toBe(16)
  })
})

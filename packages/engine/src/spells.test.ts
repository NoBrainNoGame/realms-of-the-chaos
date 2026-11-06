import { describe, expect, test } from "bun:test"
import { ACTIONS } from "./content"
import {
  actionFeatures,
  buildSpell,
  calibrationSet,
  checkSpell,
  describeSpell,
  featureCost,
  generateSpell,
  isSpell,
  NAME_RULE,
  previewSpell,
  SPELL_COST,
  type SpellRecipe,
  spellCost,
  spellValue,
} from "./spells"

/** A plain ranged attack: the base every variation starts from. */
const base = (): SpellRecipe => ({
  name: "Éclair vif",
  target: "enemy",
  launch: { shape: "diamond", min: 1, max: 3 },
  lineOfSight: true,
  effects: [{ type: "damage", kind: "physical", power: 5 }],
})

const withEffects = (effects: SpellRecipe["effects"]): SpellRecipe => ({
  ...base(),
  effects,
})

describe("calibration on the catalogue", () => {
  const rows = calibrationSet().map(({ action }) => {
    const derived = featureCost(actionFeatures(action))
    const snapped = Math.round(derived / SPELL_COST.step) * SPELL_COST.step
    return { id: action.id, real: action.timeCost, snapped }
  })

  test("the model prices most of the catalogue", () => {
    expect(rows.length).toBeGreaterThanOrEqual(15)
    // movement and dash actions are out of the model
    expect(rows.map((r) => r.id)).not.toContain("sprint")
    expect(rows.map((r) => r.id)).not.toContain("leap")
  })

  test("derived costs reproduce the designed ones (mean 20%, worst 40%)", () => {
    const errors = rows.map((r) => Math.abs(r.snapped / r.real - 1))
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length
    expect(mean).toBeLessThanOrEqual(0.2)
    expect(Math.max(...errors)).toBeLessThanOrEqual(0.4)
  })

  test("a recipe's value is the value of its own action", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const recipe = generateSpell(seed)
      const action = buildSpell(recipe)
      expect(featureCost(actionFeatures(action))).toBeCloseTo(
        previewSpell(recipe).rawCost,
        1,
      )
    }
  })
})

describe("cost is monotonic in the parts", () => {
  const cheaper = (a: SpellRecipe, b: SpellRecipe) => {
    expect(spellValue(a)).toBeLessThan(spellValue(b))
    expect(spellCost(a)).toBeLessThan(spellCost(b))
  }

  test("more power costs more", () => {
    const power = (p: number) =>
      withEffects([{ type: "damage", kind: "physical", power: p }])
    cheaper(power(4), power(9))
    for (let p = 3; p <= 11; p++)
      expect(spellCost(power(p))).toBeLessThanOrEqual(spellCost(power(p + 1)))
    const heal = (p: number): SpellRecipe => ({
      ...base(),
      target: "ally",
      effects: [{ type: "heal", power: p }],
    })
    cheaper(heal(4), heal(10))
    cheaper(
      withEffects([{ type: "push", distance: 1 }]),
      withEffects([{ type: "push", distance: 3 }]),
    )
  })

  test("a second effect costs more", () => {
    cheaper(
      base(),
      withEffects([
        { type: "damage", kind: "physical", power: 5 },
        { type: "push", distance: 2 },
      ]),
    )
  })

  test("longer range costs more", () => {
    const range = (max: number): SpellRecipe => ({
      ...base(),
      launch: { shape: "diamond", min: 1, max },
    })
    cheaper(range(2), range(5))
    cheaper(range(1), range(3))
  })

  test("a bigger area costs more", () => {
    const area = (max: number): SpellRecipe => ({
      ...base(),
      area: { shape: "diamond", min: 0, max },
      affects: "enemies",
    })
    cheaper(base(), area(1))
    cheaper(area(1), area(2))
  })

  test("longer statuses cost more", () => {
    const slow = (turns: number) =>
      withEffects([
        { type: "damage", kind: "magical", power: 4 },
        { type: "status", status: "slowed", turns },
      ])
    cheaper(slow(1), slow(3))
    const haste = (turns: number): SpellRecipe => ({
      ...base(),
      target: "ally",
      effects: [{ type: "status", status: "hasted", turns }],
    })
    cheaper(haste(1), haste(3))
    const poison = (turns: number) =>
      withEffects([{ type: "status", status: "poisoned", turns, value: 4 }])
    cheaper(poison(1), poison(4))
    const shield = (turns: number): SpellRecipe => ({
      ...base(),
      target: "ally",
      effects: [{ type: "status", status: "shielded", turns, value: 10 }],
    })
    cheaper(shield(1), shield(3))
  })

  test("drawbacks make a spell cheaper", () => {
    const strong: SpellRecipe = {
      ...base(),
      area: { shape: "diamond", min: 0, max: 1 },
      affects: "enemies",
      effects: [{ type: "damage", kind: "magical", power: 9 }],
    }
    cheaper({ ...strong, cooldown: 2 }, strong)
    cheaper({ ...strong, cooldown: 3 }, { ...strong, cooldown: 1 })
    cheaper({ ...strong, affects: "all" }, strong)
    cheaper(
      { ...strong, launch: { shape: "diamond", min: 3, max: 3 } },
      { ...strong, launch: { shape: "diamond", min: 1, max: 3 } },
    )
    // walls block a spell that needs line of sight: cheaper than one that
    // flies over them
    cheaper(strong, { ...strong, lineOfSight: false })
  })

  test("flexible targets cost more", () => {
    cheaper(base(), { ...base(), target: "any" })
  })

  test("price stays inside the bounds", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const cost = spellCost(generateSpell(seed))
      expect(cost).toBeGreaterThanOrEqual(SPELL_COST.min)
      expect(cost).toBeLessThanOrEqual(SPELL_COST.max)
    }
  })
})

describe("checking recipes", () => {
  test("a valid recipe is built, priced and described", () => {
    const check = checkSpell(base())
    expect(check.ok).toBe(true)
    if (!check.ok) return
    expect(check.action.id).toBe("spell:Éclair vif")
    expect(isSpell(check.action)).toBe(true)
    expect(isSpell(ACTIONS.kick)).toBe(false)
    expect(check.action.timeCost).toBe(spellCost(base()))
    expect(check.action.launch).toEqual({ shape: "diamond", min: 1, max: 3 })
    expect(check.action.lineOfSight).toBe(true)
    expect(check.action.description).toContain("5 dégâts physiques")
    expect(describeSpell(base())).toMatch(/^[A-Z0-9É]/)
  })

  test("an over-powered recipe is refused", () => {
    const overpowered: SpellRecipe = {
      name: "Fin des temps",
      target: "any",
      launch: { shape: "diamond", min: 0, max: 6 },
      lineOfSight: false,
      area: { shape: "square", min: 0, max: 1 },
      affects: "enemies",
      effects: [
        { type: "damage", kind: "magical", power: 12 },
        { type: "push", distance: 3 },
      ],
    }
    const check = checkSpell(overpowered)
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.reason).toContain("trop puissant")
    expect(previewSpell(overpowered).rawCost).toBeGreaterThan(SPELL_COST.max)
    expect(() => buildSpell(overpowered)).toThrow()
    // the same spell with drawbacks passes
    expect(
      checkSpell({
        ...overpowered,
        lineOfSight: true,
        cooldown: 3,
        affects: "all",
        launch: { shape: "diamond", min: 2, max: 4 },
      }).ok,
    ).toBe(true)
  })

  test("a feeble spell is clamped to the minimum cost, not refused", () => {
    const feeble: SpellRecipe = {
      name: "Chiquenaude",
      target: "self",
      launch: { shape: "point", min: 0, max: 0 },
      lineOfSight: false,
      area: { shape: "diamond", min: 1, max: 1 },
      affects: "enemies",
      effects: [{ type: "push", distance: 1 }],
      cooldown: 3,
    }
    const check = checkSpell(feeble)
    expect(check.ok && check.action.timeCost).toBe(SPELL_COST.min)
  })

  test("invalid parts are refused", () => {
    const refused = (change: object) => checkSpell({ ...base(), ...change }).ok
    expect(refused({})).toBe(true)
    expect(refused({ name: "" })).toBe(false)
    expect(refused({ name: "<script>" })).toBe(false)
    expect(refused({ name: "A".repeat(30) })).toBe(false)
    expect(refused({ target: "everyone" })).toBe(false)
    expect(refused({ launch: { shape: "diamond", min: 1, max: 9 } })).toBe(
      false,
    )
    expect(refused({ launch: { shape: "diamond", min: 3, max: 2 } })).toBe(
      false,
    )
    expect(refused({ launch: { shape: "square", min: 1, max: 3 } })).toBe(false)
    expect(refused({ launch: { shape: "diamond", min: 1.5, max: 3 } })).toBe(
      false,
    )
    expect(refused({ lineOfSight: "yes" })).toBe(false)
    expect(refused({ cooldown: 9 })).toBe(false)
    expect(refused({ cooldown: 1.5 })).toBe(false)
    expect(refused({ effects: [] })).toBe(false)
    expect(
      refused({
        effects: [
          { type: "damage", kind: "physical", power: 2 },
          { type: "push", distance: 1 },
          { type: "delay", amount: 5 },
        ],
      }),
    ).toBe(false)
    // numbers must be on their steps
    for (const effect of [
      { type: "damage", kind: "physical", power: 99 },
      { type: "damage", kind: "physical", power: 5.5 },
      { type: "damage", kind: "fire", power: 5 },
      { type: "damage", kind: "physical", power: Number.NaN },
      { type: "push", distance: 10 },
      { type: "delay", amount: 7 },
      { type: "status", status: "poisoned", turns: 2 },
      { type: "status", status: "slowed", turns: 2, value: 5 },
      { type: "status", status: "hasted", turns: 9 },
      { type: "status", status: "frozen", turns: 1 },
      { type: "dash" },
      { type: "selfHeal", power: 5 },
    ])
      expect(refused({ effects: [effect] })).toBe(false)
    // twice the same effect
    expect(
      refused({
        effects: [
          { type: "damage", kind: "physical", power: 5 },
          { type: "damage", kind: "physical", power: 6 },
        ],
      }),
    ).toBe(false)
    expect(checkSpell(null).ok).toBe(false)
    expect(checkSpell("fireball").ok).toBe(false)
  })

  test("incoherent combinations are refused", () => {
    const refused = (change: object) => checkSpell({ ...base(), ...change }).ok
    const heal = [{ type: "heal", power: 6 }]
    // hostile on an ally, benefit on an enemy
    expect(refused({ target: "ally" })).toBe(false)
    expect(refused({ effects: heal })).toBe(false)
    expect(refused({ target: "ally", effects: heal })).toBe(true)
    // hostile and benefit effects do not mix
    expect(
      refused({
        target: "any",
        effects: [
          { type: "damage", kind: "physical", power: 5 },
          { type: "heal", power: 5 },
        ],
      }),
    ).toBe(false)
    // self has no range, and a hostile self spell needs an area
    expect(refused({ target: "self" })).toBe(false)
    const self = {
      target: "self",
      launch: { shape: "point", min: 0, max: 0 },
      lineOfSight: false,
    }
    expect(refused(self)).toBe(false)
    expect(
      refused({
        ...self,
        area: { shape: "diamond", min: 1, max: 1 },
        affects: "enemies",
      }),
    ).toBe(true)
    // affects only means something with an area
    expect(refused({ affects: "all" })).toBe(false)
    expect(
      refused({
        area: { shape: "diamond", min: 0, max: 1 },
        affects: "allies",
      }),
    ).toBe(false)
    expect(
      refused({ area: { shape: "diamond", min: 0, max: 1 }, affects: "all" }),
    ).toBe(true)
    expect(refused({ area: { shape: "diamond", min: 0, max: 1 } })).toBe(false)
    expect(
      refused({
        area: { shape: "diamond", min: 0, max: 9 },
        affects: "enemies",
      }),
    ).toBe(false)
  })

  test("a client's timeCost and extra fields are ignored", () => {
    const honest = checkSpell(base())
    const sneaky = checkSpell({
      ...base(),
      timeCost: 0.01,
      id: "kick",
      movement: { reach: 9 },
      combo: { baseId: "x", partnerPresetId: "y" },
      effects: [{ type: "damage", kind: "physical", power: 5, timeCost: 0 }],
    })
    expect(honest.ok && sneaky.ok).toBe(true)
    if (!honest.ok || !sneaky.ok) return
    expect(sneaky.action.timeCost).toBe(honest.action.timeCost)
    expect(sneaky.action.id).toBe("spell:Éclair vif")
    expect(sneaky.action.movement).toBeUndefined()
    expect(sneaky.action.combo).toBeUndefined()
  })

  test("range 1 ignores the line of sight flag", () => {
    const melee = (lineOfSight: boolean): SpellRecipe => ({
      ...base(),
      launch: { shape: "line", min: 1, max: 1 },
      lineOfSight,
    })
    expect(spellCost(melee(true))).toBe(spellCost(melee(false)))
    const action = buildSpell(melee(true))
    expect(action.lineOfSight).toBe(false)
  })
})

describe("generated spells", () => {
  test("same seed, same spell; every one is valid and well named", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const recipe = generateSpell(seed)
      expect(generateSpell(seed)).toEqual(recipe)
      expect(checkSpell(recipe).ok).toBe(true)
      expect(NAME_RULE.test(recipe.name)).toBe(true)
      expect(JSON.parse(JSON.stringify(recipe))).toEqual(recipe)
    }
    const kinds = new Set(
      Array.from({ length: 60 }, (_, i) => generateSpell(i + 1, "support"))
        .flatMap((r) => r.effects)
        .map((e) => e.type),
    )
    expect(kinds.has("heal") || kinds.has("status")).toBe(true)
    expect(kinds.has("damage")).toBe(false)
  })
})

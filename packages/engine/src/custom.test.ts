import { describe, expect, test } from "bun:test"
import { power, presetPower, STAT_LIMITS } from "./balance"
import { Board } from "./board"
import { Combat } from "./combat"
import { CHARACTERS } from "./content"
import {
  CUSTOM_STATS,
  CUSTOM_STEP,
  type CustomCharacter,
  checkCustom,
  customDefaults,
  customPreset,
  customRange,
  customStats,
} from "./custom"
import { runTournament } from "./tournament"

const KITS = Object.keys(CHARACTERS)

const build = (kit: string, change: Partial<CustomCharacter["stats"]> = {}) =>
  ({
    name: "Aube",
    kit,
    stats: { ...customDefaults(kit), ...change },
  }) satisfies CustomCharacter

describe("custom characters", () => {
  test("every kit's starting point is valid and as strong as its reference", () => {
    for (const kit of KITS) {
      const check = checkCustom(build(kit))
      expect(check.ok).toBe(true)
      if (!check.ok) continue
      const { stats, actions } = check.preset
      expect(power(stats, actions)).toBeCloseTo(presetPower(CHARACTERS[kit]))
      expect(check.preset.kit).toBe(kit)
      expect(check.preset.actions).toEqual(CHARACTERS[kit].actions)
    }
  })

  test("raising a stat lowers health, the power stays the same", () => {
    for (const kit of KITS) {
      const before = customStats(kit, customDefaults(kit))
      for (const name of [
        "speed",
        "physicalDefense",
        "magicalDefense",
      ] as const) {
        const chosen = { ...customDefaults(kit), [name]: before[name] + 1 }
        const after = customStats(kit, chosen)
        expect(after.health).toBeLessThan(before.health)
        const { actions } = CHARACTERS[kit]
        expect(power(after, actions)).toBeCloseTo(power(before, actions))
      }
    }
    // the attack a kit uses costs health, the one it ignores costs nothing
    const eva = customDefaults("eva")
    const base = customStats("eva", eva).health
    expect(
      customStats("eva", { ...eva, physicalAttack: eva.physicalAttack + 2 })
        .health,
    ).toBeLessThan(base)
  })

  test("the sliders' ranges keep the character valid, one step more does not", () => {
    for (const kit of KITS) {
      const chosen = customDefaults(kit)
      for (const name of CUSTOM_STATS) {
        const { min, max } = customRange(kit, chosen, name)
        expect(min).toBeLessThanOrEqual(chosen[name])
        expect(max).toBeGreaterThanOrEqual(chosen[name])
        expect(checkCustom(build(kit, { [name]: min })).ok).toBe(true)
        expect(checkCustom(build(kit, { [name]: max })).ok).toBe(true)
        if (min - CUSTOM_STEP >= STAT_LIMITS[name].min)
          expect(
            checkCustom(build(kit, { [name]: min - CUSTOM_STEP })).ok,
          ).toBe(false)
        if (max + CUSTOM_STEP <= STAT_LIMITS[name].max)
          expect(
            checkCustom(build(kit, { [name]: max + CUSTOM_STEP })).ok,
          ).toBe(false)
      }
    }
  })

  test("extremes and tampered characters are refused", () => {
    const refused = (character: unknown) =>
      checkCustom(character as CustomCharacter).ok
    const maxed = Object.fromEntries(
      CUSTOM_STATS.map((name) => [name, STAT_LIMITS[name].max]),
    )
    expect(refused(build("gorr", maxed))).toBe(false)
    const minimal = Object.fromEntries(
      CUSTOM_STATS.map((name) => [name, STAT_LIMITS[name].min]),
    )
    expect(refused(build("gorr", minimal))).toBe(false)
    expect(refused({ ...build("eva"), kit: "nobody" })).toBe(false)
    expect(refused({ ...build("eva"), name: "" })).toBe(false)
    expect(refused({ ...build("eva"), name: "<script>" })).toBe(false)
    expect(refused({ ...build("eva"), name: "A".repeat(30) })).toBe(false)
    expect(refused(build("eva", { speed: 6.3 }))).toBe(false)
    expect(refused(build("eva", { luck: Number.NaN }))).toBe(false)
    expect(refused(build("eva", { luck: 40 }))).toBe(false)
    expect(refused({ name: "Aube", kit: "eva" })).toBe(false)
    // health is never taken from the client
    const sneaky = build("eva") as CustomCharacter & {
      stats: { health?: number }
    }
    sneaky.stats.health = 99
    const check = checkCustom(sneaky)
    expect(check.ok && check.preset.stats.health).toBeLessThan(20)
    expect(() => customPreset({ ...build("eva"), kit: "x" })).toThrow()
  })

  test("a custom character fights, and holds its own against the references", () => {
    const glass = customPreset({
      name: "Verre",
      kit: "nyx",
      stats: {
        ...customDefaults("nyx"),
        speed: customRange("nyx", customDefaults("nyx"), "speed").max,
      },
    })
    const combat = new Combat({
      seed: 3,
      board: new Board(8, 8),
      teams: [
        { controller: "ai", fighters: [glass] },
        { controller: "ai", fighters: ["gorr"] },
      ],
    })
    expect(combat.fighters[0].name).toBe("Verre")
    expect(combat.fighters[0].stats).toEqual(glass.stats)

    // a pool of custom characters pushed to their slider limits
    const pool = KITS.map((kit, i) => {
      const chosen = customDefaults(kit)
      const name = CUSTOM_STATS[i % CUSTOM_STATS.length]
      const { min, max } = customRange(kit, chosen, name)
      return customPreset({
        name: `Écho ${String.fromCharCode(65 + i)}`,
        kit,
        stats: { ...chosen, [name]: i % 2 ? min : max },
      })
    })
    const result = runTournament({
      pool: [...pool, ...KITS],
      pairs: 40,
      seed: 1,
    })
    for (const preset of pool) {
      const rate = result.characters[preset.id]?.winRate
      expect(rate).toBeGreaterThan(0.25)
      expect(rate).toBeLessThan(0.75)
    }
  }, 60_000)
})

import { describe, expect, test } from "bun:test"
import { decide } from "./ai"
import { power, presetPower, STAT_LIMITS } from "./balance"
import { Board } from "./board"
import { Combat, type Command } from "./combat"
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
  MAX_SPELLS,
} from "./custom"
import { generateSpell, type SpellRecipe } from "./spells"
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

/** Two distinct generated spells, from a seed. */
function spellsFor(seed: number): SpellRecipe[] {
  const first = generateSpell(seed * 7, "attack")
  let second = generateSpell(seed * 7 + 1, "attack")
  for (let i = 2; second.name === first.name; i++)
    second = generateSpell(seed * 7 + i, "attack")
  return [first, second]
}

const withSpells = (kit: string, spells: (string | SpellRecipe)[]) =>
  ({
    name: "Mage libre",
    kit,
    stats: customDefaults(kit, spells),
    spells,
  }) satisfies CustomCharacter

describe("custom characters with their own spells", () => {
  test("a valid kit of spells is as strong as the reference", () => {
    let valid = 0
    for (let seed = 1; seed <= 20; seed++) {
      const kit = KITS[seed % KITS.length]
      const character = withSpells(kit, spellsFor(seed))
      const check = checkCustom(character)
      // a spell can be too strong for a kit whose attack stats are low
      if (!check.ok) {
        expect(check.reason).toContain("too strong")
        continue
      }
      valid++
      expect(presetPower(check.preset)).toBeCloseTo(
        presetPower(CHARACTERS[kit]),
      )
      expect(check.preset.actions).toHaveLength(2)
      expect(check.preset.actions.every((id) => id.startsWith("spell:"))).toBe(
        true,
      )
      expect(Object.keys(check.preset.actionDefs ?? {})).toEqual(
        check.preset.actions,
      )
    }
    expect(valid).toBeGreaterThanOrEqual(12)
  })

  test("catalogue actions and spells can be mixed", () => {
    const spells = [spellsFor(3)[0], "kick"]
    const check = checkCustom(withSpells("eva", spells))
    expect(check.ok).toBe(true)
    if (!check.ok) return
    expect(check.preset.actions).toContain("kick")
    expect(check.preset.actionDefs?.kick).toBeUndefined()
  })

  test("bad spells are refused", () => {
    const [a] = spellsFor(5)
    const refused = (spells: (string | SpellRecipe)[]) =>
      checkCustom({
        ...build("nyx"),
        stats: (() => {
          try {
            return customDefaults("nyx", spells)
          } catch {
            return customDefaults("nyx")
          }
        })(),
        spells,
      }).ok
    expect(refused([a])).toBe(true)
    expect(refused([])).toBe(false)
    expect(refused([a, a])).toBe(false)
    expect(refused(["nothing"])).toBe(false)
    expect(refused(["sprint"])).toBe(false)
    expect(refused([{ ...a, effects: [] }])).toBe(false)
    expect(MAX_SPELLS).toBe(3)
    const four = [1, 2, 3, 4].map((n) => ({
      ...a,
      name: `Sort ${"abcd"[n - 1]}`,
    }))
    expect(refused(four)).toBe(false)
    expect(refused(four.slice(0, 3))).toBe(true)
  })

  test("a spell character plays a full fight, and the replay is identical", () => {
    const hero = customPreset(withSpells("merlin", spellsFor(9)))
    const options = (seed: number) => ({
      seed,
      board: new Board(8, 8),
      teams: [
        { controller: "human" as const, fighters: [hero, "gorr"] },
        { controller: "ai" as const, fighters: ["eva", "brutus"] },
      ],
    })
    const play = (combat: Combat) => {
      for (let i = 0; i < 2000 && combat.state !== "ended"; i++) {
        combat.run()
        const me = combat.activeFighter
        if (!me) break
        let ended = false
        for (const step of decide(combat, me)) {
          const command: Command =
            step.type === "move"
              ? {
                  type: "moveTo",
                  fighterId: me.id,
                  destination: step.destination,
                }
              : step.type === "action"
                ? {
                    type: "useAction",
                    fighterId: me.id,
                    actionId: step.actionId,
                    target: step.target,
                  }
                : { type: "pass", fighterId: me.id }
          combat.execute(command)
          if (command.type !== "moveTo") ended = true
        }
        if (!ended) combat.execute({ type: "pass", fighterId: me.id })
      }
    }
    let spellUses = 0
    for (const seed of [1, 2, 3, 4]) {
      const original = new Combat(options(seed))
      play(original)
      expect(original.state).toBe("ended")
      spellUses += original.log.filter(
        (c) => c.type === "useAction" && c.actionId.startsWith("spell:"),
      ).length

      const replayed = Combat.replay(options(seed), original.log)
      expect(replayed.state).toBe("ended")
      expect(replayed.fighters.map((f) => f.hp)).toEqual(
        original.fighters.map((f) => f.hp),
      )
    }
    expect(spellUses).toBeGreaterThan(0)
  })

  test("tournament: spell characters hold their own against the references", () => {
    const pool: ReturnType<typeof customPreset>[] = []
    for (let seed = 1; pool.length < 12; seed++) {
      const character = withSpells(KITS[seed % KITS.length], spellsFor(seed))
      // some spells are too strong for a kit's attack stats: not offered
      if (!checkCustom(character).ok) continue
      const preset = customPreset(character)
      pool.push({ ...preset, id: `spells:${seed}`, name: `Mage ${seed}` })
    }
    const result = runTournament({
      pool: [...pool, ...KITS],
      pairs: 60,
      seed: 4,
    })
    const rates = pool.map((p) => result.characters[p.id].winRate)
    console.log(
      "spell tournament win rates:",
      rates.map((r) => r.toFixed(2)).join(" "),
    )
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length
    expect(mean).toBeGreaterThan(0.35)
    expect(mean).toBeLessThan(0.65)
  }, 60_000)
})

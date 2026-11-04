import { describe, expect, test } from "bun:test"
import {
  generateCharacter,
  healthFor,
  power,
  presetPower,
  STAT_LIMITS,
  withinLimits,
} from "./balance"
import { Board } from "./board"
import {
  Combat,
  DEATH_ENERGY,
  ENERGY_CATCH_UP,
  ENERGY_PERIOD,
  EROSION,
} from "./combat"
import { CHARACTERS } from "./content"
import { runTournament } from "./tournament"
import type { CharacterPreset } from "./types"

const PRESETS = Object.keys(CHARACTERS)

/**
 * Short tournaments (the long version is `bun run balance`). With about
 * 120 games per character, 3.5 standard deviations is ±15 %.
 */
const PAIRS = 60
const MIN_RATE = 0.35
const MAX_RATE = 0.65

describe("balance model", () => {
  test("power trades health against every other stat", () => {
    const eva = CHARACTERS.eva
    const target = presetPower(eva)
    expect(healthFor(eva.stats, eva.actions, target)).toBeCloseTo(
      eva.stats.health,
    )
    for (const stat of [
      "speed",
      "physicalAttack",
      "physicalDefense",
      "magicalDefense",
      "luck",
    ] as const) {
      const stronger = { ...eva.stats, [stat]: eva.stats[stat] * 1.3 }
      const health = healthFor(stronger, eva.actions, target)
      expect(health).toBeLessThan(eva.stats.health) // more X → less health
      expect(power({ ...stronger, health }, eva.actions)).toBeCloseTo(target)
    }
    // a stat the kit does not use (eva has no magic action) is worth nothing
    const useless = { ...eva.stats, magicalAttack: 9 }
    expect(healthFor(useless, eva.actions, target)).toBeCloseTo(
      eva.stats.health,
    )
  })

  test("generated characters: deterministic, bounded, as strong as their kit", () => {
    expect(generateCharacter(5)).toEqual(generateCharacter(5))
    for (let seed = 0; seed < 80; seed++) {
      const kit = PRESETS[seed % PRESETS.length]
      const character = generateCharacter(seed, kit)
      expect(character.kit).toBe(kit)
      expect(character.actions).toEqual(CHARACTERS[kit].actions)
      expect(withinLimits(character.stats)).toBe(true)
      expect(power(character.stats, character.actions)).toBeCloseTo(
        presetPower(CHARACTERS[kit]),
        6,
      )
    }
  })

  test("the reference presets are within the limits", () => {
    for (const id of PRESETS) {
      expect({ id, ok: withinLimits(CHARACTERS[id].stats) }).toEqual({
        id,
        ok: true,
      })
    }
    expect(withinLimits({ ...CHARACTERS.eva.stats, speed: 2 })).toBe(false)
    expect(STAT_LIMITS.health.min).toBeGreaterThan(0)
  })

  test("generated characters fight like presets (combos included)", () => {
    const eva = generateCharacter(1, "eva")
    const merlin = generateCharacter(2, "merlin")
    const combat = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: [eva, merlin] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [
        [
          { x: 2, y: 2 },
          { x: 2, y: 2 },
        ],
        [{ x: 7, y: 7 }],
      ],
    })
    const [e] = combat.fighters
    expect(e.stats).toEqual(eva.stats)
    expect(combat.presetOf(e)).toBe(eva)
    // the named combo of the eva and merlin kits still applies
    const names = combat.actionsOf(e).map((a) => a.name)
    expect(names).toContain("Flèche incendiaire")
  })
})

describe("divine energy catch-up", () => {
  const duel = () =>
    new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: ["eva", "brutus"] },
        { controller: "human", fighters: ["gorr"] },
      ],
      positions: [
        [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
        [{ x: 8, y: 8 }],
      ],
    })

  test("each fallen ally speeds energy up and gives energy at once", () => {
    const combat = duel()
    const [eva, brutus, gorr] = combat.fighters
    expect(combat.energyRate(0)).toBeCloseTo(1 / ENERGY_PERIOD)

    combat.run()
    const before = combat.teams[0].energy
    brutus.hp = 1
    const me = combat.activeFighter!
    // kill brutus with a hit from whoever plays (friendly fire if needed)
    ;(combat as any)._applyDamage(brutus, 5, me.id, false)
    expect(brutus.alive).toBe(false)
    expect(combat.teams[0].energy).toBe(before + DEATH_ENERGY)
    expect(combat.energyRate(0)).toBeCloseTo(
      (1 + ENERGY_CATCH_UP) / ENERGY_PERIOD,
    )
    expect(combat.energyRate(1)).toBeCloseTo(1 / ENERGY_PERIOD)
    expect(eva.alive && gorr.alive).toBe(true)
  })

  test("the losing side gains energy faster over the same time", () => {
    const combat = duel()
    const [, brutus] = combat.fighters
    ;(combat as any)._applyDamage(brutus, 9999, null, false)
    combat.teams[0].energy = 0
    combat.teams[1].energy = 0
    ;(combat as any)._advanceTime(combat.time + ENERGY_PERIOD * 2)
    expect(combat.teams[0].energy).toBe(3) // 2 × 1.5
    expect(combat.teams[1].energy).toBe(2)
  })
})

describe("erosion", () => {
  test("part of every wound lowers max hit points for good", () => {
    const combat = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: ["lyra"] },
        { controller: "human", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    })
    const [lyra] = combat.fighters
    const full = combat.baseMaxHp(lyra)
    ;(combat as any)._applyDamage(lyra, 20, null, false)
    expect(lyra.erosion).toBeCloseTo(20 * EROSION)
    expect(combat.maxHp(lyra)).toBe(full - Math.floor(20 * EROSION))
    ;(combat as any)._heal(lyra, 999)
    expect(lyra.hp).toBe(combat.maxHp(lyra))
    expect(lyra.hp).toBeLessThan(full)
  })
})

function expectBalanced(
  result: ReturnType<typeof runTournament>,
  pool: (string | CharacterPreset)[],
) {
  expect(result.draws).toBe(0)
  const rates = Object.fromEntries(
    pool.map((p) => {
      const id = typeof p === "string" ? p : p.id
      return [id, Math.round(result.characters[id].winRate * 100) / 100]
    }),
  )
  for (const [id, rate] of Object.entries(rates)) {
    expect({ id, rate, ok: rate >= MIN_RATE && rate <= MAX_RATE }).toEqual({
      id,
      rate,
      ok: true,
    })
  }
}

describe("balance tournaments (AI vs AI, 3v3, sides swapped)", () => {
  test("every preset wins about half of its fights", () => {
    const result = runTournament({ pool: PRESETS, pairs: PAIRS, seed: 11 })
    expectBalanced(result, PRESETS)

    // no side advantage, reasonable fight length
    expect(result.firstSideWinRate).toBeGreaterThan(0.38)
    expect(result.firstSideWinRate).toBeLessThan(0.62)
    expect(result.actionsPerFighter).toBeGreaterThan(5)
    expect(result.actionsPerFighter).toBeLessThan(18)

    // every action is actually used (some depend on the map, e.g. diving)
    for (const id of PRESETS) {
      const uses = result.actionUses[id] ?? {}
      const own = CHARACTERS[id].actions.filter((a) => a !== "kick")
      const total = own.reduce((sum, a) => sum + (uses[a] ?? 0), 0)
      for (const action of own) {
        const share = (uses[action] ?? 0) / total
        expect({ id, action, used: share > 0.02 }).toEqual({
          id,
          action,
          used: true,
        })
      }
    }
  }, 120_000)

  test("generated characters are as fair as the presets", () => {
    const pool = Array.from({ length: 16 }, (_, i) =>
      generateCharacter(500 + i, PRESETS[i % PRESETS.length]),
    )
    const result = runTournament({ pool, pairs: PAIRS * 2, seed: 23 })
    expectBalanced(result, pool)
  }, 120_000)
})

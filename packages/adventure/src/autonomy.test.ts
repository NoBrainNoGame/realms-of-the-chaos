import { describe, expect, test } from "bun:test"
import { autonomyEffects, autonomyTier, fightRules } from "./index"
import type { FightSpec } from "./types"

describe("autonomy tiers and effects", () => {
  test("trust sets the tier, from broken to bound", () => {
    const tiers = [-5, -2, 0, 2, 5].map((n) => autonomyTier(n, 0))
    expect(tiers[0]).toBe("broken")
    expect(tiers[4]).toBe("bound")
    expect(new Set(tiers).size).toBeGreaterThan(2)
  })

  test("a fixed tier and a missing question are honoured by fightRules", () => {
    const spec = {
      teams: [
        {
          side: "allies",
          fighters: [
            { preset: "a", autonomy: { tier: "broken" } },
            { preset: "gorr", autonomy: { lineage: "gorr", needs: "q" } },
          ],
        },
      ],
      rules: {},
    } as unknown as FightSpec
    const rules = fightRules(spec, () => false)
    const tiers = rules.autonomy?.allies.map((a) => a.tier)
    expect(tiers).toEqual(["broken", "bound"])
  })

  test("insisting costs trust, respect earns it", () => {
    const spec = {
      teams: [
        {
          side: "allies",
          fighters: [{ preset: "b", autonomy: { lineage: "brutus" } }],
        },
      ],
      rules: {},
    } as unknown as FightSpec
    const report = {
      fighters: [{ id: "b-0-0", preset: "b", team: 0 }],
      autonomy: { insisted: ["b-0-0"], respected: [], letAct: [], ordered: [] },
    } as never
    expect(autonomyEffects(spec, report, () => 0)).toContainEqual({
      add: "confiance.brutus",
      by: -2,
    })
  })
})

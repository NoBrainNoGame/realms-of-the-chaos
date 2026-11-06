import { describe, expect, test } from "bun:test"
import { arcadeWaveOptions, startArcade, verifyArcadeRun } from "./arcade"
import { presetPower, STAT_LIMITS, withinLimits } from "./balance"
import { CHARACTERS } from "./content"
import { scarredCharacters, scarredFighter } from "./scars"

describe("scars", () => {
  test("no scar: the canonical characters", () => {
    expect(scarredCharacters(0)).toBe(CHARACTERS)
    expect(scarredFighter("merlin", 0)).toBe("merlin")
  })

  test("balance is kept, stats move, within limits, same ids", () => {
    for (const scars of [1, 2, 5, 12]) {
      const presets = scarredCharacters(scars)
      let changed = 0
      for (const [id, original] of Object.entries(CHARACTERS)) {
        const preset = presets[id]
        expect(preset.id).toBe(id)
        expect(preset.actions).toEqual(original.actions)
        expect(presetPower(preset)).toBeCloseTo(presetPower(original), 3)
        expect(withinLimits(preset.stats)).toBe(true)
        if (JSON.stringify(preset.stats) !== JSON.stringify(original.stats))
          changed++
        for (const name of Object.keys(
          STAT_LIMITS,
        ) as (keyof typeof original.stats)[]) {
          if (name === "health") continue
          expect(
            Math.abs(preset.stats[name] - original.stats[name]),
          ).toBeLessThanOrEqual(3 + 1e-9)
        }
      }
      expect(changed).toBeGreaterThanOrEqual(2)
    }
  })

  test("deterministic, and cumulative (one scar's changes stay)", () => {
    expect(scarredCharacters(3)).toEqual(scarredCharacters(3))
    const one = scarredCharacters(1)
    const changedOne = Object.keys(CHARACTERS).filter(
      (id) => one[id] !== CHARACTERS[id],
    )
    expect(changedOne.length).toBeGreaterThanOrEqual(2)
    expect(changedOne.length).toBeLessThanOrEqual(3)
  })

  test("arcade records carry their scars", () => {
    const state = startArcade(["merlin"])
    const options = arcadeWaveOptions(7, state, 3)
    expect(typeof options.teams[0].fighters[0]).toBe("object")
    expect(typeof arcadeWaveOptions(7, state).teams[0].fighters[0]).toBe(
      "string",
    )
    expect(
      verifyArcadeRun({ seed: 7, team: ["merlin"], waves: [], scars: 3 }),
    ).toEqual({ score: 0, waves: 0 })
  })
})

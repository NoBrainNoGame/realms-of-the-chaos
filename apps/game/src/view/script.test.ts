import { beforeEach, describe, expect, test } from "bun:test"
import type { FightSpec } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { playLocally } from "../test/play"
import FightScene from "./FightScene"

const spec: FightSpec = {
  id: "t.script",
  title: "Script",
  board: [".........", ".........", ".........", ".........", "........."],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "brutus", at: { x: 1, y: 1 } },
        { preset: "lyra", at: { x: 1, y: 3 } },
        { preset: "eva", at: { x: 0, y: 2 }, needs: "retour.eva" },
      ],
    },
    {
      name: "La Mine",
      side: "neutral",
      fighters: [
        {
          preset: "gorr",
          at: { x: 6, y: 2 },
          script: [
            { every: 2, act: { do: "use", action: "smash", at: "nearest" } },
            { act: { do: "stand" } },
          ],
        },
      ],
    },
  ],
  rules: {
    neutral: [1],
    clock: { period: 10, limit: 6, winner: 0 },
    scripted: [{ tick: 2, kind: "earthquake", at: [{ x: 8, y: 0 }] }],
    warmth: { hot: [], loss: 1 },
  },
  influences: [],
  startEnergy: 0,
  objectives: [],
  lines: [],
  goal: "",
}

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("scripted fights in the scene", () => {
  test("the script, the quake and the tiédeur reach the report", () => {
    const fs = mount(
      new FightScene(
        fightOptions(spec, 5, 1, { items: [], unlocks: [] }, () => []),
      ),
    )
    playLocally(fs)
    expect(fs.combat.state).toBe("ended")
    const report = reportOf(spec, fs.combat)
    expect(report.script?.acts).toBeGreaterThan(0)
    expect(report.script?.quakes).toEqual([{ x: 8, y: 0 }])
    expect(report.script?.warmth.lost).toBeGreaterThan(0)
  })

  test("a fighter that needs a flag joins only when it is set", () => {
    const without = fightOptions(
      spec,
      5,
      1,
      { items: [], unlocks: [], flags: {} },
      () => [],
    )
    expect(without.teams[0].fighters).toHaveLength(2)
    const withEva = fightOptions(
      spec,
      5,
      1,
      { items: [], unlocks: [], flags: { "retour.eva": true } },
      () => [],
    )
    expect(withEva.teams[0].fighters).toHaveLength(3)
  })
})

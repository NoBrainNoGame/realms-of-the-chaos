import { beforeEach, describe, expect, test } from "bun:test"
import type { FightSpec } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { playLocally } from "../test/play"
import FightScene from "./FightScene"

const spec = (
  extra: Partial<FightSpec["teams"][1]["fighters"][0]>[],
): FightSpec => ({
  id: "t.arrivals",
  title: "Arrivées",
  board: [".........", ".........", ".........", ".........", "........."],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "brutus", at: { x: 1, y: 1 } },
        { preset: "lyra", at: { x: 1, y: 3 } },
      ],
    },
    {
      name: "Vague",
      side: "enemies",
      fighters: [
        { preset: "squalor", at: { x: 7, y: 2 } },
        ...extra.map((e) => ({ preset: "merlin", at: { x: 7, y: 2 }, ...e })),
      ],
    },
  ],
  rules: { clock: { period: 10, limit: 60, winner: 0 } },
  influences: [],
  startEnergy: 0,
  objectives: [],
  lines: [],
  goal: "",
})

const scene = (s: FightSpec) =>
  mount(
    new FightScene(fightOptions(s, 5, 1, { items: [], unlocks: [] }, () => [])),
  )

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("arrivals and switches in the Adventure scene", () => {
  test("a wave enters at its tick, the fight plays to the end, the report counts it", () => {
    const s = spec([{ arrives: { tick: 2 } }])
    const fs = scene(s)
    const merlin = fs.combat.fighters.find((f) => f.presetId === "merlin")!
    expect(fs.combat.offstage.has(merlin.id)).toBe(true)
    playLocally(fs)
    expect(fs.combat.state).toBe("ended")
    const report = reportOf(s, fs.combat)
    expect(report.fighters).toHaveLength(4)
    expect(report.arrived).toEqual([merlin.id])
    expect(fs.combat.offstage.has(merlin.id)).toBe(false)
  })

  test("a fighter switching sides is played by the other team", () => {
    const s = spec([{ switchTo: { team: 0, tick: 1 } }])
    const fs = scene(s)
    playLocally(fs)
    expect(fs.combat.state).toBe("ended")
    const merlin = fs.combat.fighters.find((f) => f.presetId === "merlin")!
    expect(merlin.team).toBe(0)
    expect(reportOf(s, fs.combat).switched).toEqual([
      { fighterId: merlin.id, to: 0 },
    ])
  })
})

import { beforeEach, describe, expect, test } from "bun:test"
import { type FightSpec, objectiveOutcome } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { playLocally } from "../test/play"
import FightScene from "./FightScene"

const everywhere = Array.from({ length: 9 }, (_, x) =>
  Array.from({ length: 5 }, (_, y) => ({ x, y })),
).flat()

const spec: FightSpec = {
  id: "t.trace",
  title: "Trace",
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
      name: "Eux",
      side: "enemies",
      fighters: [{ preset: "squalor", at: { x: 7, y: 2 } }],
    },
  ],
  rules: {
    clock: { period: 10, limit: 60, winner: 0 },
    regions: { tout: everywhere, coin: [{ x: 8, y: 4 }] },
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

describe("the fight report carries the trace", () => {
  test("final blows, strikes and regions are read from the combat", () => {
    const fs = mount(
      new FightScene(
        fightOptions(spec, 5, 1, { items: [], unlocks: [] }, () => []),
      ),
    )
    playLocally(fs)
    expect(fs.combat.state).toBe("ended")
    const report = reportOf(spec, fs.combat)
    const trace = report.trace
    expect(trace).toBeDefined()
    const fallen = report.fighters.filter((f) => f.hp === 0)
    expect(fallen.length).toBeGreaterThan(0)
    for (const f of fallen) {
      const b = trace?.finalBlows[f.id]
      expect(b?.byTeam).not.toBe(f.team)
    }
    const loserTeam = fallen[0].team
    const winnerTeam = 1 - loserTeam
    const r = (c: Parameters<typeof objectiveOutcome>[0]["when"]) =>
      objectiveOutcome({ id: "x", mark: "◆", label: "", when: c }, report, spec)
    expect(
      r({ finalBlowBy: { by: { team: winnerTeam }, target: fallen[0].id } }),
    ).toBe(true)
    expect(
      r({ finalBlowBy: { by: { team: loserTeam }, target: fallen[0].id } }),
    ).toBe(false)
    expect(r({ struckOn: { region: "tout" } })).toBe(true)
    expect(r({ held: { region: "tout", who: { team: 0 }, ticks: 1 } })).toBe(
      report.ticks >= 1 && fs.combat.aliveFighters.some((f) => f.team === 0),
    )
    expect(r({ visited: { region: "tout", who: "brutus" } })).toBe(true)
    expect(r({ nothingOn: { region: "tout", of: "stand" } })).toBe(false)
  })
})

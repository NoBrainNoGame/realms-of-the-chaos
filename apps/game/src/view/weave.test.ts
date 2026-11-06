import { beforeEach, describe, expect, test } from "bun:test"
import type { FightSpec } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { playLocally } from "../test/play"
import FightScene from "./FightScene"

const spec: FightSpec = {
  id: "t.weave",
  title: "Trame",
  board: [".........", ".........", ".........", ".........", "........."],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "brutus", at: { x: 2, y: 2 } },
        { preset: "lyra", at: { x: 2, y: 3 } },
      ],
    },
    {
      name: "Eux",
      side: "enemies",
      fighters: [
        { preset: "squalor", at: { x: 5, y: 1 } },
        { preset: "squalor", at: { x: 5, y: 3 } },
      ],
    },
  ],
  rules: {
    clock: { period: 10, limit: 80, winner: 0 },
    lacunes: { cells: [{ x: 8, y: 4 }], every: 2, spread: 1 },
    superposition: {
      cells: [
        { x: 3, y: 2 },
        { x: 4, y: 3 },
        { x: 4, y: 1 },
      ],
      decohereAt: 5,
    },
    doubles: [{ team: 1, pair: [0, 1] }],
    fraying: { cells: [{ x: 0, y: 0 }], every: 3 },
    halos: [{ team: 1, index: 0, radius: 1, from: 2 }],
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

describe("lacunes, superposition, doubles and fraying in the Adventure scene", () => {
  test("the fight plays to the end and the report tells what the Tissu did", () => {
    const fs = mount(
      new FightScene(
        fightOptions(spec, 5, 1, { items: [], unlocks: [] }, () => []),
      ),
    )
    playLocally(fs)
    expect(fs.combat.state).toBe("ended")
    const report = reportOf(spec, fs.combat)
    expect(report.lacune?.grown).toBeGreaterThan(0)
    expect(report.lacune?.cells).toBe(fs.combat.board.voids.size)
    expect(report.measured?.length).toBe(3)
    expect(report.frayed).toBeGreaterThan(0)
    // the double settles as soon as one position is struck, or never
    expect((report.doubles ?? []).length).toBeLessThanOrEqual(1)
  })
})

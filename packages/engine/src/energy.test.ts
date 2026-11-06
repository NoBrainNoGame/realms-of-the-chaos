import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

function fight(rules: AdventureRules) {
  return new Combat({
    seed: 1,
    board: Board.fromAscii(["........", "........", "........"]),
    teams: [
      { name: "a", controller: "ai", fighters: ["lyra"] },
      { name: "b", controller: "ai", fighters: ["merlin"] },
    ],
    positions: [[{ x: 0, y: 1 }], [{ x: 7, y: 1 }]],
    adventure: rules,
  })
}

describe("the Élan of a kept Fragment", () => {
  test("a cadence feeds the Élan every few ticks and nothing between", () => {
    const c = fight({
      clock: { period: 10, limit: 6, winner: 0 },
      noDefeat: [0, 1],
      energy: { cadence: { team: 0, every: 3, amount: 2 } },
    })
    c.teams[0].energy = 0
    const seen: number[] = []
    for (const e of c.run()) {
      if (e.type === "clockTick") seen.push(c.teams[0].energy)
    }
    // the energy flow of time is off: only the cadence gives
    expect(c.teams[0].energy).toBeLessThanOrEqual(4)
    expect(seen.length).toBe(6)
  })

  test("stopAt empties the Élan for good and greys the Influences", () => {
    const c = fight({
      clock: { period: 10, limit: 6, winner: 0 },
      noDefeat: [0, 1],
      energy: { stopAt: { team: 0, tick: 2 } },
    })
    c.teams[0].energy = 5
    c.run()
    expect(c.teams[0].energy).toBe(0)
    c.grantEnergy(0, 3)
    expect(c.teams[0].energy).toBe(0)
  })

  test("idle cells fray into Lacunes, the ones walked on stay", () => {
    const c = fight({
      clock: { period: 10, limit: 8, winner: 0 },
      noDefeat: [0, 1],
      idleFray: { from: 3, idle: 3 },
    })
    c.run()
    const voids = c.board.voids
    expect(voids.size).toBeGreaterThan(0)
    expect(c.adventure?.report.lacune.grown).toBe(voids.size)
    for (const f of c.fighters)
      expect(voids.has(`${f.position.x},${f.position.y}`)).toBe(false)
  })
})

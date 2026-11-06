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

describe("Front de Marée and reach", () => {
  test("the front turns a column uncertain every two ticks", () => {
    const c = fight({
      clock: { period: 10, limit: 6, winner: 0 },
      noDefeat: [0, 1],
      tide: { axis: "x", from: 7, dir: -1, every: 2, start: 2 },
    })
    c.run()
    // ticks 2, 4 and 6 covered columns 7, 6 and 5 (some may have settled)
    const settled = c.adventure?.report.measured.map((m) => m.cell.x) ?? []
    const uncertain = c.adventure?.uncertainCells.map((p) => p.x) ?? []
    const seen = new Set([...settled, ...uncertain])
    for (const x of [7, 6, 5]) expect(seen.has(x)).toBe(true)
    expect(seen.has(4)).toBe(false)
  })

  test("standing on the reach cells ends the fight in favour of the team", () => {
    const c = fight({
      clock: { period: 1, limit: 30, winner: 1 },
      reach: { team: 0, cells: [{ x: 0, y: 1 }] },
    })
    c.run()
    expect(c.winnerTeam).toBe(0)
  })
})

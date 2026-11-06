import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

const ground = () =>
  Board.fromAscii(["........", "........", "........", "........", "........"])

function fight(rules: AdventureRules, seed = 2) {
  return new Combat({
    seed,
    board: ground(),
    teams: [
      { name: "a", controller: "ai", fighters: ["lyra", "brutus"] },
      { name: "b", controller: "ai", fighters: ["merlin"] },
    ],
    positions: [
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      [{ x: 6, y: 2 }],
    ],
    adventure: rules,
  })
}

describe("adventure trace", () => {
  test("every fallen fighter has a final blow with its killer and cell", () => {
    const c = fight({ clock: { period: 10, limit: 60 } })
    c.run()
    const trace = c.adventure?.report.trace
    const fallen = c.fighters.filter((f) => !f.alive)
    expect(fallen.length).toBeGreaterThan(0)
    for (const f of fallen) {
      const b = trace?.finalBlows[f.id]
      expect(b).toBeDefined()
      expect(b?.by).not.toBeNull()
      expect(b?.byTeam).not.toBe(f.team)
      expect(b?.at).toEqual(f.position)
    }
    // the sum of the blows that landed equals the damage the strikes record
    expect(trace?.strikes.length).toBeGreaterThan(0)
    expect(trace?.strikes.every((s) => s.amount > 0)).toBe(true)
  })

  test("a region is held per clock tick, with its longest streak", () => {
    const c = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      regions: {
        everywhere: Array.from({ length: 8 }, (_, x) =>
          Array.from({ length: 5 }, (_, y) => ({ x, y })),
        ).flat(),
        nowhere: [{ x: 7, y: 4 }],
      },
    })
    c.run()
    const reg = c.adventure?.report.trace.regions
    expect(reg?.everywhere.teams[0]).toBe(6)
    expect(reg?.everywhere.teams[1]).toBe(6)
    expect(reg?.everywhere.streak[0]).toBe(6)
    expect(reg?.everywhere.visitors.length).toBe(3)
    expect(reg?.nowhere.teams[0] ?? 0).toBeLessThan(6)
  })

  test("same fight without regions or adventure rules is unchanged", () => {
    const a = fight({ clock: { period: 10, limit: 60 } })
    const b = fight({
      clock: { period: 10, limit: 60 },
      regions: { r: [{ x: 0, y: 0 }] },
    })
    a.run()
    b.run()
    expect(b.winnerTeam).toBe(a.winnerTeam)
    expect(b.time).toBe(a.time)
  })
})

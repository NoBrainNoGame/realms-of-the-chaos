import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

const ground = () =>
  Board.fromAscii(["........", "........", "........", "........", "........"])

function fight(rules: AdventureRules | undefined, seed = 1) {
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

describe("adventure rules are opt-in", () => {
  test("a fight without them has no adventure state", () => {
    const c = fight(undefined)
    expect(c.adventure).toBeNull()
    c.run()
    expect(c.state).toBe("ended")
  })

  test("the clock ticks and ends the fight when time is up", () => {
    const c = fight({
      clock: { period: 10, limit: 3, winner: 0 },
      noDefeat: [0, 1],
    })
    const events = c.run()
    expect(events.filter((e) => e.type === "clockTick")).toHaveLength(3)
    expect(events.some((e) => e.type === "timeUp")).toBe(true)
    expect(c.winnerTeam).toBe(0)
    expect(c.adventure?.report.timeUp).toBe(true)
  })

  test("noDefeat keeps the team at 1 HP", () => {
    const c = fight({ noDefeat: [1], clock: { period: 10, limit: 40 } })
    c.run()
    expect(c.getFighter("merlin-1-0")?.alive ?? true).toBe(true)
  })

  test("an idle zone turns silent, then is lost", () => {
    const c = new Combat({
      seed: 3,
      board: ground(),
      teams: [
        { controller: "local", fighters: ["lyra"] },
        { controller: "ai", fighters: ["merlin"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 7, y: 4 }]],
      adventure: {
        clock: { period: 5, limit: 4 },
        zones: [{ id: "z", cells: [{ x: 4, y: 2 }] }],
      },
    })
    c.holding.add(1)
    const states: string[] = []
    for (let i = 0; i < 200 && c.state !== "ended"; i++) {
      for (const e of c.advance()) {
        if (e.type === "zoneChanged") states.push(e.state)
      }
      if (c.state === "awaitingInput") c.pass()
    }
    expect(states).toEqual(["silent", "lost"])
    expect(c.adventure?.report.zonesLost).toEqual(["z"])
  })

  test("a locked Influence is refused until unlocked", () => {
    const c = fight({ lockedDivine: ["blessing"] })
    expect(c.adventure?.locked.has("blessing")).toBe(true)
    c.unlockDivine("blessing")
    expect(c.adventure?.locked.has("blessing")).toBe(false)
  })

  test("a wounded fleer leaves the island and is spared", () => {
    const c = fight({
      flee: { team: 1, below: 0.95, exits: [{ x: 7, y: 0 }] },
    })
    const events = c.run()
    expect(events.some((e) => e.type === "fled")).toBe(true)
    expect(c.adventure?.report.fled).toContain("merlin-1-0")
    expect(c.winnerTeam).toBe(0)
  })
})

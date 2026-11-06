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
        { controller: "human", fighters: ["lyra"] },
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

  test("an arrival is offstage until its tick, then enters and fights", () => {
    const c = fight({
      clock: { period: 10, limit: 30, winner: 0 },
      noDefeat: [0, 1],
      arrivals: [{ team: 1, index: 0, tick: 2 }],
    })
    expect(c.offstage.has("merlin-1-0")).toBe(true)
    // a team still to come is not beaten
    expect(c.aliveFighters.some((f) => f.team === 1)).toBe(false)
    const events = c.run()
    const at = events.findIndex((e) => e.type === "arrived")
    expect(at).toBeGreaterThan(-1)
    const tick2 = events.findIndex(
      (e) => e.type === "clockTick" && e.tick === 2,
    )
    expect(tick2).toBeLessThan(at)
    expect(c.offstage.has("merlin-1-0")).toBe(false)
    expect(c.adventure?.report.arrived).toEqual(["merlin-1-0"])
  })

  test("an arrival by time takes the closest free cell when its own is taken", () => {
    const c = new Combat({
      seed: 2,
      board: ground(),
      teams: [
        { controller: "ai", fighters: ["lyra", "brutus"] },
        { controller: "ai", fighters: ["merlin", "squalor"] },
      ],
      positions: [
        [
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ],
        [
          { x: 6, y: 2 },
          { x: 1, y: 1 },
        ],
      ],
      adventure: { arrivals: [{ team: 1, index: 1, time: 5 }] },
    })
    const ev = c.run()
    const arrived = ev.find((e) => e.type === "arrived")
    expect(arrived).toBeDefined()
    if (arrived?.type === "arrived") {
      expect(arrived.position).not.toEqual({ x: 1, y: 1 })
    }
  })

  test("the pending wave keeps its team in the fight", () => {
    const c = fight({
      clock: { period: 40, limit: 6, winner: 0 },
      arrivals: [{ team: 1, index: 0, tick: 5 }],
    })
    c.run()
    expect(c.adventure?.report.timeUp).toBe(true)
  })

  test("a switch changes team and controller, and is reported", () => {
    const c = new Combat({
      seed: 4,
      board: ground(),
      teams: [
        { controller: "human", fighters: ["lyra"] },
        { controller: "ai", fighters: ["merlin", "brutus"] },
      ],
      positions: [
        [{ x: 0, y: 0 }],
        [
          { x: 7, y: 4 },
          { x: 7, y: 0 },
        ],
      ],
      adventure: {
        clock: { period: 10, limit: 2, winner: 0 },
        switches: [{ team: 1, index: 1, toTeam: 0, tick: 1 }],
      },
    })
    expect(c.getFighter("brutus-1-1")?.team).toBe(1)
    const events: ReturnType<typeof c.advance> = []
    for (let i = 0; i < 400 && c.state !== "ended"; i++) {
      if (c.state === "awaitingInput")
        c.execute({ type: "pass", fighterId: c.activeFighter!.id })
      else events.push(...c.advance())
    }
    const sw = events.find((e) => e.type === "switched")
    expect(sw).toEqual({
      type: "switched",
      fighterId: "brutus-1-1",
      from: 1,
      to: 0,
    })
    const f = c.getFighter("brutus-1-1")
    expect(f?.team).toBe(0)
    expect(f?.controller).toBe("human")
    expect(c.adventure?.report.switched).toEqual([
      { fighterId: "brutus-1-1", to: 0 },
    ])
  })
})

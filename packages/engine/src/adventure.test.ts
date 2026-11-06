import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

const ground = () =>
  Board.fromAscii(["........", "........", "........", "........", "........"])

function fight(rules: AdventureRules | undefined, seed = 1, hold?: number[]) {
  const c = new Combat({
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
  for (const t of hold ?? []) c.holding.add(t)
  return c
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

  test("a lost zone turns its holes into Clair, except under a fighter", () => {
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
        zones: [
          {
            id: "z",
            cells: [{ x: 4, y: 2 }],
            onLost: {
              holes: [
                { x: 7, y: 3 },
                { x: 7, y: 4 },
              ],
            },
          },
        ],
      },
    })
    c.holding.add(1)
    for (let i = 0; i < 200 && c.state !== "ended"; i++) {
      c.advance()
      if (c.state === "awaitingInput") c.pass()
    }
    expect(c.board.voids.has("7,3")).toBe(true)
    expect(c.board.voids.has("7,4")).toBe(false)
  })

  test("an Influence unlocks when the named fighter reaches the region", () => {
    const c = fight({
      lockedDivine: ["blessing"],
      regions: { seam: [{ x: 2, y: 2 }] },
      unlockOnReach: [
        { divineId: "blessing", region: "seam", team: 0, preset: "lyra" },
      ],
    })
    const lyra = c.getFighter("lyra-0-0")!
    const brutus = c.getFighter("brutus-0-1")!
    const to = { x: 2, y: 2 }
    const from = { x: 1, y: 1 }
    c.emitEvent({ type: "moved", fighterId: brutus.id, from, to })
    expect(c.adventure?.locked.has("blessing")).toBe(true)
    c.emitEvent({ type: "moved", fighterId: lyra.id, from, to })
    expect(c.adventure?.locked.has("blessing")).toBe(false)
  })

  test("pushing fighters wear a zone down faster", () => {
    const zoneAfterOneTick = (zonePush?: AdventureRules["zonePush"]) => {
      const c = new Combat({
        seed: 3,
        board: ground(),
        teams: [
          { controller: "human", fighters: ["lyra"] },
          { controller: "ai", fighters: ["merlin"] },
        ],
        positions: [[{ x: 0, y: 0 }], [{ x: 7, y: 4 }]],
        adventure: {
          clock: { period: 30, limit: 1 },
          zones: [
            {
              id: "z",
              cells: Array.from({ length: 40 }, (_, i) => ({
                x: i % 8,
                y: Math.floor(i / 8),
              })),
            },
          ],
          zonePush,
        },
      })
      for (let i = 0; i < 200 && c.state !== "ended"; i++) {
        c.advance()
        if (c.state === "awaitingInput") c.pass()
      }
      return c.adventure?.zoneState("z")
    }
    expect(zoneAfterOneTick()).toBe("silent")
    expect(zoneAfterOneTick({ team: 1, step: 2 })).toBe("lost")
    expect(zoneAfterOneTick({ team: 1, indexes: [3], step: 2 })).toBe("silent")
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

  test("a fleer only strikes when an adversary blocks its way", () => {
    const strikes = (attackIfBlocked: boolean) => {
      const c = new Combat({
        seed: 2,
        board: Board.fromAscii(["########", "........", "########"]),
        teams: [
          { name: "a", controller: "ai", fighters: ["brutus"] },
          { name: "b", controller: "ai", fighters: ["merlin"] },
        ],
        positions: [[{ x: 3, y: 1 }], [{ x: 4, y: 1 }]],
        adventure: {
          flee: {
            team: 1,
            below: 0.99,
            exits: [{ x: 0, y: 1 }],
            attackIfBlocked,
          },
          clock: { period: 10, limit: 3, winner: 0 },
          noDefeat: [0, 1],
        },
      })
      const m = c.getFighter("merlin-1-0")!
      m.hp = Math.max(1, m.hp - 1)
      c.adventure?.wounded(m)
      const events = c.run()
      return events.filter(
        (e) => e.type === "actionUsed" && e.fighterId === m.id,
      ).length
    }
    expect(strikes(false)).toBe(0)
    expect(strikes(true)).toBeGreaterThan(0)
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

  test("an exit lets a team leave one by one and win when the chosen ones are out", () => {
    const c = fight({
      noDefeat: [0, 1],
      clock: { period: 10, limit: 30, winner: 1 },
      exit: { team: 0, cells: [{ x: 1, y: 4 }], who: [0] },
      scripts: [
        {
          team: 0,
          index: 0,
          steps: [{ act: { do: "move", to: { x: 1, y: 4 } } }],
        },
      ],
    })
    c.run()
    expect(c.departed.has("lyra-0-0")).toBe(true)
    expect(c.departed.has("brutus-0-1")).toBe(false)
    expect(c.adventure?.report.fled).toContain("lyra-0-0")
    expect(c.winnerTeam).toBe(0)
  })

  test("a spared fighter stops at 1 HP and a solitary one never shares a cell", () => {
    const c = fight({
      spared: [{ team: 1, index: 0 }],
      solitary: [{ team: 0, index: 0 }],
      clock: { period: 10, limit: 40 },
    })
    c.run()
    expect(c.getFighter("merlin-1-0")!.hp).toBeGreaterThan(0)
    const lyra = c.getFighter("lyra-0-0")!
    expect(c.canEnter(c.getFighter("brutus-0-1")!, lyra.position)).toBe(false)
  })

  test("a fighter left alone gives up and is reported surrendered", () => {
    const c = fight({
      noDefeat: [0],
      clock: { period: 10, limit: 40 },
      flee: {
        team: 0,
        below: 0.1,
        exits: [{ x: 0, y: 0 }],
        own: [{ index: 0, below: 2 }],
        alone: [{ index: 1, with: [0] }],
      },
    })
    c.run()
    expect(c.departed.has("lyra-0-0")).toBe(true)
    expect(c.adventure?.report.surrendered).toContain("brutus-0-1")
  })

  test("an immune fighter takes no damage", () => {
    const c = fight({ immune: [{ team: 1, index: 0 }], noDefeat: [0] })
    const m = c.getFighter("merlin-1-0")!
    const hp = m.hp
    c.run()
    expect(m.hp).toBe(hp)
  })
})

describe("holding a spot and giving of oneself", () => {
  test("reach with ticks needs the member to stay on the cells", () => {
    const stay = fight(
      {
        clock: { period: 10, limit: 30, winner: null },
        reach: { team: 0, index: 1, cells: [{ x: 1, y: 2 }], ticks: 2 },
        noDefeat: [0, 1],
      },
      1,
      [0],
    )
    stay.run()
    expect(stay.winnerTeam).toBe(0)
    const wrong = fight({
      clock: { period: 10, limit: 3, winner: null },
      reach: { team: 0, index: 0, cells: [{ x: 1, y: 2 }], ticks: 2 },
      noDefeat: [0, 1],
    })
    wrong.run()
    expect(wrong.winnerTeam).toBeNull()
  })

  test("a sacrifice cell costs a share of the maximum hit points", () => {
    const c = fight({
      clock: { period: 10, limit: 30, winner: 0 },
      sacrifice: { team: 0, index: 1, cells: [{ x: 1, y: 2 }], pct: 0.1 },
      noDefeat: [0, 1],
    })
    c.run()
    const rep = c.adventure?.report
    expect(rep?.lowest["brutus-0-1"] ?? 1).toBeLessThan(1)
  })
})

describe("the tide and the ice", () => {
  test("a scripted tide carries a walker off the deepened cell", () => {
    const c = fight({
      clock: { period: 10, limit: 3, winner: 0 },
      scripted: [
        {
          tick: 1,
          kind: "reshape",
          cells: [{ x: 1, y: 1, level: -2 }],
          carry: 4,
        },
      ],
      noDefeat: [0, 1],
    })
    const cell = c.board.get({ x: 1, y: 1 })!
    cell.terrain = "water"
    cell.elevation = -1
    c.holding.add(0)
    c.holding.add(1)
    c.run()
    const lyra = c.fighters.find((f) => f.team === 0)!
    expect(lyra.position.x === 1 && lyra.position.y === 1).toBe(false)
  })

  test("a scripted ice event is accepted on land without effect", () => {
    const c = fight({
      clock: { period: 10, limit: 3, winner: 0 },
      scripted: [{ tick: 1, kind: "ice", cells: [{ x: 3, y: 3 }], lasts: 1 }],
    })
    c.run()
    expect(c.state).toBe("ended")
  })

  test("a fighter under its threshold sinks out of the fight", () => {
    const c = fight({
      sinks: [{ team: 1, index: 0, below: 2 }],
      noDefeat: [0],
      clock: { period: 10, limit: 40 },
    })
    c.run()
    expect(c.departed.has("merlin-1-0")).toBe(true)
    expect(c.adventure?.report.sunk).toContain("merlin-1-0")
  })

  test("a peaceful fighter never strikes the teams it spares", () => {
    const c = fight({
      peaceful: [{ team: 1, index: 0, toward: [0] }],
      noDefeat: [0],
      clock: { period: 10, limit: 20 },
    })
    c.run()
    const lyra = c.getFighter("lyra-0-0")!
    expect(lyra.hp).toBe(c.maxHp(lyra))
  })
})

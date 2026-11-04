import { describe, expect, test } from "bun:test"
import { decide, decideDivine, scoreAction, usefulActions } from "./ai"
import { Board } from "./board"
import { Combat } from "./combat"
import { ACTIONS } from "./content"
import type { Point } from "./geometry"
import type { FightEvent } from "./types"

function setup(teams: [string, Point][][], board = new Board(9, 9)) {
  return new Combat({
    seed: 1,
    board,
    teams: teams.map((team) => ({
      controller: "ai",
      fighters: team.map(([id]) => id),
    })),
    positions: teams.map((team) => team.map(([, p]) => p)),
  })
}

describe("AI", () => {
  test("attacks when an enemy is in range", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva] = combat.fighters
    const [command] = decide(combat, eva)
    expect(command.type).toBe("action")
  })

  test("prefers the killing blow", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [
        ["gorr", { x: 4, y: 0 }],
        ["merlin", { x: 0, y: 4 }],
      ],
    ])
    const [eva, , merlin] = combat.fighters
    merlin.hp = 2
    const [command] = decide(combat, eva)
    expect(command).toMatchObject({ type: "action", target: merlin.position })
  })

  test("avoids friendly fire with area attacks", () => {
    const combat = setup([
      [
        ["merlin", { x: 0, y: 0 }],
        ["brutus", { x: 4, y: 0 }],
        ["eva", { x: 3, y: 1 }],
      ],
      [["gorr", { x: 3, y: 0 }]],
    ])
    const [merlin, , , gorr] = combat.fighters
    const score = scoreAction(combat, merlin, ACTIONS.fireball, gorr.position)
    expect(score).toBeLessThan(0)
    const commands = decide(combat, merlin)
    expect(commands[0]).not.toMatchObject({
      actionId: "fireball",
      target: gorr.position,
    })
  })

  test("heals a hurt ally rather than hitting", () => {
    const combat = setup([
      [
        ["lyra", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
      ],
      [["gorr", { x: 0, y: 1 }]],
    ])
    const [lyra, brutus] = combat.fighters
    brutus.hp = 30
    const [command] = decide(combat, lyra)
    expect(command).toMatchObject({ type: "action", actionId: "heal" })
  })

  test("walks towards enemies when nothing is in range, then passes", () => {
    const board = Board.fromAscii([".........", ".#######.", "........."])
    const combat = setup(
      [[["brutus", { x: 0, y: 0 }]], [["eva", { x: 8, y: 2 }]]],
      board,
    )
    const [brutus] = combat.fighters
    const commands = decide(combat, brutus)
    expect(commands.map((c) => c.type)).toEqual(["move", "pass"])
  })

  test("does not shield an ally at full health", () => {
    const combat = setup([
      [
        ["lyra", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [lyra] = combat.fighters
    const commands = decide(combat, lyra)
    expect(commands.some((c) => c.type === "action")).toBe(false)
  })

  test("blesses the team when it is hurt, not when healthy", () => {
    const combat = setup([
      [
        ["lyra", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [lyra, brutus] = combat.fighters
    combat.teams[0].energy = 5
    expect(decideDivine(combat, lyra)).toBeNull()
    lyra.hp -= 20
    brutus.hp -= 20
    expect(decideDivine(combat, lyra)).toEqual({
      divineId: "blessing",
      target: null,
    })
  })

  test("spends a full gauge to delay the next enemy", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [
        ["gorr", { x: 8, y: 8 }],
        ["nyx", { x: 8, y: 0 }],
      ],
    ])
    const [eva, gorr, nyx] = combat.fighters
    gorr.nextActionAt = 50
    nyx.nextActionAt = 10
    combat.teams[0].energy = 6
    expect(decideDivine(combat, eva)).toEqual({
      divineId: "timeWarp",
      target: nyx.position,
    })
  })

  test("ranged fighters keep their distance", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    const commands = decide(combat, eva)
    const move = commands.find((c) => c.type === "move")
    expect(move).toBeDefined()
    if (move?.type !== "move") return
    const distance =
      Math.abs(move.destination.x - gorr.position.x) +
      Math.abs(move.destination.y - gorr.position.y)
    expect(distance).toBeGreaterThanOrEqual(2)
  })
})

describe("useful actions (HUD suggestions)", () => {
  test("only the actions with a worthwhile target, never a movement", () => {
    const far = setup([[["eva", { x: 0, y: 0 }]], [["gorr", { x: 8, y: 8 }]]])
    expect(usefulActions(far, far.fighters[0])).toEqual([])
    const near = setup([[["eva", { x: 0, y: 0 }]], [["gorr", { x: 1, y: 0 }]]])
    const [eva] = near.fighters
    const useful = usefulActions(near, eva)
    expect(useful.length).toBeGreaterThan(0)
    for (const id of useful) {
      const action = near.actionsOf(eva).find((a) => a.id === id)!
      expect(action.movement).toBeUndefined()
      expect(near.isOnCooldown(eva, action)).toBe(false)
    }
  })
})

describe("teams on hold", () => {
  test("only pass until released", () => {
    const c = new Combat({
      seed: 3,
      board: new Board(9, 9),
      teams: [
        { controller: "ai", fighters: ["eva"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 1, y: 0 }]],
    })
    c.holding.add(1)
    const events = c.run(2000)
    const gorr = c.fighters[1]
    const acted = (e: FightEvent) =>
      (e.type === "actionUsed" || e.type === "moved") &&
      e.fighterId === gorr.id
    expect(events.filter(acted)).toHaveLength(0)
    expect(
      events.some((e) => e.type === "turnPassed" && e.fighterId === gorr.id),
    ).toBe(true)
    c.holding.delete(1)
    if (c.state !== "ended") expect(c.run(2000).some(acted)).toBe(true)
  })
})

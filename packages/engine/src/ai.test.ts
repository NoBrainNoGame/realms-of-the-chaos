import { describe, expect, test } from "bun:test"
import { decide, decideDivine, scoreAction } from "./ai"
import { Board } from "./board"
import { Combat } from "./combat"
import { ACTIONS } from "./content"
import type { Point } from "./geometry"

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

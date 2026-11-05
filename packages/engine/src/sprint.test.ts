import { describe, expect, test } from "bun:test"
import { Board } from "./board"
import { Combat } from "./combat"
import { ACTIONS, CHARACTERS, COMMON_ACTIONS } from "./content"
import { keyOf, manhattan, type Point } from "./geometry"

function duel(board: Board, eva: Point, gorr: Point, extra: Point[] = []) {
  const combat = new Combat({
    seed: 1,
    board,
    teams: [
      { controller: "human", fighters: ["eva", ...extra.map(() => "brutus")] },
      { controller: "human", fighters: ["gorr"] },
    ],
    positions: [[eva, ...extra], [gorr]],
  })
  // Eva plays first
  combat.fighters[0].nextActionAt = 0
  for (const f of combat.fighters.slice(1)) f.nextActionAt = 500
  combat.run()
  return combat
}

describe("sprint (Course)", () => {
  test("every fighter has it, after its own actions", () => {
    expect(COMMON_ACTIONS).toEqual(["sprint"])
    const combat = duel(new Board(9, 9), { x: 0, y: 0 }, { x: 8, y: 8 })
    for (const f of combat.fighters) {
      const ids = f.actions.map((a) => a.id)
      expect(ids.at(-1)).toBe("sprint")
      expect(ids.slice(0, -1)).toEqual(CHARACTERS[f.presetId].actions)
    }
  })

  test("targets: up to 3 steps, through allies, never through enemies", () => {
    const combat = duel(new Board(9, 9), { x: 4, y: 4 }, { x: 5, y: 4 }, [
      { x: 3, y: 4 },
    ])
    const eva = combat.activeFighter!
    const sprint = ACTIONS.sprint
    const cells = combat.getValidTargets(eva, sprint)
    expect(cells.length).toBeGreaterThan(0)
    for (const c of cells)
      expect(manhattan(c, eva.position)).toBeLessThanOrEqual(3)
    const keys = new Set(cells.map(keyOf))
    expect(keys.has("3,4")).toBe(true) // the ally's cell (combos)
    expect(keys.has("2,4")).toBe(true) // through the ally
    expect(keys.has("5,4")).toBe(false) // the enemy's cell
    expect(keys.has("6,4")).toBe(false) // only reachable through the enemy... in 2 steps
    expect(keys.has("4,4")).toBe(false) // not the starting cell
    expect(keys.has("4,0")).toBe(false) // 4 steps away
  })

  test("walkers cannot sprint into deep water; swimmers can", () => {
    const board = Board.fromAscii([".W.", "...", "..."])
    const walker = new Combat({
      seed: 1,
      board,
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "human", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 2, y: 2 }]],
    })
    walker.fighters[1].nextActionAt = 500
    walker.run()
    const brutus = walker.activeFighter!
    expect(brutus.presetId).toBe("brutus")
    const keys = walker.getValidTargets(brutus, ACTIONS.sprint).map(keyOf)
    expect(keys).not.toContain("1,0")
  })

  test("moves at once, step by step, costs the walk's time and ends the turn", () => {
    const combat = duel(new Board(9, 9), { x: 0, y: 0 }, { x: 8, y: 8 })
    const eva = combat.activeFighter!
    combat.moveTo({ x: 8, y: 0 }) // a planned walk is replaced
    const time = combat.time
    const expected = combat.movementTime(eva, [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ])
    const result = combat.useAction("sprint", { x: 3, y: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const moves = result.events.filter((e) => e.type === "moved")
    expect(moves).toHaveLength(3)
    expect(result.events[0]).toMatchObject({
      type: "actionUsed",
      actionId: "sprint",
    })
    expect(eva.position).toEqual({ x: 3, y: 0 })
    expect(eva.path).toEqual([])
    expect(eva.waypoints).toEqual([])
    expect(eva.nextActionAt).toBeCloseTo(time + expected)
    expect(expected).toBeCloseTo(
      3 * combat.stepDelay(eva, { x: 0, y: 0 }, { x: 1, y: 0 }),
    )
    expect(combat.activeFighter).not.toBe(eva)
  })

  test("out of reach is refused; sprints are logged and replayed", () => {
    const opts = {
      seed: 4,
      board: new Board(9, 9),
      teams: [
        { controller: "human" as const, fighters: ["eva"] },
        { controller: "human" as const, fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    }
    const combat = new Combat(opts)
    combat.run()
    const me = combat.activeFighter!
    const far = me.team === 0 ? { x: 4, y: 0 } : { x: 8, y: 4 }
    expect(combat.useAction("sprint", far).ok).toBe(false)
    const near = me.team === 0 ? { x: 2, y: 0 } : { x: 8, y: 6 }
    expect(combat.useAction("sprint", near).ok).toBe(true)
    combat.run()
    const replay = Combat.replay(opts, combat.log)
    expect(replay.getFighter(me.id)!.position).toEqual(near)
  })

  test("the AI never sprints (balance unchanged)", () => {
    const combat = new Combat({
      seed: 2,
      teams: [
        { controller: "ai", fighters: ["eva", "brutus", "nyx"] },
        { controller: "ai", fighters: ["gorr", "lyra", "squalor"] },
      ],
    })
    const used = combat
      .run(100_000)
      .filter((e) => e.type === "actionUsed" && e.actionId === "sprint")
    expect(used).toHaveLength(0)
  })
})

describe("movement previews", () => {
  test("a duration in turns and in actions of the fighter", () => {
    const combat = duel(new Board(9, 9), { x: 0, y: 0 }, { x: 8, y: 8 })
    const eva = combat.activeFighter!
    const turn = combat.baseDelay(eva)
    expect(combat.turnsFor(eva, 1)).toBe(1)
    expect(combat.turnsFor(eva, turn)).toBe(1)
    expect(combat.turnsFor(eva, turn * 1.2)).toBe(2)
    expect(combat.turnsFor(eva, turn * 3)).toBe(3)
    expect(combat.actionsFor(eva, turn / 2)).toBeCloseTo(0.5)
    // a long walk takes several turns
    const path = combat.board.findPath(
      eva.position,
      { x: 8, y: 0 },
      () => true,
    )!
    const time = combat.movementTime(eva, path)
    expect(combat.turnsFor(eva, time)).toBeGreaterThan(1)
  })
})

describe("turn delay previews", () => {
  test("the delay of an action, a sprint or a pass matches what happens", () => {
    for (const choice of ["strike", "sprint", "pass"] as const) {
      const combat = duel(new Board(9, 9), { x: 0, y: 0 }, { x: 8, y: 8 })
      const me = combat.activeFighter!
      const action = combat.actionsOf(me).find((a) => !a.movement)!
      let expected: number | null
      if (choice === "pass") {
        expected = combat.turnDelayOf(me, { type: "pass" })
        combat.pass()
      } else if (choice === "sprint") {
        const target = { x: 2, y: 1 }
        expected = combat.turnDelayOf(me, {
          type: "action",
          actionId: "sprint",
          target,
        })
        // no target: the longest sprint, at least this one
        expect(
          combat.turnDelayOf(me, { type: "action", actionId: "sprint" })!,
        ).toBeGreaterThanOrEqual(expected!)
        expect(combat.useAction("sprint", target).ok).toBe(true)
      } else {
        expected = combat.turnDelayOf(me, {
          type: "action",
          actionId: action.id,
        })
        const target = combat.getValidTargets(me, action)[0]
        if (!target) continue
        expect(combat.useAction(action.id, target).ok).toBe(true)
      }
      const now = combat.time
      expect(me.nextActionAt - now).toBeCloseTo(expected!)
    }
  })
})

describe("step times", () => {
  test("each step of a planned walk comes when the previous one is paid", () => {
    const c = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: ["eva"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    })
    const eva = c.fighters[0]
    eva.path = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]
    eva.nextMoveAt = 3
    const times = c.stepTimes(eva)
    expect(times[0]).toBe(3)
    expect(times[1]).toBeCloseTo(
      3 + c.stepDelay(eva, { x: 0, y: 0 }, { x: 1, y: 0 }),
    )
  })
})

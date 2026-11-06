import { describe, expect, test } from "bun:test"
import { Board, MIN_STEP_COST } from "./board"
import {
  COLLISION_DAMAGE,
  Combat,
  FALL_DAMAGE,
  STEP_DELAY_RATIO,
} from "./combat"
import { ACTIONS } from "./content"
import { keyOf, type Point } from "./geometry"
import type { FightEvent, Fighter } from "./types"

function setup(fighters: [string, Point][][], board: Board) {
  return new Combat({
    seed: 1,
    board,
    teams: fighters.map((team) => ({
      controller: "human",
      fighters: team.map(([id]) => id),
    })),
    positions: fighters.map((team) => team.map(([, p]) => p)),
  })
}

function turnOf(combat: Combat, fighter: Fighter) {
  for (const f of combat.fighters) {
    if (f !== fighter)
      f.nextActionAt = Math.max(f.nextActionAt, combat.time + 500)
  }
  fighter.nextActionAt = combat.time
  combat.run()
  expect(combat.activeFighter).toBe(fighter)
}

const ofType = <T extends FightEvent["type"]>(events: FightEvent[], type: T) =>
  events.filter((e): e is Extract<FightEvent, { type: T }> => e.type === type)

describe("height in combat", () => {
  test("height gives +1 range per level above the target, up to +2", () => {
    const board = Board.fromAscii(["3........"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 8, y: 0 }]]],
      board,
    )
    const [eva] = combat.fighters
    const arrow = ACTIONS.arrow
    expect(combat.heightBonus(arrow, { x: 0, y: 0 }, { x: 8, y: 0 })).toBe(2)
    expect(
      combat.heightBonus(ACTIONS.kick, { x: 0, y: 0 }, { x: 1, y: 0 }),
    ).toBe(0)
    const cells = combat.getLaunchCells(eva, arrow).map(keyOf)
    expect(cells).toContain("8,0") // 6 + 2
    expect(cells).not.toContain("9,0")
  })

  test("no bonus when shooting uphill", () => {
    const board = Board.fromAscii([".......3"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 7, y: 0 }]]],
      board,
    )
    expect(
      combat.heightBonus(ACTIONS.arrow, { x: 0, y: 0 }, { x: 7, y: 0 }),
    ).toBe(0)
  })

  test("a hill between two fighters blocks ranged attacks", () => {
    const board = Board.fromAscii(["..2...."])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 4, y: 0 }]]],
      board,
    )
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    expect(combat.useAction("arrow", gorr.position).ok).toBe(false)
  })

  test("climbing slows steps down, going down speeds them up", () => {
    const board = Board.fromAscii([".1"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 1, y: 0 }]]],
      board,
    )
    const [eva] = combat.fighters
    const flat = combat.baseStepDelay(eva) * STEP_DELAY_RATIO
    const down = combat.stepDelay(eva, { x: 1, y: 0 }, { x: 0, y: 0 })
    const climb = combat.stepDelay(eva, { x: 0, y: 0 }, { x: 1, y: 0 })
    expect(down).toBeCloseTo(flat * MIN_STEP_COST)
    expect(climb).toBeCloseTo(flat * 2)
  })

  test("a path through a cliff is recomputed when the terrain changes", () => {
    const board = Board.fromAscii(["....."])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 4, y: 0 }]]],
      board,
    )
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    combat.moveTo({ x: 3, y: 0 })
    combat.pass()
    board.get({ x: 2, y: 0 })!.elevation = 3 // a peak rises on the way
    gorr.nextActionAt = eva.nextActionAt = 10_000
    const events = combat.run(50)
    expect(ofType(events, "pathBlocked")).toHaveLength(1)
    expect(eva.position.x).toBeLessThan(2)
  })
})

describe("push and terrain", () => {
  test("pushing into a cliff deals collision damage", () => {
    const board = Board.fromAscii(["...3."])
    const combat = setup(
      [[["brutus", { x: 1, y: 0 }]], [["gorr", { x: 2, y: 0 }]]],
      board,
    )
    const [brutus, gorr] = combat.fighters
    turnOf(combat, brutus)
    const result = combat.useAction("shieldBash", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    expect(gorr.position).toEqual({ x: 2, y: 0 })
    expect(ofType(result.events, "damaged")[1].amount).toBe(
      COLLISION_DAMAGE * 2,
    )
  })

  test("pushing off a ledge deals fall damage", () => {
    // the low area (bottom row) is the main region, the plateau is not
    const board = Board.fromAscii(["222a.", "....."])
    const combat = setup(
      [[["brutus", { x: 1, y: 0 }]], [["gorr", { x: 2, y: 0 }]]],
      board,
    )
    const [brutus, gorr] = combat.fighters
    turnOf(combat, brutus)
    const result = combat.useAction("shieldBash", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    expect(gorr.position).toEqual({ x: 4, y: 0 })
    const hits = ofType(result.events, "damaged")
    // drop 2 → -1 is 3 levels: (3 - 1) × fall damage
    expect(hits[1].amount).toBe(FALL_DAMAGE * 2)
  })

  test("falling into water does not hurt", () => {
    const board = Board.fromAscii(["222~.", "....."])
    const combat = setup(
      [[["brutus", { x: 1, y: 0 }]], [["gorr", { x: 2, y: 0 }]]],
      board,
    )
    const [brutus, gorr] = combat.fighters
    turnOf(combat, brutus)
    const result = combat.useAction("shieldBash", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    expect(gorr.position).toEqual({ x: 4, y: 0 })
    expect(ofType(result.events, "damaged")).toHaveLength(1)
  })

  test("nobody is ever pushed into an unreachable hole", () => {
    const board = Board.fromAscii([
      "....c", //
      "...3.",
    ])
    // (4,0) is a -3 pit: from (3,0) the drop is 3, and its other neighbor is a peak
    const combat = setup(
      [[["brutus", { x: 2, y: 0 }]], [["gorr", { x: 3, y: 0 }]]],
      board,
    )
    const [brutus, gorr] = combat.fighters
    expect(combat.walkableRegion.has("4,0")).toBe(false)
    turnOf(combat, brutus)
    combat.useAction("shieldBash", gorr.position)
    expect(gorr.position).toEqual({ x: 3, y: 0 })
  })
})

describe("earthquake reshapes the terrain", () => {
  const prepare = (rows: string[]) => {
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: rows[0].length - 1, y: 0 }]]],
      Board.fromAscii(rows),
    )
    const [eva] = combat.fighters
    turnOf(combat, eva)
    combat.teams[0].energy = 6
    return combat
  }

  test("raises low cells by 2", () => {
    const combat = prepare([".....", "....."])
    expect(combat.useDivine("earthquake", { x: 2, y: 1 }).ok).toBe(true)
    expect(combat.board.get({ x: 2, y: 1 })!.elevation).toBe(2)
  })

  test("collapses high cells by 2", () => {
    const combat = prepare(["..3..", "....."])
    expect(combat.useDivine("earthquake", { x: 2, y: 0 }).ok).toBe(true)
    expect(combat.board.get({ x: 2, y: 0 })!.elevation).toBe(1)
  })

  test("filling a pond turns it into ground", () => {
    const combat = prepare(["..W..", "....."])
    combat.useDivine("earthquake", { x: 2, y: 0 })
    expect(combat.board.get({ x: 2, y: 0 })).toMatchObject({
      terrain: "water",
      elevation: -1,
    })
    combat.teams[0].energy = 6
    combat.useDivine("earthquake", { x: 2, y: 0 })
    expect(combat.board.get({ x: 2, y: 0 })).toMatchObject({
      terrain: "ground",
      elevation: 1,
    })
  })

  test("never cuts fighters apart, and refuses occupied cells", () => {
    const combat = prepare(["....."])
    expect(combat.useDivine("earthquake", { x: 2, y: 0 })).toEqual({
      ok: false,
      reason: "Le terrain serait coupé en deux",
    })
    expect(combat.board.get({ x: 2, y: 0 })!.elevation).toBe(0)
    expect(combat.useDivine("earthquake", { x: 0, y: 0 }).ok).toBe(false)
    expect(combat.useDivine("earthquake", { x: 9, y: 9 }).ok).toBe(false)
  })
})

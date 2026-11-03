import { describe, expect, test } from "bun:test"
import { Board, MOVE_COST } from "./board"
import {
  COLLISION_DAMAGE,
  Combat,
  STEP_DELAY_RATIO,
  SWIM_FATIGUE,
} from "./combat"
import { CHARACTERS } from "./content"
import { keyOf, type Point } from "./geometry"
import type { Fighter, FightEvent } from "./types"

function setup(
  fighters: [string, Point][][],
  board: Board,
  controller: "human" | "ai" = "human",
) {
  return new Combat({
    seed: 1,
    board,
    teams: fighters.map((team) => ({
      controller,
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

// a lake: shallow banks (~) around deep water (w, W)
const LAKE = [
  ".........", //
  "..~www~..",
  "..~wWw~..",
  "..~www~..",
  ".........",
]

describe("water depth and locomotion (board)", () => {
  const board = Board.fromAscii(LAKE)
  const shallow = { x: 2, y: 1 }
  const deep = { x: 4, y: 2 }

  test("depth 2+ is deep water", () => {
    expect(board.isDeepWater(shallow)).toBe(false)
    expect(board.isDeepWater(deep)).toBe(true)
    expect(board.isDeepWater({ x: 0, y: 0 })).toBe(false)
  })

  test("walkers cannot stand in deep water, swimmers and aquatics can", () => {
    expect(board.canStand(deep, "walker")).toBe(false)
    expect(board.canStand(deep, "swimmer")).toBe(true)
    expect(board.canStand(deep, "aquatic")).toBe(true)
    expect(board.canStand(shallow, "walker")).toBe(true)
    expect(board.canStand({ x: 99, y: 0 }, "aquatic")).toBe(false)
  })

  test("costs: wading, swimming, and aquatic as on land", () => {
    expect(board.moveCost(shallow, "walker")).toBe(MOVE_COST.wade)
    expect(board.moveCost(shallow, "swimmer")).toBe(MOVE_COST.wade)
    expect(board.moveCost(deep, "swimmer")).toBe(MOVE_COST.swim)
    expect(board.moveCost(deep, "walker")).toBe(Infinity)
    expect(board.moveCost(deep, "aquatic")).toBe(MOVE_COST.ground)
    expect(board.moveCost(shallow, "aquatic")).toBe(MOVE_COST.ground)
  })

  test("walkers go around the lake, swimmers and aquatics cross it", () => {
    const from = { x: 4, y: 0 }
    const to = { x: 4, y: 4 }
    const walker = board.findPath(from, to, undefined, "walker")!
    const swimmer = board.findPath(from, to, undefined, "swimmer")!
    const aquatic = board.findPath(from, to, undefined, "aquatic")!
    expect(walker.some((p) => board.isDeepWater(p))).toBe(false)
    expect(aquatic).toHaveLength(4)
    expect(aquatic.some((p) => board.isDeepWater(p))).toBe(true)
    expect(swimmer.length).toBeGreaterThanOrEqual(4)
  })

  test("deep water is outside the walkers' region only", () => {
    expect(board.mainRegion("walker").has(keyOf(deep))).toBe(false)
    expect(board.mainRegion("swimmer").has(keyOf(deep))).toBe(true)
    expect(board.mainRegion("aquatic").size).toBe(board.cells.length)
  })
})

describe("water in combat", () => {
  test("the new characters are aquatic, Eva and Nyx swim, the others walk", () => {
    expect(CHARACTERS.nerea.locomotion).toBe("aquatic")
    expect(CHARACTERS.squalor.locomotion).toBe("aquatic")
    expect(CHARACTERS.eva.locomotion).toBe("swimmer")
    expect(CHARACTERS.nyx.locomotion).toBe("swimmer")
    for (const id of ["merlin", "brutus", "lyra", "gorr"]) {
      expect(CHARACTERS[id].locomotion ?? "walker").toBe("walker")
    }
  })

  test("aquatic fighters keep their full speed in water", () => {
    const combat = setup(
      [[["nerea", { x: 0, y: 2 }]], [["gorr", { x: 8, y: 0 }]]],
      Board.fromAscii(LAKE),
    )
    const [nerea] = combat.fighters
    const land = combat.stepDelay(nerea, { x: 0, y: 0 }, { x: 1, y: 0 })
    expect(combat.stepDelay(nerea, { x: 3, y: 2 }, { x: 4, y: 2 })).toBeCloseTo(
      land,
    )
    expect(combat.stepDelay(nerea, { x: 1, y: 2 }, { x: 2, y: 2 })).toBeCloseTo(
      land,
    )
    expect(land).toBeCloseTo(combat.baseDelay(nerea) * STEP_DELAY_RATIO)
    nerea.position = { x: 4, y: 2 }
    expect(combat.isSwimming(nerea)).toBe(false)
    expect(combat.delayMultiplier(nerea)).toBe(1)
  })

  test("swimmers are slow in deep water and every turn there is tiring", () => {
    const combat = setup(
      [[["eva", { x: 4, y: 2 }]], [["gorr", { x: 8, y: 0 }]]],
      Board.fromAscii(LAKE),
    )
    const [eva] = combat.fighters
    const land = combat.baseDelay(eva) * STEP_DELAY_RATIO
    expect(combat.stepDelay(eva, { x: 4, y: 2 }, { x: 3, y: 2 })).toBeCloseTo(
      land * MOVE_COST.swim * SWIM_FATIGUE,
    )
    expect(combat.isSwimming(eva)).toBe(true)
    expect(combat.delayMultiplier(eva)).toBe(SWIM_FATIGUE)

    // passing while treading water costs more than on land
    turnOf(combat, eva)
    const start = combat.time
    combat.useAction("kick", eva.position) // invalid, still her turn
    combat.pass()
    expect(eva.nextActionAt - start).toBeCloseTo(
      combat.baseDelay(eva) * SWIM_FATIGUE,
    )
  })

  test("walkers refuse deep water destinations", () => {
    const combat = setup(
      [[["brutus", { x: 4, y: 0 }]], [["gorr", { x: 8, y: 4 }]]],
      Board.fromAscii(LAKE),
    )
    const [brutus] = combat.fighters
    turnOf(combat, brutus)
    expect(combat.moveTo({ x: 4, y: 2 })).toEqual({
      ok: false,
      reason: "Destination inaccessible",
    })
    expect(combat.moveTo({ x: 2, y: 1 }).ok).toBe(true) // shallow is fine
    expect(
      combat.getReachableCells(brutus).some((p) => combat.board.isDeepWater(p)),
    ).toBe(false)
  })

  test("a walker pushed towards deep water clings to the shore", () => {
    const board = Board.fromAscii(["...ww", "....."])
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

  test("a swimmer pushed into deep water falls in", () => {
    const board = Board.fromAscii(["...ww", "....."])
    const combat = setup(
      [[["brutus", { x: 1, y: 0 }]], [["nyx", { x: 2, y: 0 }]]],
      board,
    )
    const [brutus, nyx] = combat.fighters
    turnOf(combat, brutus)
    combat.useAction("shieldBash", nyx.position)
    expect(nyx.position).toEqual({ x: 4, y: 0 })
    expect(combat.isSwimming(nyx)).toBe(true)
  })

  test("Squalor dives only into water, splashing enemies around", () => {
    const board = Board.fromAscii(LAKE)
    const combat = setup(
      [
        [["squalor", { x: 4, y: 0 }]],
        [
          ["brutus", { x: 6, y: 2 }],
          ["gorr", { x: 0, y: 4 }],
        ],
      ],
      board,
    )
    const [squalor, brutus] = combat.fighters
    turnOf(combat, squalor)
    const targets = combat.getValidTargets(
      squalor,
      combat.actionsOf(squalor)[1],
    )
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.every((p) => board.get(p)!.terrain === "water")).toBe(true)
    expect(combat.useAction("dive", { x: 5, y: 0 })).toEqual({
      ok: false,
      reason: "Cible invalide",
    })
    const result = combat.useAction("dive", { x: 5, y: 2 })
    if (!result.ok) throw new Error(result.reason)
    expect(squalor.position).toEqual({ x: 5, y: 2 })
    expect(ofType(result.events, "damaged").map((e) => e.fighterId)).toEqual([
      brutus.id,
    ])
  })

  test("earthquake is allowed while an aquatic fighter stays in deep water", () => {
    const combat = setup(
      [[["nerea", { x: 4, y: 2 }]], [["gorr", { x: 8, y: 0 }]]],
      Board.fromAscii(LAKE),
    )
    const [nerea] = combat.fighters
    turnOf(combat, nerea)
    combat.teams[0].energy = 6
    expect(combat.useDivine("earthquake", { x: 0, y: 4 }).ok).toBe(true)
  })

  test("AI fights with aquatic and swimming fighters end with a winner", () => {
    for (let seed = 0; seed < 12; seed++) {
      const combat = new Combat({
        seed,
        teams: [
          { controller: "ai", fighters: ["nerea", "eva", "brutus"] },
          { controller: "ai", fighters: ["squalor", "nyx", "gorr"] },
        ],
      })
      combat.run(50_000)
      expect(combat.state).toBe("ended")
      for (const f of combat.aliveFighters) {
        expect(combat.board.canStand(f.position, f.locomotion)).toBe(true)
      }
    }
  })
})

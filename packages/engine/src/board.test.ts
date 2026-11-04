import { describe, expect, test } from "bun:test"
import { Board, MAX_ELEVATION, MIN_ELEVATION } from "./board"
import { keyOf } from "./geometry"
import { createRng } from "./random"

describe("Board parsing", () => {
  test("reads heights, pits and water depths", () => {
    const board = Board.fromAscii([".123", "abc^", "~wW#"])
    expect(board.width).toBe(4)
    expect(board.height).toBe(3)
    expect([0, 1, 2, 3].map((x) => board.get({ x, y: 0 })!.elevation)).toEqual([
      0, 1, 2, 3,
    ])
    expect([0, 1, 2, 3].map((x) => board.get({ x, y: 1 })!.elevation)).toEqual([
      -1, -2, -3, 1,
    ])
    expect([0, 1, 2].map((x) => board.get({ x, y: 2 })!.terrain)).toEqual([
      "water",
      "water",
      "water",
    ])
    expect([0, 1, 2, 3].map((x) => board.get({ x, y: 2 })!.elevation)).toEqual([
      -1, -2, -3, 3,
    ])
    expect(board.get({ x: 5, y: 5 })).toBeUndefined()
  })

  test("rejects unknown characters", () => {
    expect(() => Board.fromAscii(["?"])).toThrow()
  })

  test("toAscii is the inverse of fromAscii", () => {
    const rows = [".123", "abc.", "~wW1"]
    expect(Board.fromAscii(rows).toAscii()).toEqual(rows)
  })

  test("clone is deep", () => {
    const board = Board.fromAscii(["..."])
    const copy = board.clone()
    copy.get({ x: 0, y: 0 })!.elevation = 3
    expect(board.get({ x: 0, y: 0 })!.elevation).toBe(0)
  })
})

describe("Heights and movement", () => {
  test("water is walked at its surface", () => {
    const board = Board.fromAscii(["~.a"])
    expect(board.standHeight({ x: 0, y: 0 })).toBe(0)
    expect(board.standHeight({ x: 2, y: 0 })).toBe(-1)
    expect(board.canStep({ x: 1, y: 0 }, { x: 0, y: 0 })).toBe(true)
  })

  test("one level can be climbed, two cannot", () => {
    const board = Board.fromAscii([".12", "..3"])
    expect(board.canStep({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true)
    expect(board.canStep({ x: 1, y: 0 }, { x: 2, y: 0 })).toBe(true)
    expect(board.canStep({ x: 1, y: 1 }, { x: 2, y: 1 })).toBe(false) // 0 → 3
    expect(board.canStep({ x: 2, y: 1 }, { x: 1, y: 1 })).toBe(false) // jumping down 3
    expect(board.canStep({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe(false)
  })

  test("climbing costs one more, going down does not", () => {
    const board = Board.fromAscii([".1~"])
    expect(board.stepCost({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(2)
    expect(board.stepCost({ x: 1, y: 0 }, { x: 0, y: 0 })).toBe(1)
    expect(board.stepCost({ x: 1, y: 0 }, { x: 2, y: 0 })).toBe(2) // water
    expect(board.stepCost({ x: 0, y: 0 }, { x: 9, y: 0 })).toBe(Infinity)
    expect(board.moveCost({ x: 2, y: 0 })).toBe(2)
    expect(board.moveCost({ x: 9, y: 0 })).toBe(Infinity)
  })

  test("only 4 orthogonal neighbors, clipped to the board", () => {
    const board = new Board(3, 3)
    expect(board.neighbors({ x: 1, y: 1 })).toHaveLength(4)
    expect(board.neighbors({ x: 0, y: 0 })).toHaveLength(2)
  })

  test("paths go around cliffs", () => {
    const board = Board.fromAscii([
      ".....", //
      ".333.",
      ".....",
    ])
    const path = board.findPath({ x: 0, y: 1 }, { x: 4, y: 1 })!
    expect(path).toHaveLength(6)
    expect(path.every((p) => board.get(p)!.elevation === 0)).toBe(true)
  })

  test("paths can climb stairs", () => {
    const board = Board.fromAscii(["0123".replace("0", ".")])
    expect(board.findPath({ x: 0, y: 0 }, { x: 3, y: 0 })).toHaveLength(3)
  })

  test("water and slopes are avoided when cheaper", () => {
    const board = Board.fromAscii([
      "..~~~..", //
      ".......",
    ])
    const path = board.findPath({ x: 0, y: 0 }, { x: 6, y: 0 })!
    expect(path.some((p) => board.get(p)!.terrain === "water")).toBe(false)
    const small = Board.fromAscii(["..~..", "....."])
    expect(small.findPath({ x: 0, y: 0 }, { x: 4, y: 0 })).toHaveLength(4)
  })

  test("returns null when unreachable", () => {
    const board = Board.fromAscii([".#."])
    expect(board.findPath({ x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull()
    expect(board.isConnected()).toBe(false)
  })

  test("explore respects the canEnter filter and max cost", () => {
    const board = new Board(5, 1)
    expect(board.explore({ x: 0, y: 0 }, (p) => p.x !== 2).size).toBe(2)
    expect(board.explore({ x: 0, y: 0 }, undefined, 3).size).toBe(4)
  })

  test("regions: an isolated peak is outside the main region", () => {
    const board = Board.fromAscii([
      "...", //
      ".3.",
      "...",
    ])
    const main = board.mainRegion()
    expect(main.size).toBe(8)
    expect(main.has(keyOf({ x: 1, y: 1 }))).toBe(false)
    expect(board.regionOf({ x: 1, y: 1 }).size).toBe(1)
  })
})

describe("Line of sight", () => {
  test("flat ground and water never block", () => {
    const board = Board.fromAscii([".~~W."])
    expect(board.hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true)
  })

  test("a hill hides what is behind it", () => {
    const board = Board.fromAscii(["..1.."])
    expect(board.hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(false)
  })

  test("standing on a hill lets you see over a lower one", () => {
    const board = Board.fromAscii(["2.1.."])
    expect(board.hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true)
  })

  test("a pit does not block, a tall peak does", () => {
    expect(
      Board.fromAscii(["..c.."]).hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 }),
    ).toBe(true)
    expect(
      Board.fromAscii(["1.3.1"]).hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 }),
    ).toBe(false)
  })

  test("adjacent cells always see each other", () => {
    expect(
      Board.fromAscii([".3"]).hasLineOfSight({ x: 0, y: 0 }, { x: 1, y: 0 }),
    ).toBe(true)
  })
})

describe("Procedural generation", () => {
  const boards = Array.from({ length: 40 }, (_, seed) =>
    Board.generate(createRng(seed)),
  )

  test("point-symmetric (fair for both sides)", () => {
    for (const board of boards) {
      for (const cell of board.cells) {
        const mirror = board.get({
          x: board.width - 1 - cell.x,
          y: board.height - 1 - cell.y,
        })!
        expect(mirror.terrain).toBe(cell.terrain)
        expect(mirror.elevation).toBe(cell.elevation)
      }
    }
  })

  test("deep relief: hills and holes in every map", () => {
    for (const board of boards) {
      const elevations = board.cells.map((c) => c.elevation)
      expect(Math.max(...elevations)).toBeGreaterThanOrEqual(2)
      expect(Math.min(...elevations)).toBeLessThanOrEqual(-1)
      for (const e of elevations) {
        expect(e).toBeGreaterThanOrEqual(MIN_ELEVATION)
        expect(e).toBeLessThanOrEqual(MAX_ELEVATION)
      }
    }
  })

  test("water fills every hole, and only holes (no dry basin)", () => {
    for (const board of boards) {
      for (const cell of board.cells) {
        expect(cell.terrain === "water").toBe(cell.elevation < 0)
      }
    }
  })

  test("both spawn edges are walkable and connected", () => {
    for (const board of boards) {
      const region = board.mainRegion()
      expect(region.size).toBeGreaterThanOrEqual(board.cells.length * 0.75)
      const left = board.cells.filter((c) => c.x === 0 && region.has(keyOf(c)))
      const right = board.cells.filter(
        (c) => c.x === board.width - 1 && region.has(keyOf(c)),
      )
      expect(left.length).toBeGreaterThanOrEqual(board.height - 2)
      expect(right.length).toBeGreaterThanOrEqual(board.height - 2)
    }
  })

  test("maps vary with the seed", () => {
    const unique = new Set(boards.map((b) => b.toAscii().join("/")))
    expect(unique.size).toBeGreaterThan(30)
  })
})

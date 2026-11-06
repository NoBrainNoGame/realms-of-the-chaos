import { describe, expect, test } from "bun:test"
import {
  type Chapter,
  chapterById,
  frame,
  GridSession,
  narr,
  next,
  OrderSession,
  PairsSession,
  type PuzzleSpec,
  puzzle,
  puzzleProblems,
  solvePuzzle,
  startChapter,
  useChapters,
  validateChapter,
} from "./index"

const grid: PuzzleSpec = {
  kind: "grid",
  w: 4,
  h: 3,
  holes: [{ x: 1, y: 1 }],
  tokens: [
    { id: "a", label: "A", at: { x: 0, y: 0 } },
    { id: "b", label: "B", at: { x: 3, y: 2 } },
  ],
  moves: 3,
  rules: [
    { id: "meet", kind: "together", tokens: ["a", "b"] },
    { id: "corner", kind: "occupy", cells: [{ x: 3, y: 0 }] },
  ],
}

const order: PuzzleSpec = {
  kind: "order",
  items: [
    { id: "x", text: "X", correction: "X d'abord" },
    { id: "y", text: "Y" },
    { id: "z", text: "Z" },
  ],
  solution: ["y", "z", "x"],
}

const mini: Chapter = {
  id: "puz",
  era: 1,
  number: 1,
  title: "Puz",
  place: "nowhere",
  start: "a",
  scenes: {
    a: {
      id: "a",
      title: "A",
      kind: "scene",
      beats: [
        puzzle(
          "p",
          grid,
          { meet: [narr("rejoints")], corner: [narr("coin")] },
          { none: [narr("rien")] },
        ),
        narr("fin"),
      ],
      next: "$end",
    },
  },
}
useChapters((id) => (id === "puz" ? mini : chapterById(id)))

describe("grid puzzle", () => {
  test("clicks pick up, move and spend moves", () => {
    const s = new GridSession(grid as never)
    s.click({ x: 0, y: 0 })
    expect(s.selected).toBe("a")
    expect(s.click({ x: 1, y: 1 })).toBe(false) // a hole
    expect(s.click({ x: 3, y: 0 })).toBe(true)
    expect(s.movesLeft).toBe(2)
    expect(s.result()).toEqual(["corner"])
  })

  test("two tokens together, then the moves run out", () => {
    const s = new GridSession(grid as never)
    s.select("a")
    s.moveTo({ x: 3, y: 2 })
    expect(s.result()).toEqual(["meet"])
    s.select("b")
    s.moveTo({ x: 2, y: 2 })
    s.select("a")
    s.moveTo({ x: 2, y: 2 })
    expect(s.over).toBe(true)
    expect(s.moveTo({ x: 0, y: 0 })).toBe(false)
  })

  test("problems are reported", () => {
    expect(puzzleProblems(grid)).toEqual([])
    expect(
      puzzleProblems({
        ...(grid as object),
        rules: [{ id: "r", kind: "together", tokens: ["a", "q"] }],
      } as PuzzleSpec),
    ).toHaveLength(1)
  })
})

describe("order puzzle", () => {
  test("swaps, checks, corrects", () => {
    const s = new OrderSession(order as never)
    s.click(0)
    s.click(1)
    expect(s.order).toEqual(["y", "x", "z"])
    const c = s.check()
    expect(c.ok).toBe(false)
    s.click(1)
    s.click(2)
    expect(s.check().ok).toBe(true)
    expect(s.result()).toEqual(["ok"])
  })
})

describe("puzzle beat", () => {
  test("is valid and plays the beats of the rule that held", () => {
    expect(validateChapter(mini)).toEqual([])
    const run = startChapter("puz")
    expect(frame(run)).toMatchObject({ kind: "puzzle", id: "p" })
    const after = solvePuzzle(run, ["meet"])
    expect(frame(after)).toMatchObject({ text: "rejoints" })
    expect(frame(next(after))).toMatchObject({ text: "fin" })
  })

  test("no rule plays the none beats, and walking away counts as none", () => {
    const run = startChapter("puz")
    expect(frame(solvePuzzle(run, []))).toMatchObject({ text: "rien" })
    expect(frame(next(run))).toMatchObject({ text: "rien" })
  })

  test("an unknown rule is refused", () => {
    expect(() => solvePuzzle(startChapter("puz"), ["nope"])).toThrow()
  })
})

describe("pairs", () => {
  test("the simulated pairs beat the 75 % a hidden table allows", () => {
    const s = new PairsSession({
      kind: "pairs",
      strokes: 10,
      simulated: 2000,
      seed: 8501,
    })
    for (let i = 0; i < 10; i++) s.strike(i % 2 ? "wood" : "bone")
    expect(s.done).toBe(true)
    s.simulate()
    expect(s.rate).toBeGreaterThan(0.8)
    expect(s.blueShare("eva")).toBeGreaterThan(0.4)
    expect(s.blueShare("eva")).toBeLessThan(0.6)
    expect(s.result()).toEqual(["ok"])
  })
})

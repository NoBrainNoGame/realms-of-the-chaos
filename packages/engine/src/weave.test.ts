import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"
import { keyOf } from "./geometry"

const board = () =>
  Board.fromAscii(["........", "........", "........", "........", "........"])

/** Two human teams that only pass: the clock does the work. */
function quiet(
  rules: AdventureRules,
  a = ["brutus"],
  b = ["squalor"],
  positions = [[{ x: 7, y: 4 }], [{ x: 6, y: 4 }]],
  seed = 3,
) {
  return new Combat({
    seed,
    board: board(),
    teams: [
      { name: "A", controller: "human", fighters: a },
      { name: "B", controller: "human", fighters: b },
    ],
    positions,
    adventure: { clock: { period: 10, limit: 40 }, ...rules },
  })
}

function until(c: Combat, preset: string) {
  for (let i = 0; i < 50 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter?.presetId === preset) return c.activeFighter
    if (c.activeFighter) c.pass()
  }
  return c.activeFighter
}

function drain(c: Combat) {
  for (let i = 0; i < 4000 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter) c.pass()
  }
}

describe("lacunes", () => {
  test("a Lacune is a hole: nobody can stand on it", () => {
    const c = quiet({ lacunes: { cells: [{ x: 0, y: 0 }], every: 1 } })
    expect(c.board.canStand({ x: 0, y: 0 })).toBe(false)
    expect(c.board.canStand({ x: 1, y: 0 })).toBe(true)
    expect(new Board(2, 2).voids.size).toBe(0)
  })

  test("it spreads every N ticks to free neighbours, by the seed", () => {
    const rules = { lacunes: { cells: [{ x: 0, y: 0 }], every: 2, spread: 2 } }
    const a = quiet(rules)
    drain(a)
    // 4 ticks done by the limit of 4... the clock runs to 40: ticks 2,4,..
    expect(a.adventure!.report.lacune.grown).toBeGreaterThan(2)
    expect(a.board.voids.size).toBe(1 + a.adventure!.report.lacune.grown)
    const b = quiet(rules)
    drain(b)
    expect([...b.board.voids].sort()).toEqual([...a.board.voids].sort())
    // never under a fighter
    expect(a.board.voids.has(keyOf({ x: 7, y: 4 }))).toBe(false)
    expect(a.board.voids.has(keyOf({ x: 6, y: 4 }))).toBe(false)
  })

  test("reaching the swallow threshold loses the fight for everybody", () => {
    const c = quiet({
      lacunes: { cells: [{ x: 0, y: 0 }], every: 1, spread: 3, swallow: 8 },
    })
    drain(c)
    expect(c.state).toBe("ended")
    expect(c.winnerTeam).toBeNull()
    expect(c.adventure!.report.lacune.swallowed).toBe(true)
  })

  test("an action of the mending team next to a Lacune cell closes it", () => {
    const c = quiet(
      { lacunes: { cells: [{ x: 3, y: 1 }], every: 99 } },
      ["brutus"],
      ["squalor"],
      [[{ x: 3, y: 2 }], [{ x: 4, y: 2 }]],
    )
    expect(until(c, "brutus")?.presetId).toBe("brutus")
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    expect(c.useAction("kick", foe.position).ok).toBe(true)
    expect(c.board.voids.size).toBe(0)
    expect(c.adventure!.report.lacune.mended).toBe(1)
  })
})

describe("superposition", () => {
  const cells = [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 1, y: 1 },
  ]

  test("uncertain cells stay open until decoherence settles them", () => {
    const c = quiet({ superposition: { cells, decohereAt: 3 } })
    expect(c.adventure!.uncertainCells).toHaveLength(6)
    expect(c.board.canStand({ x: 1, y: 0 })).toBe(true)
    drain(c)
    expect(c.adventure!.uncertainCells).toHaveLength(0)
    const r = c.adventure!.report.measured
    expect(r).toHaveLength(6)
    expect(r.every((m) => m.by === null)).toBe(true)
    const voids = r.filter((m) => m.state === "void").length
    expect(c.board.voids.size).toBe(voids)
  })

  test("same seed, same outcome; pVoid sets the odds", () => {
    const run = (pVoid: number, seed: number) => {
      const c = quiet(
        { superposition: { cells, pVoid, decohereAt: 1 } },
        undefined,
        undefined,
        undefined,
        seed,
      )
      drain(c)
      return [...c.board.voids].sort()
    }
    expect(run(0.5, 9)).toEqual(run(0.5, 9))
    expect(run(1, 9)).toHaveLength(6)
    expect(run(0, 9)).toHaveLength(0)
  })

  test("an action over a cell is a measurement; an occupied cell is ground", () => {
    const c = quiet(
      { superposition: { cells: [{ x: 4, y: 2 }], pVoid: 1 } },
      ["brutus"],
      ["squalor"],
      [[{ x: 3, y: 2 }], [{ x: 4, y: 2 }]],
    )
    const brutus = until(c, "brutus")!
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    c.useAction("kick", foe.position)
    const [m] = c.adventure!.report.measured
    expect(m.by).toBe(brutus.id)
    expect(m.state).toBe("solid")
    expect(c.board.voids.size).toBe(0)
  })
})

describe("doubles", () => {
  const pair = (found: number, seed = 1) =>
    new Combat({
      seed,
      board: board(),
      teams: [
        { name: "A", controller: "human", fighters: ["brutus"] },
        { name: "B", controller: "human", fighters: ["squalor", "squalor"] },
      ],
      positions: [
        [{ x: 3, y: 2 }],
        [
          { x: 4, y: 2 },
          { x: 7, y: 4 },
        ],
      ],
      adventure: { doubles: [{ team: 1, pair: [0, 1], found }] },
    })

  test("found: the struck position is real and the other is gone", () => {
    const c = pair(1)
    until(c, "brutus")
    const [near, far] = c.fighters.filter((f) => f.presetId === "squalor")
    c.useAction("kick", near.position)
    expect(c.departed.has(far.id)).toBe(true)
    expect(c.departed.has(near.id)).toBe(false)
    expect(near.hp).toBeLessThan(c.maxHp(near))
    expect(c.adventure!.report.doubles).toEqual([
      { struck: near.id, other: far.id, found: true, by: expect.any(String) },
    ])
  })

  test("not found: the blow met nothing and the struck position is gone", () => {
    const c = pair(0)
    until(c, "brutus")
    const [near, far] = c.fighters.filter((f) => f.presetId === "squalor")
    c.useAction("kick", near.position)
    expect(c.departed.has(near.id)).toBe(true)
    expect(c.departed.has(far.id)).toBe(false)
    // only the other position stands: the fight goes on
    expect(c.state).not.toBe("ended")
    expect(c.adventure!.unresolvedDoubles).toHaveLength(0)
  })
})

describe("fraying and halos", () => {
  test("frayed ground loses height every N ticks, down to the floor", () => {
    const c = quiet({
      fraying: {
        cells: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        every: 2,
      },
    })
    drain(c)
    expect(c.board.get({ x: 0, y: 0 })!.elevation).toBe(-3)
    expect(c.adventure!.report.frayed).toBeGreaterThan(0)
    // a cliff now: nobody steps down from the neighbour
    expect(c.board.canStep({ x: 0, y: 1 }, { x: 0, y: 0 })).toBe(false)
  })

  test("a halo hurts whoever starts a turn near its bearer, not its team", () => {
    const c = quiet(
      { halos: [{ team: 1, index: 0, radius: 2, from: 1 }], silentDamage: 2 },
      ["brutus"],
      ["squalor", "merlin"],
      [
        [{ x: 3, y: 2 }],
        [
          { x: 4, y: 2 },
          { x: 5, y: 2 },
        ],
      ],
    )
    const hp = (id: string) => c.fighters.find((f) => f.presetId === id)!.hp
    const before = [hp("brutus"), hp("squalor"), hp("merlin")]
    drain(c)
    expect(hp("brutus")).toBeLessThan(before[0])
    expect(hp("squalor")).toBe(before[1])
    expect(hp("merlin")).toBe(before[2])
    expect(c.adventure!.haloCells().length).toBeGreaterThan(0)
  })
})

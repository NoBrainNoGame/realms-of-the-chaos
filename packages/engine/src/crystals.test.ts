import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"
import { keyOf } from "./geometry"

const GROUND = ["........", "........", "........", "........", "........"]

function fight(
  rules: AdventureRules,
  rows = GROUND,
  a = ["brutus"],
  b = ["squalor"],
  positions = [[{ x: 3, y: 2 }], [{ x: 7, y: 4 }]],
) {
  return new Combat({
    seed: 3,
    board: Board.fromAscii(rows),
    teams: [
      { name: "A", controller: "human", fighters: a },
      { name: "B", controller: "human", fighters: b },
    ],
    positions,
    adventure: { clock: { period: 10, limit: 80 }, ...rules },
  })
}

/** Runs until it is `preset`'s turn (the others pass). */
function until(c: Combat, preset: string) {
  for (let i = 0; i < 60 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter?.presetId === preset) return c.activeFighter
    if (c.activeFighter) c.pass()
  }
  return c.activeFighter
}

const pair = (extra: object = {}) => ({
  crystals: {
    crystals: [
      { id: "a", at: { x: 4, y: 2 }, twin: "b" },
      { id: "b", at: { x: 0, y: 0 }, twin: "a" },
    ],
    ...extra,
  },
})

describe("crystals: Extraire", () => {
  test("a crystal is a one-cell obstacle", () => {
    const c = fight(pair())
    expect(c.board.canStand({ x: 4, y: 2 })).toBe(false)
    expect(c.board.canStand({ x: 5, y: 2 })).toBe(true)
    expect(fight({}).adventure!.crystals).toBeNull()
  })

  test("breaking it gives Élan, kills its twin and opens a Lacune", () => {
    const c = fight(pair())
    const me = until(c, "brutus")!
    const before = c.teams[0].energy
    expect(c.crystal("extract", { x: 4, y: 2 }).ok).toBe(true)
    const r = c.adventure!.report
    expect(r.crystals.extracted).toHaveLength(1)
    expect(r.crystals.extracted[0]).toMatchObject({ id: "a", by: me.id })
    expect(c.teams[0].energy).toBeGreaterThan(before)
    // the twin is dead glass: still an obstacle
    expect(r.crystals.state.b).toBe("dead")
    expect(r.crystals.dead).toEqual(["b"])
    expect(c.board.canStand({ x: 0, y: 0 })).toBe(false)
    // the cell of the crystal is a hole now
    expect(c.board.voids.has(keyOf({ x: 4, y: 2 }))).toBe(true)
    expect(r.lacune.cells).toBe(1)
  })

  test("or heals the allies close to it", () => {
    const c = fight(
      pair(),
      GROUND,
      ["brutus", "lyra"],
      ["squalor"],
      [
        [
          { x: 3, y: 2 },
          { x: 4, y: 3 },
        ],
        [{ x: 7, y: 4 }],
      ],
    )
    const lyra = c.fighters.find((f) => f.presetId === "lyra")!
    lyra.hp = 5
    until(c, "brutus")
    expect(c.crystal("extract", { x: 4, y: 2 }, "heal").ok).toBe(true)
    expect(lyra.hp).toBeGreaterThan(5)
    expect(c.adventure!.report.crystals.extracted[0].gain).toBe("heal")
  })

  test("the Lacune grows a ring later, then stops", () => {
    const c = fight(pair({ ringAfter: 20 }))
    until(c, "brutus")
    c.crystal("extract", { x: 4, y: 2 })
    expect(c.board.voids.size).toBe(1)
    for (let i = 0; i < 40 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter) c.pass()
    }
    expect(c.board.voids.size).toBeGreaterThan(1)
    expect(c.board.voids.size).toBeLessThanOrEqual(5)
  })

  test("only next to it, and not through a wall of rules that are off", () => {
    const c = fight(pair())
    until(c, "brutus")
    c.moveTo({ x: 3, y: 2 })
    expect(c.crystal("extract", { x: 0, y: 0 }).ok).toBe(false)
    const none = fight({ clock: { period: 10 } })
    until(none, "brutus")
    expect(none.crystal("extract", { x: 4, y: 2 }).ok).toBe(false)
  })

  test("a raiding team breaks the crystal it stands next to", () => {
    const c = new Combat({
      seed: 3,
      board: Board.fromAscii(GROUND),
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "ai", fighters: ["squalor"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 4, y: 3 }]],
      adventure: pair({ raiders: [1] }),
    })
    for (let i = 0; i < 40 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter) c.pass()
    }
    expect(c.adventure!.report.crystals.extracted[0]?.team).toBe(1)
  })
})

describe("crystals: Détacher, Porter, Déposer", () => {
  const rules = {
    crystals: {
      crystals: [{ id: "g", at: { x: 4, y: 2 }, kind: "geode" as const }],
      deposits: [{ x: 2, y: 2 }],
    },
  }

  test("a vein cannot be detached, a geode can; then it is carried", () => {
    const vein = fight({
      crystals: { crystals: [{ id: "v", at: { x: 4, y: 2 } }] },
    })
    until(vein, "brutus")
    expect(vein.crystal("detach", { x: 4, y: 2 }).ok).toBe(false)

    const c = fight(rules)
    const me = until(c, "brutus")!
    expect(c.crystal("carry", { x: 4, y: 2 }).ok).toBe(false)
    expect(c.crystal("detach", { x: 4, y: 2 }).ok).toBe(true)
    // it lies there and can be walked on
    expect(c.board.canStand({ x: 4, y: 2 })).toBe(true)
    until(c, "brutus")
    expect(c.crystal("carry", { x: 4, y: 2 }).ok).toBe(true)
    expect(c.adventure!.crystals!.carriedBy(me.id)).toBe("g")
    expect(c.adventure!.report.crystals.held.g).toBe(me.id)
    expect(c.adventure!.crystals!.crystals).toHaveLength(0)
  })

  test("it is deposited on a target cell, or just put down elsewhere", () => {
    const c = fight(rules)
    until(c, "brutus")
    c.crystal("detach", { x: 4, y: 2 })
    until(c, "brutus")
    c.crystal("carry", { x: 4, y: 2 })
    until(c, "brutus")
    expect(c.crystal("deposit", { x: 1, y: 0 }).ok).toBe(false)
    expect(c.crystal("deposit", { x: 3, y: 1 }).ok).toBe(true)
    expect(c.adventure!.report.crystals.deposited).toHaveLength(0)
    expect(c.adventure!.report.crystals.state.g).toBe("loose")
    until(c, "brutus")
    c.crystal("carry", { x: 3, y: 1 })
    c.moveTo({ x: 2, y: 2 })
    // walk there, then deposit on the spot
    for (let i = 0; i < 20; i++) {
      const me = until(c, "brutus")!
      if (me.position.x === 2 && me.position.y === 2) break
      c.moveTo({ x: 2, y: 2 })
      c.pass()
    }
    const me = until(c, "brutus")!
    expect(me.position).toEqual({ x: 2, y: 2 })
    expect(c.crystal("deposit", { x: 2, y: 2 }).ok).toBe(true)
    const dep = c.adventure!.report.crystals.deposited
    expect(dep).toHaveLength(1)
    expect(dep[0].at).toEqual({ x: 2, y: 2 })
    expect(c.adventure!.report.crystals.held.g).toBeNull()
  })

  test("a carrier that falls drops it where it stood", () => {
    const c = fight({
      crystals: {
        crystals: [
          {
            id: "g",
            at: { x: 4, y: 2 },
            kind: "geode",
            carriedBy: { team: 1, index: 0 },
          },
        ],
      },
    })
    const carrier = c.fighters.find((f) => f.presetId === "squalor")!
    expect(c.adventure!.report.crystals.held.g).toBe(carrier.id)
    expect(c.board.canStand({ x: 4, y: 2 })).toBe(true)
    carrier.hp = 1
    // kill it by a hit
    until(c, "brutus")
    c.moveTo(carrier.position)
    for (let i = 0; i < 80 && carrier.alive && c.state !== "ended"; i++) {
      const me = until(c, "brutus")
      if (!me || !carrier.alive) break
      const kick = c.useAction("kick", carrier.position)
      if (!kick.ok)
        c.moveTo({ x: carrier.position.x - 1, y: carrier.position.y })
      if (!kick.ok) c.pass()
    }
    expect(carrier.alive).toBe(false)
    const dropped = c.adventure!.report.crystals.dropped
    expect(dropped).toHaveLength(1)
    expect(dropped[0].by).toBe(carrier.id)
    expect(c.adventure!.report.crystals.state.g).toBe("loose")
    expect(c.adventure!.report.crystals.held.g).toBeNull()
  })

  test("two fighters carrying a pair are linked: they share their healing", () => {
    const c = fight(
      {
        crystals: {
          crystals: [
            {
              id: "x",
              twin: "y",
              at: { x: 5, y: 0 },
              carriedBy: { team: 0, index: 0 },
            },
            {
              id: "y",
              twin: "x",
              at: { x: 6, y: 0 },
              carriedBy: { team: 0, index: 1 },
            },
          ],
        },
      },
      GROUND,
      ["brutus", "lyra"],
      ["squalor"],
      [
        [
          { x: 3, y: 2 },
          { x: 2, y: 2 },
        ],
        [{ x: 7, y: 4 }],
      ],
    )
    const [brutus, lyra] = c.fighters.filter((f) => f.team === 0)
    expect(c.adventure!.crystals!.partnerOf(brutus.id)).toBe(lyra)
    brutus.hp = 4
    lyra.hp = 4
    c.healFighter(brutus, 3)
    expect(brutus.hp).toBe(7)
    expect(lyra.hp).toBe(7)
  })

  test("breaking a crystal carried by its twin's holder takes it away", () => {
    const c = fight({
      crystals: {
        crystals: [
          { id: "a", twin: "b", at: { x: 4, y: 2 } },
          {
            id: "b",
            twin: "a",
            at: { x: 0, y: 0 },
            carriedBy: { team: 1, index: 0 },
          },
        ],
      },
    })
    until(c, "brutus")
    c.crystal("extract", { x: 4, y: 2 })
    expect(c.adventure!.report.crystals.held.b).toBeNull()
    expect(c.adventure!.report.crystals.state.b).toBe("dead")
  })
})

describe("crystals: Pont de cristal", () => {
  const rows = ["..~~~...", "..~~~...", "..~~~...", "..~~~...", "..~~~..."]
  // the ASCII `~` is water: make it deep
  const deep = () => {
    const board = Board.fromAscii(rows)
    for (const cell of board.cells)
      if (cell.terrain === "water") cell.elevation = -3
    return board
  }
  const make = (carried = true) =>
    new Combat({
      seed: 3,
      board: deep(),
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "human", fighters: ["squalor"] },
      ],
      positions: [[{ x: 1, y: 2 }], [{ x: 7, y: 4 }]],
      adventure: {
        clock: { period: 10, limit: 80 },
        crystals: {
          crystals: [
            {
              id: "p",
              at: { x: 0, y: 0 },
              kind: "geode",
              ...(carried ? { carriedBy: { team: 0, index: 0 } } : {}),
            },
          ],
          bridge: { span: 3 },
        },
      },
    })

  test("deep water blocks, a laid bridge makes it walkable", () => {
    const c = make()
    expect(c.board.canStand({ x: 3, y: 2 })).toBe(false)
    until(c, "brutus")
    // not toward land, only over water or a hole
    expect(c.crystal("bridge", { x: 0, y: 2 }).ok).toBe(false)
    expect(c.crystal("bridge", { x: 2, y: 2 }).ok).toBe(true)
    const r = c.adventure!.report
    expect(r.bridged).toEqual([
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ])
    expect(c.board.canStand({ x: 3, y: 2 })).toBe(true)
    expect(c.board.isDeepWater({ x: 3, y: 2 })).toBe(false)
    expect(r.crystals.state.p).toBe("bridge")
    // brutus can now cross: the far bank is reachable
    const me = c.fighters.find((f) => f.presetId === "brutus")!
    until(c, "brutus")
    expect(c.getReachableCells(me).some((p) => p.x === 5 && p.y === 2)).toBe(
      true,
    )
  })

  test("it needs a carried crystal, and a bridge also covers a Lacune", () => {
    const c = make(false)
    until(c, "brutus")
    expect(c.crystal("bridge", { x: 2, y: 2 }).ok).toBe(false)

    const hole = new Combat({
      seed: 3,
      board: Board.fromAscii(GROUND),
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "human", fighters: ["squalor"] },
      ],
      positions: [[{ x: 1, y: 2 }], [{ x: 7, y: 4 }]],
      adventure: {
        clock: { period: 10, limit: 80 },
        lacunes: {
          cells: [
            { x: 2, y: 2 },
            { x: 3, y: 2 },
          ],
          every: 99,
        },
        crystals: {
          crystals: [
            {
              id: "p",
              at: { x: 0, y: 0 },
              kind: "geode",
              carriedBy: { team: 0, index: 0 },
            },
          ],
          bridge: {},
        },
      },
    })
    expect(hole.board.canStand({ x: 2, y: 2 })).toBe(false)
    until(hole, "brutus")
    expect(hole.crystal("bridge", { x: 2, y: 2 }).ok).toBe(true)
    expect(hole.board.canStand({ x: 2, y: 2 })).toBe(true)
    expect(hole.board.canStand({ x: 3, y: 2 })).toBe(true)
  })
})

describe("glass", () => {
  const glass = [{ x: 4, y: 2 }]
  test("a glass wall cannot be stood in and blocks sight", () => {
    const c = fight({ glass })
    expect(c.board.canStand({ x: 4, y: 2 })).toBe(false)
    expect(c.board.hasLineOfSight({ x: 2, y: 2 }, { x: 6, y: 2 })).toBe(false)
    expect(c.board.hasLineOfSight({ x: 2, y: 1 }, { x: 6, y: 1 })).toBe(true)
    expect(new Board(3, 3).glass.size).toBe(0)
  })

  test("nothing can be aimed through it", () => {
    const plain = fight(
      {},
      GROUND,
      ["lyra"],
      ["squalor"],
      [[{ x: 2, y: 2 }], [{ x: 6, y: 2 }]],
    )
    const walled = fight(
      { glass },
      GROUND,
      ["lyra"],
      ["squalor"],
      [[{ x: 2, y: 2 }], [{ x: 6, y: 2 }]],
    )
    const reach = (c: Combat) => {
      const me = c.fighters.find((f) => f.presetId === "lyra")!
      return c
        .actionsOf(me)
        .flatMap((a) =>
          c.getLaunchCells(me, a).filter((p) => p.x === 6 && p.y === 2),
        ).length
    }
    expect(reach(plain)).toBeGreaterThan(0)
    expect(reach(walled)).toBe(0)
  })
})

describe("gel", () => {
  const lake = ["........", "...~~...", "...~~...", "........", "........"]

  test("a frozen fighter loses its turns until it thaws by itself", () => {
    const c = fight(
      { gel: { duration: 25 } },
      GROUND,
      ["brutus"],
      ["squalor"],
      [[{ x: 3, y: 2 }], [{ x: 5, y: 2 }]],
    )
    until(c, "brutus")
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    expect(c.crystal("gel", { x: 7, y: 4 }).ok).toBe(false)
    expect(c.crystal("gel", foe.position).ok).toBe(true)
    expect(c.adventure!.crystals!.isFrozen(foe.id)).toBe(true)
    const events: string[] = []
    let skipped = 0
    for (let i = 0; i < 40 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter?.id === foe.id) events.push("foe-turn")
      if (c.activeFighter) c.pass()
    }
    skipped = c.adventure!.report.gel.thawed.length
    expect(skipped).toBe(1)
    expect(c.adventure!.crystals!.isFrozen(foe.id)).toBe(false)
    expect(events.length).toBeGreaterThan(0)
  })

  test("a frozen fighter never gets to play before the thaw", () => {
    const c = fight(
      { gel: { frozen: [{ team: 1, index: 0, until: 35 }] } },
      GROUND,
    )
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    expect(c.adventure!.report.gel.frozen[0].fighterId).toBe(foe.id)
    let turns = 0
    for (let i = 0; i < 12 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter?.id === foe.id && c.time < 35) turns++
      if (c.activeFighter) c.pass()
    }
    expect(turns).toBe(0)
  })

  test("water freezes into a walkable cell and thaws again", () => {
    const board = Board.fromAscii(lake)
    for (const cell of board.cells)
      if (cell.terrain === "water") cell.elevation = -3
    const c = new Combat({
      seed: 3,
      board,
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "human", fighters: ["squalor"] },
      ],
      positions: [[{ x: 3, y: 0 }], [{ x: 7, y: 4 }]],
      adventure: { clock: { period: 10, limit: 80 }, gel: {} },
    })
    expect(c.board.canStand({ x: 3, y: 1 })).toBe(false)
    until(c, "brutus")
    expect(c.crystal("gel", { x: 3, y: 1 }).ok).toBe(true)
    expect(c.board.canStand({ x: 3, y: 1 })).toBe(true)
    expect(c.adventure!.report.gel.iced).toEqual([{ x: 3, y: 1 }])
    // dry ground does not freeze
    until(c, "brutus")
    expect(c.crystal("gel", { x: 2, y: 0 }).ok).toBe(false)
    expect(c.crystal("thaw", { x: 3, y: 1 }).ok).toBe(true)
    expect(c.board.canStand({ x: 3, y: 1 })).toBe(false)
  })

  test("a neighbour thaws a frozen fighter; the log replays the fight", () => {
    const options = {
      seed: 3,
      board: Board.fromAscii(GROUND),
      teams: [
        { controller: "human" as const, fighters: ["brutus", "lyra"] },
        { controller: "human" as const, fighters: ["squalor"] },
      ],
      positions: [
        [
          { x: 3, y: 2 },
          { x: 3, y: 3 },
        ],
        [{ x: 5, y: 2 }],
      ],
      adventure: {
        clock: { period: 10, limit: 80 },
        gel: { frozen: [{ team: 0, index: 1, until: 999 }] },
      } as AdventureRules,
    }
    const c = new Combat(options)
    until(c, "brutus")
    expect(c.crystal("thaw", { x: 3, y: 3 }).ok).toBe(true)
    expect(c.adventure!.report.gel.thawed).toHaveLength(1)
    const copy = Combat.replay(options, c.log)
    expect(copy.adventure!.report.gel.thawed).toHaveLength(1)
  })
})

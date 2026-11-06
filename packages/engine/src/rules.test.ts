import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"
import { MAX_ENERGY } from "./content"

const GROUND = ["........", "........", "........", "........", "........"]

/** Two human camps facing each other on a plain board. */
function duel(rules: AdventureRules, b = ["squalor"], at = [{ x: 4, y: 2 }]) {
  return new Combat({
    seed: 3,
    board: Board.fromAscii(GROUND),
    teams: [
      { name: "A", controller: "human", fighters: ["brutus"] },
      { name: "B", controller: "human", fighters: b },
    ],
    positions: [[{ x: 3, y: 2 }], at],
    adventure: { clock: { period: 10, limit: 80 }, ...rules },
  })
}

/** Plays until `brutus` can act (the others pass). */
function myTurn(c: Combat) {
  for (let i = 0; i < 40 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter?.presetId === "brutus") return c.activeFighter
    if (c.activeFighter) c.pass()
  }
  return c.activeFighter
}

describe("shy", () => {
  test("a blow from the named team scares the member off, unhurt", () => {
    const c = duel({ shy: [{ team: 1, index: 0, by: [0] }] })
    const foe = c.getFighter("squalor-1-0")!
    const me = myTurn(c)!
    const hp = foe.hp
    expect(c.useAction("kick", foe.position).ok).toBe(true)
    expect(c.departed.has(foe.id)).toBe(true)
    expect(c.adventure?.report.scared).toEqual([foe.id])
    expect(foe.hp).toBeLessThanOrEqual(hp)
    expect(foe.alive).toBe(true)
    expect(me.alive).toBe(true)
  })

  test("a blow from another team, or no rule at all, leaves it there", () => {
    const other = duel({ shy: [{ team: 1, index: 0, by: [2] }] })
    myTurn(other)
    other.useAction("kick", other.getFighter("squalor-1-0")!.position)
    expect(other.departed.size).toBe(0)
    const none = duel({})
    myTurn(none)
    none.useAction("kick", none.getFighter("squalor-1-0")!.position)
    expect(none.departed.size).toBe(0)
    expect(none.adventure?.report.scared).toEqual([])
  })
})

describe("mute", () => {
  test("the Ghom of a muted team starts with a full Élan and never acts", () => {
    const rules: AdventureRules = { mute: [1] }
    const c = duel(rules)
    expect(c.teams[1].energy).toBe(MAX_ENERGY)
    expect(c.teams[0].energy).toBeLessThan(MAX_ENERGY)
    expect(c.adventure?.isMute(1)).toBe(true)
    expect(c.adventure?.isMute(0)).toBe(false)
    expect(duel({}).adventure?.isMute(1)).toBe(false)
  })

  test("its Élan stays full while its AI plays", () => {
    const c = new Combat({
      seed: 3,
      board: Board.fromAscii(GROUND),
      teams: [
        { name: "A", controller: "ai", fighters: ["lyra"] },
        { name: "B", controller: "ai", fighters: ["merlin"] },
      ],
      positions: [[{ x: 1, y: 1 }], [{ x: 6, y: 2 }]],
      adventure: {
        mute: [1],
        clock: { period: 10, limit: 6 },
        noDefeat: [0, 1],
      },
    })
    c.run()
    expect(c.teams[1].energy).toBe(MAX_ENERGY)
    expect(c.adventure?.report.divineUsed).toEqual({})
  })
})

describe("settle", () => {
  /** An Intrication of two camps, made by hand on a cell where `a` stands. */
  function peace(rules: AdventureRules) {
    const c = duel({
      ceasefire: { a: 0, b: 1, after: 99 },
      silent: [{ x: 3, y: 2 }],
      ...rules,
    })
    const a = c.getFighter("brutus-0-0")!
    const b = c.getFighter("squalor-1-0")!
    // the peace is made where the two camps stand together
    b.position = { ...a.position }
    c.adventure!.observe({
      type: "actionUsed",
      fighterId: a.id,
      actionId: "kick",
      baseActionId: "kick",
      partnerId: b.id,
      target: { ...a.position },
      cells: [],
    })
    return { c, a, b }
  }

  test("an Intrication on a silent cell makes the peace and settles the camps named", () => {
    const { c, a, b } = peace({ settle: { teams: [1] } })
    const adv = c.adventure!
    expect(adv.report.peace).toBe(true)
    expect(adv.isSettled(b)).toBe(true)
    expect(adv.isSettled(a)).toBe(false)
    expect(adv.report.settled).toEqual([b.id])
    expect(adv.isEnemy(a, b)).toBe(false)
    expect(adv.report.calm).toBe(false)
  })

  test("with `calm`, the Chaos stops once someone settled", () => {
    const { c } = peace({ settle: { teams: [1], calm: true } })
    expect(c.adventure?.report.calm).toBe(true)
  })

  test("without the rule nobody settles", () => {
    const { c, b } = peace({})
    expect(c.adventure?.isSettled(b)).toBe(false)
    expect(c.adventure?.report.settled).toEqual([])
  })
})

describe("fixIce", () => {
  const ice = (rules: AdventureRules) =>
    duel(
      { fixOnDeath: [1], ...rules },
      ["squalor", "squalor"],
      [
        { x: 4, y: 2 },
        { x: 7, y: 4 },
      ],
    )

  test("a fixed foe is a block that thaws into shallow water after `melt` ticks", () => {
    const c = ice({ fixIce: { melt: 2 } })
    const foe = c.getFighter("squalor-1-0")!
    const at = { ...foe.position }
    foe.hp = 1
    myTurn(c)
    c.useAction("kick", at)
    expect(c.adventure?.report.fixed).toContain(foe.id)
    expect(c.board.get(at)!.elevation).toBe(1)
    expect(c.board.get(at)!.terrain).not.toBe("water")
    c.adventure!.advance(10 * 5)
    expect(c.board.get(at)!.terrain).toBe("water")
    expect(c.board.get(at)!.elevation).toBe(-1)
  })

  test("without it the rock stays", () => {
    const c = ice({})
    const foe = c.getFighter("squalor-1-0")!
    const at = { ...foe.position }
    foe.hp = 1
    myTurn(c)
    c.useAction("kick", at)
    c.adventure!.advance(10 * 5)
    expect(c.board.get(at)!.terrain).not.toBe("water")
    expect(c.board.get(at)!.elevation).toBe(1)
  })
})

describe("decor", () => {
  const rules = {
    decor: {
      crystals: [
        { x: 0, y: 0 },
        { x: 6, y: 4 },
      ],
      toward: { x: 3, y: 0 },
      merge: { x: 3, y: 4 },
      near: 2,
    },
  }

  test("no rule, no decor", () => {
    expect(duel({}).adventure?.decor).toBeNull()
  })

  test("they start where the rule puts them, shining by nothing", () => {
    const d = duel(rules).adventure!.decor!
    expect(d.report.cells).toEqual(rules.decor.crystals)
    expect(d.report.glow).toEqual([0, 0])
    expect(d.report.merged).toBe(false)
  })

  test("an allied Intrication near one makes it glow; the first draws the nearest a step toward the heart", () => {
    const c = duel(rules)
    const d = c.adventure!.decor!
    const me = c.getFighter("brutus-0-0")!
    d.intrication({ x: 1, y: 0 }, me, null)
    expect(d.report.glow).toEqual([1, 0])
    expect(d.report.cells[0]).toEqual({ x: 1, y: 0 })
    // only the first one draws a crystal
    d.intrication({ x: 1, y: 0 }, me, null)
    expect(d.report.glow).toEqual([2, 0])
    expect(d.report.cells[0]).toEqual({ x: 1, y: 0 })
  })

  test("the other camp's Intrications do not count", () => {
    const c = duel(rules)
    const d = c.adventure!.decor!
    d.intrication({ x: 1, y: 0 }, c.getFighter("squalor-1-0")!, null)
    expect(d.report.glow).toEqual([0, 0])
    expect(d.report.cells[0]).toEqual({ x: 0, y: 0 })
  })

  test("the dark member's Intrication makes them beat, once", () => {
    const c = duel({
      decor: { ...rules.decor, dark: { team: 1, index: 0 } },
    })
    const d = c.adventure!.decor!
    const me = c.getFighter("brutus-0-0")!
    d.intrication({ x: 5, y: 4 }, me, "squalor-1-0")
    expect(d.report.pulsed).toBe(true)
    d.intrication({ x: 5, y: 4 }, me, "squalor-1-0")
    expect(d.report.pulsed).toBe(true)
  })

  test("at the end they all fuse in one place", () => {
    const c = duel(rules)
    const d = c.adventure!.decor!
    d.end()
    expect(d.report.merged).toBe(true)
    expect(d.report.mergedAt).toEqual({ x: 3, y: 4 })
    expect(d.report.cells).toEqual([
      { x: 3, y: 4 },
      { x: 3, y: 4 },
    ])
    d.end()
    expect(d.report.cells).toHaveLength(2)
  })

  test("the fight's end fuses them (through the combat's events)", () => {
    const c = duel({ ...rules, noDefeat: [] })
    c.getFighter("squalor-1-0")!.hp = 1
    myTurn(c)
    c.useAction("kick", c.getFighter("squalor-1-0")!.position)
    expect(c.state).toBe("ended")
    expect(c.adventure?.report.decor?.merged).toBe(true)
  })
})

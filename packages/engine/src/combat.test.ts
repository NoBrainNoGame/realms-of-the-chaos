import { describe, expect, test } from "bun:test"
import { Board } from "./board"
import {
  Combat,
  type CombatOptions,
  ENERGY_PERIOD,
  MIN_ENEMY_SPAWN_DISTANCE,
} from "./combat"
import { MAX_FIGHTERS_PER_CELL } from "./content"
import { equals, keyOf, manhattan, type Point } from "./geometry"
import type { FightEvent, Fighter } from "./types"

const open = (w = 9, h = 9) => new Board(w, h)

function setup(
  fighters: [string, Point][][],
  board: Board = open(),
  extra: Partial<CombatOptions> = {},
) {
  return new Combat({
    seed: 1,
    board,
    teams: fighters.map((team) => ({
      controller: "human",
      fighters: team.map(([id]) => id),
    })),
    positions: fighters.map((team) => team.map(([, p]) => p)),
    ...extra,
  })
}

/** Make `fighter` the next one to play and run until its turn. */
function turnOf(combat: Combat, fighter: Fighter) {
  for (const f of combat.fighters) {
    if (f !== fighter)
      f.nextActionAt = Math.max(f.nextActionAt, combat.time + 500)
  }
  fighter.nextActionAt = combat.time
  const events = combat.run()
  expect(combat.state).toBe("awaitingInput")
  expect(combat.activeFighter).toBe(fighter)
  return events
}

const ofType = <T extends FightEvent["type"]>(events: FightEvent[], type: T) =>
  events.filter((e): e is Extract<FightEvent, { type: T }> => e.type === type)

describe("setup", () => {
  test("rejects invalid team counts and unknown characters", () => {
    expect(
      () => new Combat({ teams: [{ controller: "ai", fighters: ["eva"] }] }),
    ).toThrow()
    expect(
      () =>
        new Combat({
          teams: [
            { controller: "ai", fighters: ["nobody"] },
            { controller: "ai", fighters: ["eva"] },
          ],
        }),
    ).toThrow()
  })

  test("random placement keeps enemies apart, in the walkable region", () => {
    for (let seed = 0; seed < 20; seed++) {
      const combat = new Combat({
        seed,
        teams: [
          { controller: "ai", fighters: ["eva", "merlin", "brutus"] },
          { controller: "ai", fighters: ["gorr", "nyx", "lyra"] },
        ],
      })
      for (const a of combat.fighters) {
        expect(combat.walkableRegion.has(keyOf(a.position))).toBe(true)
        for (const b of combat.fighters) {
          if (a === b) continue
          expect(equals(a.position, b.position)).toBe(false)
          if (a.team !== b.team) {
            expect(manhattan(a.position, b.position)).toBeGreaterThanOrEqual(
              MIN_ENEMY_SPAWN_DISTANCE,
            )
          }
        }
      }
    }
  })

  test("same seed, same fight", () => {
    const make = () =>
      new Combat({
        seed: 7,
        teams: [
          { controller: "ai", fighters: ["eva", "brutus"] },
          { controller: "ai", fighters: ["merlin", "gorr"] },
        ],
      })
    expect(make().run()).toEqual(make().run())
  })

  test("duplicate characters get distinct names", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["eva", { x: 0, y: 1 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    expect(combat.fighters.map((f) => f.name)).toEqual(["Eva", "Eva 2", "Gorr"])
  })
})

describe("timeline", () => {
  test("the fighter with the lowest time plays first and waits for input", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    eva.nextActionAt = 5
    gorr.nextActionAt = 10
    const events = combat.run()
    expect(ofType(events, "turnStarted")[0].fighterId).toBe(eva.id)
    expect(combat.activeFighter).toBe(eva)
    expect(combat.time).toBe(5)
  })

  test("faster fighters get more turns", () => {
    const combat = setup([
      [["nyx", { x: 0, y: 0 }]], // speed 8
      [["gorr", { x: 1, y: 0 }]], // speed 4
    ])
    const turns: Record<string, number> = {}
    for (let i = 0; i < 30 && combat.state !== "ended"; i++) {
      combat.run()
      const active = combat.activeFighter!
      turns[active.presetId] = (turns[active.presetId] ?? 0) + 1
      const enemy = combat.fighters.find((f) => f !== active)!
      expect(combat.useAction("kick", enemy.position).ok).toBe(true)
    }
    expect(turns.nyx).toBeGreaterThan(turns.gorr * 1.6)
  })

  test("passing hands the turn over without skipping anyone", () => {
    const combat = setup([
      [["nyx", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const order: string[] = []
    for (let i = 0; i < 6; i++) {
      combat.run()
      order.push(combat.activeFighter!.presetId)
      combat.pass()
    }
    // passing always lets the other one play next
    for (let i = 1; i < order.length; i++)
      expect(order[i]).not.toBe(order[i - 1])
  })

  test("passing plays again just after the next fighter", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    gorr.nextActionAt = combat.time + 3
    combat.pass()
    expect(eva.nextActionAt).toBeCloseTo(gorr.nextActionAt + 1)
    combat.run()
    expect(combat.activeFighter).toBe(gorr)
  })

  test("passing hands the turn to the next opponent, never to an ally", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["brutus", { x: 0, y: 1 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, brutus, gorr] = combat.fighters
    turnOf(combat, eva)
    brutus.nextActionAt = combat.time + 2 // the ally is next...
    gorr.nextActionAt = combat.time + 10 // ...but eva waits for the opponent
    combat.pass()
    expect(eva.nextActionAt).toBeCloseTo(gorr.nextActionAt + 1)
  })

  test("allies cannot stall the opponent by passing to each other", () => {
    const combat = new Combat({
      seed: 3,
      teams: [
        { controller: "human", fighters: ["eva", "brutus"] },
        { controller: "ai", fighters: ["nyx", "nerea"] },
      ],
    })
    combat.run()
    // the human team gets a turn early, before the AI could farm energy
    expect(combat.activeFighter?.team).toBe(0)
    expect(combat.time).toBeLessThan(40)
  })

  test("passing never costs more than an action", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    gorr.nextActionAt = combat.time + 1000
    const before = combat.time
    combat.pass()
    expect(eva.nextActionAt - before).toBeCloseTo(combat.baseDelay(eva))
  })

  test("commands are refused when nobody waits for input", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    expect(combat.pass().ok).toBe(false)
  })

  test("timeline order is sorted by next action time", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["brutus", { x: 0, y: 1 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, brutus, gorr] = combat.fighters
    eva.nextActionAt = 30
    brutus.nextActionAt = 10
    gorr.nextActionAt = 20
    expect(combat.timelineOrder()).toEqual([brutus, gorr, eva])
  })
})

describe("movement", () => {
  test("setting a destination is free and steps happen one cell at a time", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)

    const result = combat.moveTo({ x: 3, y: 0 })
    expect(result.ok).toBe(true)
    expect(combat.activeFighter).toBe(eva) // still her turn
    expect(eva.position).toEqual({ x: 0, y: 0 })

    combat.pass()
    gorr.nextActionAt = 10_000
    const events = combat.run()
    const moves = ofType(events, "moved").filter((e) => e.fighterId === eva.id)
    expect(moves.length).toBe(3)
    for (const move of moves) expect(manhattan(move.from, move.to)).toBe(1)
    expect(eva.position).toEqual({ x: 3, y: 0 })
    expect(eva.waypoints).toEqual([])
  })

  test("a walk can be planned through stops, and cancelled", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)

    // straight to (3,0), then forced through (0,3) on the way to (3,3)
    expect(combat.moveTo({ x: 0, y: 3 }).ok).toBe(true)
    expect(combat.moveTo({ x: 3, y: 3 }, true).ok).toBe(true)
    expect(eva.waypoints).toEqual([
      { x: 0, y: 3 },
      { x: 3, y: 3 },
    ])
    expect(eva.path.length).toBe(6)
    expect(eva.path[2]).toEqual({ x: 0, y: 3 })
    expect(combat.log.at(-1)).toMatchObject({ type: "moveTo", append: true })
    expect(combat.planWalk(eva, { x: 4, y: 3 }, true)!.length).toBe(7)
    expect(combat.planWalk(eva, { x: 4, y: 3 })!.length).toBe(7)
    expect(eva.path.length).toBe(6) // a preview plans nothing

    // a new destination without append replaces the walk
    combat.moveTo({ x: 2, y: 0 })
    expect(eva.waypoints).toEqual([{ x: 2, y: 0 }])
    // cancelled: a walk to where she stands
    combat.moveTo(eva.position)
    expect(eva.waypoints).toEqual([])
    expect(eva.path).toEqual([])

    combat.moveTo({ x: 0, y: 3 })
    combat.moveTo({ x: 3, y: 3 }, true)
    combat.pass()
    gorr.nextActionAt = 10_000
    eva.nextActionAt = 10_000
    const seen: string[] = []
    while (eva.path.length > 0) {
      combat.advance()
      seen.push(`${eva.position.x},${eva.position.y}`)
    }
    expect(seen).toContain("0,3")
    expect(eva.position).toEqual({ x: 3, y: 3 })
    expect(eva.waypoints).toEqual([])
  })

  test("steps are spaced by the step delay and water is slower", () => {
    const board = Board.fromAscii([".~~......"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 8, y: 0 }]]],
      board,
    )
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    combat.moveTo({ x: 3, y: 0 })
    combat.pass()
    gorr.nextActionAt = 10_000
    eva.nextActionAt = 10_000

    const times: number[] = []
    while (eva.path.length > 0) {
      combat.advance()
      times.push(combat.time)
    }
    const ground = combat.baseStepDelay(eva) * 0.4
    // first step is immediate, then each step waits for the previous cell's cost
    expect(times[1] - times[0]).toBeCloseTo(ground * 2) // entered water
    expect(times[2] - times[1]).toBeCloseTo(ground * 2) // entered water again
  })

  test("enemies block paths but allies can be crossed", () => {
    const board = Board.fromAscii([
      "#.#", //
      "...",
      "#.#",
    ])
    const combat = setup(
      [
        [
          ["eva", { x: 1, y: 0 }],
          ["brutus", { x: 1, y: 1 }],
        ],
        [["gorr", { x: 1, y: 2 }]],
      ],
      board,
    )
    const [eva, , gorr] = combat.fighters
    turnOf(combat, eva)
    expect(combat.moveTo({ x: 0, y: 1 }).ok).toBe(true) // through Brutus
    expect(combat.canEnter(eva, gorr.position)).toBe(false)
    expect(combat.moveTo({ x: 1, y: 2 }).ok).toBe(false)
  })

  test("a cell holds at most 3 allies", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
        ["lyra", { x: 1, y: 0 }],
        ["nyx", { x: 1, y: 0 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva] = combat.fighters
    expect(MAX_FIGHTERS_PER_CELL).toBe(3)
    expect(combat.canEnter(eva, { x: 1, y: 0 })).toBe(false)
  })

  test("a blocked path is recomputed, or dropped when impossible", () => {
    const board = Board.fromAscii([".....", "....."])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 4, y: 1 }]]],
      board,
    )
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    combat.moveTo({ x: 4, y: 0 })
    combat.pass()
    gorr.nextActionAt = 10_000
    eva.nextActionAt = 10_000
    gorr.position = { x: 2, y: 0 } // enemy steps in the way
    combat.run(50)
    expect(eva.position).toEqual({ x: 4, y: 0 })
  })
})

describe("actions", () => {
  test("out of range or without line of sight is refused", () => {
    const board = Board.fromAscii([".#......."])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 2, y: 0 }]]],
      board,
    )
    const [eva] = combat.fighters
    turnOf(combat, eva)
    const blocked = combat.useAction("arrow", { x: 2, y: 0 })
    expect(blocked).toEqual({ ok: false, reason: "Cible hors de portée" })
    expect(combat.activeFighter).toBe(eva)
  })

  test("an attack deals damage, ends the turn and costs time", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 3, y: 0 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    const start = combat.time
    const result = combat.useAction("arrow", gorr.position)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const damage = ofType(result.events, "damaged")[0]
    expect(damage.fighterId).toBe(gorr.id)
    expect(gorr.hp).toBe(combat.baseMaxHp(gorr) - damage.amount)
    expect(combat.activeFighter).toBeNull()
    expect(eva.nextActionAt).toBeCloseTo(start + combat.baseDelay(eva))
  })

  test("damage formula uses attack and defense", () => {
    const combat = setup([
      [["brutus", { x: 0, y: 0 }]],
      [["merlin", { x: 1, y: 0 }]],
    ])
    const [brutus, merlin] = combat.fighters
    // 7 * (1 + 8/10) * 10/(10+3) = 9.69
    expect(combat.estimateDamage(brutus, merlin, "physical", 7)).toBe(10)
    // golem defense reduces more
    expect(combat.estimateDamage(merlin, brutus, "physical", 7)).toBeLessThan(
      10,
    )
  })

  test("cooldowns block reuse for N own turns", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 3, y: 0 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    expect(combat.useAction("poisonArrow", gorr.position).ok).toBe(true)

    turnOf(combat, eva)
    expect(combat.useAction("poisonArrow", gorr.position).ok).toBe(false)
    combat.pass()
    turnOf(combat, eva)
    expect(combat.useAction("poisonArrow", gorr.position).ok).toBe(false)
    combat.pass()
    turnOf(combat, eva)
    expect(combat.useAction("poisonArrow", gorr.position).ok).toBe(true)
  })

  test("poison deals damage at the start of each turn and expires", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 3, y: 0 }]],
    ])
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    combat.useAction("poisonArrow", gorr.position)
    expect(combat.hasStatus(gorr, "poisoned")).toBe(true)

    const ticks: number[] = []
    for (let i = 0; i < 4; i++) {
      const events = turnOf(combat, gorr)
      ticks.push(
        ofType(events, "damaged").filter(
          (e) => e.fighterId === gorr.id && e.sourceId === null,
        ).length,
      )
      combat.pass()
    }
    expect(ticks).toEqual([1, 1, 1, 0])
    expect(combat.hasStatus(gorr, "poisoned")).toBe(false)
  })

  test("slowed fighters wait longer", () => {
    const combat = setup([
      [["merlin", { x: 0, y: 0 }]],
      [["eva", { x: 3, y: 0 }]],
    ])
    const [merlin, eva] = combat.fighters
    turnOf(combat, merlin)
    combat.useAction("frost", eva.position)
    turnOf(combat, eva)
    const start = combat.time
    expect(combat.useAction("arrow", merlin.position).ok).toBe(true)
    expect(eva.nextActionAt - start).toBeCloseTo(combat.baseDelay(eva) * 1.5)
  })

  test("shields absorb damage before hit points", () => {
    const combat = setup([
      [
        ["lyra", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
      ],
      [["eva", { x: 4, y: 0 }]],
    ])
    const [lyra, brutus, eva] = combat.fighters
    turnOf(combat, lyra)
    expect(combat.useAction("aegis", brutus.position).ok).toBe(true)
    turnOf(combat, eva)
    const result = combat.useAction("arrow", brutus.position)
    if (!result.ok) throw new Error(result.reason)
    const hit = ofType(result.events, "damaged")[0]
    expect(hit.absorbed).toBeGreaterThan(0)
    expect(brutus.hp).toBe(combat.maxHp(brutus) - hit.amount)
  })

  test("push moves the target and hurts on collision", () => {
    const board = Board.fromAscii(["....#...."])
    const combat = setup(
      [[["brutus", { x: 1, y: 0 }]], [["gorr", { x: 2, y: 0 }]]],
      board,
    )
    const [brutus, gorr] = combat.fighters
    turnOf(combat, brutus)
    const result = combat.useAction("shieldBash", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    expect(gorr.position).toEqual({ x: 3, y: 0 })
    const hits = ofType(result.events, "damaged")
    expect(hits).toHaveLength(2) // bash + collision with the wall
    expect(hits[1].amount).toBe(3)
  })

  test("fireball hits allies too", () => {
    const combat = setup([
      [
        ["merlin", { x: 0, y: 0 }],
        ["brutus", { x: 4, y: 0 }],
      ],
      [["gorr", { x: 3, y: 0 }]],
    ])
    const [merlin, brutus, gorr] = combat.fighters
    turnOf(combat, merlin)
    const result = combat.useAction("fireball", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    const hit = ofType(result.events, "damaged").map((e) => e.fighterId)
    expect(hit).toContain(gorr.id)
    expect(hit).toContain(brutus.id)
  })

  test("heal is capped at max hp", () => {
    const combat = setup([
      [
        ["lyra", { x: 0, y: 0 }],
        ["brutus", { x: 1, y: 0 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [lyra, brutus] = combat.fighters
    brutus.hp = combat.maxHp(brutus) - 3
    turnOf(combat, lyra)
    const result = combat.useAction("heal", brutus.position)
    if (!result.ok) throw new Error(result.reason)
    expect(ofType(result.events, "healed")[0].amount).toBe(3)
    expect(brutus.hp).toBe(combat.maxHp(brutus))
  })

  test("leap moves onto an empty cell", () => {
    const combat = setup([
      [["nyx", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [nyx] = combat.fighters
    turnOf(combat, nyx)
    expect(combat.useAction("leap", { x: 0, y: 3 }).ok).toBe(true)
    expect(nyx.position).toEqual({ x: 0, y: 3 })
  })

  test("tremor delays adjacent enemies only", () => {
    const combat = setup([
      [["gorr", { x: 4, y: 4 }]],
      [
        ["eva", { x: 4, y: 5 }],
        ["merlin", { x: 8, y: 8 }],
      ],
    ])
    const [gorr, eva, merlin] = combat.fighters
    turnOf(combat, gorr)
    const evaBefore = eva.nextActionAt
    const merlinBefore = merlin.nextActionAt
    combat.useAction("tremor", gorr.position)
    expect(eva.nextActionAt).toBe(evaBefore + 15)
    expect(merlin.nextActionAt).toBe(merlinBefore)
  })

  test("high ground gives +1 range to ranged actions", () => {
    const board = Board.fromAscii(["^........"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 7, y: 0 }]]],
      board,
    )
    const [eva, gorr] = combat.fighters
    turnOf(combat, eva)
    expect(combat.useAction("arrow", gorr.position).ok).toBe(true)
  })

  test("killing the last enemy ends the fight", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["merlin", { x: 3, y: 0 }]],
    ])
    const [eva, merlin] = combat.fighters
    merlin.hp = 1
    turnOf(combat, eva)
    const result = combat.useAction("arrow", merlin.position)
    if (!result.ok) throw new Error(result.reason)
    expect(ofType(result.events, "died")).toHaveLength(1)
    expect(combat.state).toBe("ended")
    expect(combat.winnerTeam).toBe(0)
    expect(combat.run()).toEqual([])
  })
})

describe("divine actions", () => {
  test("energy flows with time (not with turns) and pays for divine actions", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, gorr] = combat.fighters
    // start: 1 energy each; +1 per ENERGY_PERIOD of timeline time
    eva.nextActionAt = ENERGY_PERIOD * 2 + 1
    gorr.nextActionAt = 500
    combat.run()
    expect(combat.activeFighter).toBe(eva)
    expect(combat.teams[0].energy).toBe(3)
    expect(combat.teams[1].energy).toBe(3)
    combat.teams[0].energy = 2
    expect(combat.useDivine("timeWarp", gorr.position).ok).toBe(false)
    combat.teams[0].energy = 3
    const before = gorr.nextActionAt
    expect(combat.useDivine("timeWarp", gorr.position).ok).toBe(true)
    expect(gorr.nextActionAt).toBe(before + 25)
    expect(combat.teams[0].energy).toBe(0)
    expect(combat.activeFighter).toBe(eva) // free action
  })

  test("earthquake raises a rock but never splits the board", () => {
    const board = Board.fromAscii([".....", "#.###"])
    const combat = setup(
      [[["eva", { x: 0, y: 0 }]], [["gorr", { x: 4, y: 0 }]]],
      board,
    )
    const [eva] = combat.fighters
    turnOf(combat, eva)
    combat.teams[0].energy = 6
    expect(combat.useDivine("earthquake", { x: 2, y: 0 })).toEqual({
      ok: false,
      reason: "Le terrain serait coupé en deux",
    })
    expect(combat.useDivine("earthquake", { x: 2, y: 1 }).ok).toBe(true)
    expect(combat.board.get({ x: 2, y: 1 })!.terrain).toBe("ground")
  })

  test("blessing heals the whole team", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["brutus", { x: 0, y: 1 }],
      ],
      [["gorr", { x: 8, y: 8 }]],
    ])
    const [eva, brutus] = combat.fighters
    eva.hp -= 20
    brutus.hp -= 20
    turnOf(combat, eva)
    combat.teams[0].energy = 5
    combat.useDivine("blessing")
    expect(eva.hp).toBe(combat.maxHp(eva) - 12)
    expect(brutus.hp).toBe(combat.maxHp(brutus) - 12)
  })
})

describe("full AI fights", () => {
  const rosters = [
    [
      ["eva", "merlin"],
      ["gorr", "nyx"],
    ],
    [
      ["brutus", "lyra", "eva"],
      ["gorr", "merlin", "nyx"],
    ],
    [["nyx"], ["eva"], ["brutus"]],
    [["merlin", "lyra"], ["eva", "brutus"], ["gorr"], ["nyx"]],
  ]

  for (const [index, roster] of rosters.entries()) {
    for (let seed = 0; seed < 10; seed++) {
      test(`roster ${index} seed ${seed} ends with a winner and keeps invariants`, () => {
        const combat = new Combat({
          seed,
          teams: roster.map((fighters) => ({ controller: "ai", fighters })),
        })

        for (let i = 0; i < 20_000 && combat.state === "running"; i++) {
          combat.advance()
          for (const f of combat.fighters) {
            expect(f.hp).toBeGreaterThanOrEqual(0)
            expect(f.hp).toBeLessThanOrEqual(combat.maxHp(f))
            if (!f.alive) continue
            expect(combat.regionFor(f.locomotion).has(keyOf(f.position))).toBe(
              true,
            )
            expect(combat.board.canStand(f.position, f.locomotion)).toBe(true)
            const others = combat.fightersAt(f.position)
            expect(others.length).toBeLessThanOrEqual(MAX_FIGHTERS_PER_CELL)
            expect(others.every((o) => o.team === f.team)).toBe(true)
          }
        }

        expect(combat.state).toBe("ended")
        expect(combat.winnerTeam).not.toBeNull()
        const survivors = combat.aliveFighters
        expect(survivors.every((f) => f.team === combat.winnerTeam)).toBe(true)
      })
    }
  }
})

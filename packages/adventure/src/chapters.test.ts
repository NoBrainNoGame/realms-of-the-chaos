import { describe, expect, test } from "bun:test"
import {
  activeEncounters,
  type Carry,
  CHAPTERS,
  choose,
  ERAS,
  enter,
  examine,
  explorationOf,
  exploring,
  type FightReport,
  finishFight,
  frame,
  next,
  overcome,
  pending,
  type Run,
  START_CARRY,
  startChapter,
  validateChapter,
  wanderFight,
} from "./index"

describe("chapters", () => {
  test("ids are unique and ordered", () => {
    const ids = CHAPTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ERAS[0].chapters).toEqual(ids)
  })
  for (const c of CHAPTERS)
    test(`chapter ${c.id} "${c.title}" is valid`, () => {
      expect(validateChapter(c)).toEqual([])
    })
})

describe("playthroughs", () => {
  const report = (n: number): FightReport => ({
    result: "victory",
    ticks: 12,
    divineUsed: n % 2 ? { earthquake: 1 } : {},
    divineNearAlly: [],
    intrications: n % 3,
    fled: [],
    timeUp: false,
    zonesLost: [],
    zoneStates: {},
    fixed: [],
    fighters: [],
  })

  /** Plays a chapter with pseudo-random gestures; returns the final run. */
  function play(chapter: string, seed: number, carry?: Carry): Run {
    let rng = seed * 7919 + 13
    const roll = (n: number) => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff
      return rng % n
    }
    let run = startChapter(chapter, carry, seed)
    for (let step = 0; step < 5000; step++) {
      const f = frame(run)
      if (f.kind === "done") return run
      if (f.kind === "choice")
        run = choose(run, f.options[roll(f.options.length)].id)
      else if (f.kind === "hub")
        run = choose(run, f.topics[roll(f.topics.length)].id)
      else if (f.kind === "fight") {
        const lost = run.retries === 0 && roll(4) === 0
        run = finishFight(
          run,
          lost ? { ...report(seed), result: "defeat" } : report(seed + step),
        ).run
      } else run = next(run)
    }
    throw new Error(`${chapter} (seed ${seed}) did not end`)
  }

  test("every chapter ends whatever the choices, and runs are serialisable", () => {
    for (const c of CHAPTERS) {
      for (let seed = 1; seed <= 25; seed++) {
        const run = play(c.id, seed)
        expect(run.done).toBe(true)
        expect(JSON.parse(JSON.stringify(run))).toEqual(run)
      }
    }
  })

  test("the era plays through, chapter after chapter", () => {
    let carry: Carry | undefined
    for (const c of CHAPTERS) {
      const run = play(c.id, 3, carry)
      carry = {
        flags: run.flags,
        items: run.items,
        team: run.team,
        unlocks: run.unlocks,
      }
    }
    expect(carry).toBeDefined()
  })

  test("the same choices give the same story", () => {
    expect(play("3", 9)).toEqual(play("3", 9))
  })
})

describe("exploration", () => {
  test("the walked chapters have a place for every scene, inside the island", () => {
    const walked = CHAPTERS.filter((c) => c.exploration)
    expect(walked.map((c) => c.id)).toEqual(["prologue", "1"])
    for (const c of walked) expect(validateChapter(c)).toEqual([])
  })

  test("the story waits on its encounter until the hero enters", () => {
    let run = startChapter("1", START_CARRY, 3)
    expect(exploring(run)).toBe(true)
    expect(pending(run)?.id).toBe("borne")
    expect(activeEncounters(run).some((e) => e.id === "errant")).toBe(true)
    run = enter(run)
    expect(exploring(run)).toBe(false)
    // reading until the next scene hands the island back
    for (let i = 0; i < 50 && !exploring(run) && !run.done; i++) {
      const f = frame(run)
      run = f.kind === "choice" ? choose(run, f.options[0].id) : next(run)
    }
    expect(run.node).toBe("lyra")
    expect(exploring(run)).toBe(true)
  })

  test("examining counts once, overcoming a wanderer counts once", () => {
    const run = startChapter("1", START_CARRY, 3)
    const a = examine(run, "herbe_grise")
    expect(a.first).toBe(true)
    expect(a.run.flags.ecoute).toBe(1)
    const b = examine(a.run, "herbe_grise")
    expect(b.first).toBe(false)
    expect(b.run.flags.ecoute).toBe(1)
    const c = overcome(b.run, "errant")
    expect(c.flags.ecoute).toBe(2)
    expect(activeEncounters(c).some((e) => e.id === "errant")).toBe(false)
    expect(overcome(c, "errant").flags.ecoute).toBe(2)
  })

  test("a fight with a wanderer is cut out of the island, places kept", () => {
    const run = startChapter("1", START_CARRY, 3)
    const e = activeEncounters(run).find((x) => x.id === "errant")!
    const ex = explorationOf(run)!
    const spec = wanderFight(ex.island, e, { x: 7, y: 7 }, [
      { preset: "@hero", at: { x: 5, y: 6 } },
    ])
    expect(spec.board.length).toBeLessThanOrEqual(9)
    const hero = spec.teams[0].fighters[0].at
    const foe = spec.teams[1].fighters[0].at
    expect(foe.x - hero.x).toBe(2)
    expect(foe.y - hero.y).toBe(1)
    expect(hero.x).toBeLessThan(spec.board[0].length)
  })
})

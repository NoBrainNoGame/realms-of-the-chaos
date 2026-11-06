import { describe, expect, test } from "bun:test"
import {
  type Carry,
  CHAPTERS,
  choose,
  ERAS,
  type FightReport,
  finishFight,
  frame,
  next,
  type Run,
  startChapter,
  validateChapter,
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

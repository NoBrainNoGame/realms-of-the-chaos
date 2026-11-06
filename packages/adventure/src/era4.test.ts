import { describe, expect, test } from "bun:test"
import { Board, CHARACTERS } from "@realms/engine"
import { ERA4_CHAPTERS } from "./chapters/era4"
import {
  type Carry,
  chapterById,
  choose,
  type FightReport,
  finishFight,
  frame,
  next,
  type Run,
  startChapter,
  useChapters,
  validateChapter,
} from "./index"

const lookup = (id: string) =>
  ERA4_CHAPTERS.find((c) => c.id === id) ?? chapterById(id)
useChapters(lookup)

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

const CARRY: Carry = {
  flags: {},
  items: [],
  team: [],
  unlocks: [],
}
void CARRY

describe("era IV chapters", () => {
  test("ids and order", () => {
    expect(ERA4_CHAPTERS.map((c) => c.id)).toEqual(
      ["19", "20", "21", "22", "23", "24"].slice(0, ERA4_CHAPTERS.length),
    )
  })
  for (const c of ERA4_CHAPTERS)
    test(`chapter ${c.id} "${c.title}" is valid`, () => {
      expect(validateChapter(c)).toEqual([])
    })

  function play(chapter: string, seed: number, mode: "mixed" | "win" | "lose") {
    let rng = seed * 7919 + 13
    const roll = (n: number) => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff
      return rng % n
    }
    let run: Run = startChapter(chapter, undefined, seed)
    let fights = 0
    const lines: string[] = []
    for (let step = 0; step < 5000; step++) {
      const f = frame(run)
      if (f.kind === "done") return { run, fights, lines }
      if (f.kind === "choice")
        run = choose(run, f.options[roll(f.options.length)].id)
      else if (f.kind === "hub")
        run = choose(run, f.topics[roll(f.topics.length)].id)
      else if (f.kind === "fight") {
        fights++
        const lost = mode === "lose" || (mode === "mixed" && roll(3) === 0)
        run = finishFight(
          run,
          lost ? { ...report(seed), result: "defeat" } : report(seed + step),
        ).run
      } else {
        if (f.kind === "line") lines.push(f.text)
        run = next(run)
      }
    }
    throw new Error(`${chapter} (seed ${seed}) did not end`)
  }

  for (const c of ERA4_CHAPTERS) {
    test(`chapter ${c.id} ends, winning, losing or mixed`, () => {
      for (const mode of ["win", "lose", "mixed"] as const)
        for (let seed = 1; seed <= 15; seed++) {
          const { run } = play(c.id, seed, mode)
          expect(run.done).toBe(true)
          expect(run.flags.defaite ?? false).toBe(false)
          expect(JSON.parse(JSON.stringify(run))).toEqual(run)
        }
    })
    test(`chapter ${c.id}: a lost fight is written, the story goes on`, () => {
      const { run, fights } = play(c.id, 4, "lose")
      const hasFight = JSON.stringify(c).includes('"t":"fight"')
      expect(fights > 0).toBe(hasFight)
      expect(run.retries).toBe(fights)
      if (hasFight) expect(Number(run.flags.usure ?? 0)).toBeGreaterThan(0)
    })
    test(`chapter ${c.id}: the island is walkable`, () => {
      const ex = c.exploration
      expect(ex).toBeDefined()
      if (!ex) return
      const board = Board.fromAscii(ex.island)
      const reach = board.regionOf(ex.start)
      expect(board.canStand(ex.start)).toBe(true)
      for (const e of ex.encounters) {
        expect([e.id, board.canStand(e.at)]).toEqual([e.id, true])
        const cells = e.zone ?? [e.at, ...board.neighbors(e.at)]
        expect([e.id, cells.some((p) => reach.has(`${p.x},${p.y}`))]).toEqual([
          e.id,
          true,
        ])
      }
      for (const w of ex.companions ?? [])
        expect(Object.keys(CHARACTERS)).toContain(w)
    })
  }
})

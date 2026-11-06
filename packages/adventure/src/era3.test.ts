import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Board } from "@realms/engine"
import { ERA3_CHAPTERS, ERA3_GROWTH, era3Chapter } from "./chapters/era3"
import { FLAGS } from "./flags"
import {
  type Carry,
  chapterById,
  choose,
  type FightReport,
  finishFight,
  frame,
  next,
  type Run,
  START_CARRY,
  startChapter,
  useChapters,
  validateChapter,
} from "./index"

// A line written only for the defeat branch of each chapter.
const DEFEAT_LINES: Record<string, string> = {
  "13": "le Sonneur lève son diapason",
  "14": "Les hallebardes se resserrent. Le héros est figé",
  "15": "Le Golem frappe. La Chambre s'effondre",
  "16": "Le Golem frappe, et le héros se disperse",
  "17": "Le héros se disperse sur le verre",
  "18": "Le sol glisse. Le héros tombe",
}

const lookup = (id: string) => era3Chapter(id) ?? chapterById(id)
const previous = chapterById
beforeAll(() => useChapters(lookup))
afterAll(() => useChapters(previous))

const report = (n: number, result: FightReport["result"]): FightReport => ({
  result,
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

function play(
  id: string,
  seed: number,
  mode: "win" | "lose",
  carry?: Carry,
  pick: "random" | "first" | "last" = "random",
): { run: Run; lines: string[]; fights: number } {
  let rng = seed * 7919 + 13
  const roll = (n: number) => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng % n
  }
  const at = (n: number) =>
    pick === "first" ? 0 : pick === "last" ? n - 1 : roll(n)
  let run = startChapter(id, carry, seed)
  const lines: string[] = []
  let fights = 0
  for (let step = 0; step < 5000 && !run.done; step++) {
    const f = frame(run)
    if (f.kind === "done") break
    if (f.kind === "choice")
      run = choose(run, f.options[at(f.options.length)].id)
    else if (f.kind === "hub")
      run = choose(run, f.topics[at(f.topics.length)].id)
    else if (f.kind === "fight") {
      fights++
      run = finishFight(
        run,
        report(step, mode === "lose" ? "defeat" : "victory"),
      ).run
    } else {
      if (f.kind === "line") lines.push(f.text)
      run = next(run)
    }
  }
  return { run, lines, fights }
}

const CARRIES: Carry[] = [
  START_CARRY,
  {
    ...START_CARRY,
    flags: {
      ...START_CARRY.flags,
      "confiance.lyra": 4,
      "confiance.eva": 3,
      "confiance.squalor": 3,
      "confiance.brutus": 3,
      "confiance.gorr": 3,
      "confiance.chroniqueur": 3,
      "lacunaire.forme": "recif",
      chroniqueur_rejoint: true,
      merlin_convaincu: true,
      gorr_question: true,
      premier_cristal: "sauve",
    },
  },
]

describe("era III", () => {
  test("growth rows name items given by the chapters, none missing", () => {
    const given = new Set<string>()
    const scan = (x: unknown) => {
      if (Array.isArray(x)) x.forEach(scan)
      else if (x && typeof x === "object") {
        const o = x as Record<string, unknown>
        if (o.t === "give" && typeof o.item === "string") given.add(o.item)
        if (o.give && typeof o.give === "string") given.add(o.give)
        Object.values(o).forEach(scan)
      }
    }
    for (const c of ERA3_CHAPTERS) scan(JSON.parse(JSON.stringify(c.scenes)))
    for (const k of given)
      expect([k, ERA3_GROWTH[k] !== undefined]).toEqual([k, true])
    for (const k of Object.keys(ERA3_GROWTH))
      expect([k, given.has(k)]).toEqual([k, true])
  })
  test("flags used are registered", () => {
    for (const k of ["vitrelle_evacues", "cristal_rendu", "merlin_convaincu"])
      expect(FLAGS[k]).toBeDefined()
  })
})

describe("era III chapters", () => {
  for (const c of ERA3_CHAPTERS) {
    describe(`chapter ${c.id} "${c.title}"`, () => {
      test("is valid", () => {
        expect(validateChapter(c)).toEqual([])
      })

      test("plays to the end, winning every fight", () => {
        for (const carry of CARRIES)
          for (const pick of ["first", "last", "random"] as const)
            for (let seed = 1; seed <= 12; seed++) {
              const { run } = play(c.id, seed, "win", carry, pick)
              expect(run.done).toBe(true)
              expect(Number(run.flags.defaite ?? 0) ? true : false).toBe(false)
              expect(JSON.parse(JSON.stringify(run))).toEqual(run)
            }
      })

      test("plays to the end, losing every fight: the defeat is written and cleared", () => {
        for (const carry of CARRIES)
          for (const pick of ["first", "last", "random"] as const) {
            const { run, lines, fights } = play(c.id, 4, "lose", carry, pick)
            expect(run.done).toBe(true)
            if (fights === 0) continue
            expect(run.retries).toBe(fights)
            expect(run.flags.defaite ?? false).toBe(false)
            expect(Number(run.flags.usure ?? 0)).toBeGreaterThan(0)
            const mark = DEFEAT_LINES[c.id]
            expect(lines.some((l) => l.includes(mark))).toBe(true)
          }
      })

      test("the hero can stand and reach every place of the island", () => {
        const ex = c.exploration
        if (!ex) return
        const board = Board.fromAscii(ex.island)
        const reach = board.regionOf(ex.start)
        expect(board.canStand(ex.start)).toBe(true)
        for (const e of ex.encounters) {
          expect([c.id, e.id, board.canStand(e.at)]).toEqual([c.id, e.id, true])
          const cells = e.zone ?? [e.at, ...board.neighbors(e.at)]
          const ok = cells.some((p) => reach.has(`${p.x},${p.y}`))
          expect([c.id, e.id, ok]).toEqual([c.id, e.id, true])
        }
      })
    })
  }

  test("the era plays through, chapter after chapter", () => {
    let carry: Carry | undefined
    for (const c of ERA3_CHAPTERS) {
      const { run } = play(c.id, 3, "win", carry)
      carry = {
        flags: run.flags,
        items: run.items,
        team: run.team,
        unlocks: run.unlocks,
      }
    }
    expect(carry).toBeDefined()
  })
})

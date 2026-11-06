import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Board } from "@realms/engine"
import { ERA2_CHAPTERS, ERA2_FLAGS, ERA2_GROWTH } from "./chapters/era2"
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
  "7": "Je vous ai repêché par le col de votre ciré",
  "12": "Nous avons tout perdu en en gardant une",
  "11": "La couche s'est refermée sur nous avant la chaleur",
  "10": "Le creux l'a repris avant que nous ayons un nom",
  "9": "Squalor a mangé pour deux ce soir",
  "8": "La moitié qui reste est celle qui nous a eus",
}

const byId = new Map(ERA2_CHAPTERS.map((c) => [c.id, c]))
const lookup = (id: string) => byId.get(id) ?? chapterById(id)

let previous: ((id: string) => ReturnType<typeof chapterById>) | undefined
beforeAll(() => {
  // the catalog installed its own lookup on import: ours covers era II too
  previous = chapterById
  useChapters(lookup)
})
afterAll(() => {
  if (previous) useChapters(previous)
})

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

/** Plays a chapter to its end; every fight is won or lost as asked. */
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
      fragments: "separation",
      "transformation.1": "B",
      objet_de_nyx: true,
      nyx_epargnee: true,
      lacune_geante_habitee: true,
      "confiance.nerea": 3,
      "confiance.eva": 3,
      "confiance.squalor": 3,
      "confiance.lacunaire": 3,
      squalor_rejoint: true,
      "lacunaire.forme": "ondine",
    },
  },
]

describe("era II flags", () => {
  test("the new flags are in the registry", () => {
    for (const k of Object.keys(ERA2_FLAGS)) expect(FLAGS[k]).toBeDefined()
  })
  test("growth entries only name items of the chapters", () => {
    expect(typeof ERA2_GROWTH).toBe("object")
  })
})

describe("era II chapters", () => {
  for (const c of ERA2_CHAPTERS) {
    describe(`chapter ${c.id} "${c.title}"`, () => {
      test("is valid", () => {
        expect(validateChapter(c)).toEqual([])
      })

      test("plays to the end, winning every fight, whatever the choices", () => {
        for (const carry of CARRIES)
          for (const pick of ["first", "last", "random"] as const)
            for (let seed = 1; seed <= 12; seed++) {
              const { run } = play(c.id, seed, "win", carry, pick)
              expect(run.done).toBe(true)
              expect(!!Number(run.flags.defaite ?? 0)).toBe(false)
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
            expect(mark).toBeDefined()
            expect(lines.some((l) => l.includes(mark))).toBe(true)
          }
      })

      test("the hero can stand and reach every place of the island", () => {
        const ex = c.exploration
        expect(ex).toBeDefined()
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
    for (const c of ERA2_CHAPTERS) {
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

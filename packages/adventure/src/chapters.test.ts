import { describe, expect, test } from "bun:test"
import { Board, CHARACTERS } from "@realms/engine"
import {
  activeEncounters,
  type Carry,
  CHAPTERS,
  carnetChanges,
  carnetEntries,
  choose,
  ELAN_MAX,
  ERAS,
  elanOf,
  enter,
  examine,
  explorationOf,
  exploring,
  type FightReport,
  finishFight,
  frame,
  gainElan,
  INFLUENCE_COST,
  influence,
  lookAtObstacle,
  next,
  overcome,
  pending,
  type Run,
  START_CARRY,
  STEPS_PER_ELAN,
  startChapter,
  TELEPORT_POOLS,
  teleportReaction,
  validateChapter,
  wanderFight,
} from "./index"

describe("chapters", () => {
  test("ids are unique and ordered", () => {
    const ids = CHAPTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ERAS.flatMap((e) => e.chapters)).toEqual(ids)
    expect(ERAS.map((e) => e.id)).toEqual([1, 2, 3, 4, 5])
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

  /** One line written only for the defeat branch of each chapter. */
  const DEFEAT_LINES: Record<string, string> = {
    "1": "Les Échos tombent avant la fin du dixième tour",
    "2": "Je suis arrivée trop vide. C'est tout.",
    "3": "Je jure de garder, et je n'ai gardé personne",
    "4": "La troisième marée emporte Néréa",
    "5": "Vous êtes réels. Mais pas assez.",
    "6": "Le Lacunaire géant prend toute la chaleur du cœur",
  }

  test("a lost fight is a narrative branch: every chapter still ends, the defeat flag is cleared", () => {
    for (const c of CHAPTERS.filter((x) => x.id !== "prologue")) {
      let run = startChapter(c.id, undefined, 4)
      const lines: string[] = []
      let fights = 0
      for (let step = 0; step < 5000 && !run.done; step++) {
        const f = frame(run)
        if (f.kind === "done") break
        if (f.kind === "choice") run = choose(run, f.options[0].id)
        else if (f.kind === "hub") run = choose(run, f.topics[0].id)
        else if (f.kind === "fight") {
          fights++
          run = finishFight(run, { ...report(step), result: "defeat" }).run
        } else {
          if (f.kind === "line") lines.push(f.text)
          run = next(run)
        }
      }
      expect(run.done).toBe(true)
      if (DEFEAT_LINES[c.id]) expect(fights).toBeGreaterThan(0)
      expect(run.retries).toBe(fights)
      expect(run.flags.defaite ?? false).toBe(false)
      if (DEFEAT_LINES[c.id]) {
        expect(Number(run.flags.usure ?? 0)).toBeGreaterThan(0)
        expect(lines.some((l) => l.includes(DEFEAT_LINES[c.id]))).toBe(true)
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

const CHARACTERS_IDS = Object.keys(CHARACTERS)

describe("exploration", () => {
  test("the walked chapters have a place for every scene, inside the island", () => {
    const walked = CHAPTERS.filter((c) => c.exploration)
    expect(walked.map((c) => c.id)).toEqual([
      "prologue",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      ...Array.from({ length: 22 }, (_, i) => String(i + 7)),
    ])
    for (const c of walked) expect(validateChapter(c)).toEqual([])
  })

  test("on every island (the prologue's pool aside) the hero can stand and reach every place", () => {
    for (const c of CHAPTERS.filter(
      (x) => x.exploration && x.id !== "prologue",
    )) {
      const ex = c.exploration as NonNullable<typeof c.exploration>
      const board = Board.fromAscii(ex.island)
      const reach = board.regionOf(ex.start)
      expect(board.canStand(ex.start)).toBe(true)
      for (const e of ex.encounters) {
        expect([c.id, e.id, board.canStand(e.at)]).toEqual([c.id, e.id, true])
        // a character or an object is walked up to: one of its neighbours
        // (or the cell itself, for a zone) must be reachable
        const cells = e.zone ?? [e.at, ...board.neighbors(e.at)]
        const ok = cells.some((p) => reach.has(`${p.x},${p.y}`))
        expect([c.id, e.id, ok]).toEqual([c.id, e.id, true])
      }
      // the companions are known characters
      for (const w of ex.companions ?? []) expect(CHARACTERS_IDS).toContain(w)
    }
  })

  test("every Influence an obstacle asks for is given by its island", () => {
    for (const c of CHAPTERS.filter((x) => x.exploration)) {
      const ex = c.exploration as NonNullable<typeof c.exploration>
      for (const e of ex.encounters)
        if (e.obstacle)
          expect(ex.influences ?? []).toContain(e.obstacle.influence)
    }
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
    // a real fight: the party can fall (only the prologue protects the hero)
    expect(spec.rules?.noDefeat).toBeUndefined()
  })
})

describe("teleport reactions", () => {
  test("they change with the journeys made, and stay deterministic", () => {
    const first = teleportReaction({ trips: 0, chapter: 1 }, 5)
    const early = teleportReaction({ trips: 2, chapter: 1 }, 5)
    const used = teleportReaction({ trips: 9, chapter: 1 }, 5)
    expect(TELEPORT_POOLS.FIRST).toContain(first[0])
    expect(TELEPORT_POOLS.EARLY).toContain(early[0])
    expect(TELEPORT_POOLS.USED).toContain(used[0])
    expect(teleportReaction({ trips: 0, chapter: 1 }, 5)).toEqual(first)
    const seen = new Set(
      [0, 1, 2, 3, 4, 5].map(
        (s) => teleportReaction({ trips: 5, chapter: 1 }, s)[0],
      ),
    )
    expect(seen.size).toBeGreaterThan(2)
    expect(
      teleportReaction({ trips: 5, chapter: 1, usure: 4 }, 1),
    ).toHaveLength(2)
  })
})

describe("influences on the island", () => {
  const onIsland = () => {
    const r = startChapter("1", START_CARRY, 1)
    return { ...r, node: r.node }
  }
  test("Élan flows with steps, the Ghom pays for an Influence, effects count once", () => {
    let run = onIsland()
    expect(elanOf(run)).toBe(0)
    expect(influence(run, "rosee", "timeWarp")).toEqual({
      ok: false,
      reason: "short",
      cost: INFLUENCE_COST.timeWarp,
    })
    run = gainElan(run, STEPS_PER_ELAN * 3)
    expect(elanOf(run)).toBe(3)
    expect(influence(run, "rosee", "earthquake")).toMatchObject({
      reason: "nothing",
    })
    const out = influence(run, "rosee", "timeWarp")
    if (!out.ok) throw new Error("should work")
    expect(elanOf(out.run)).toBe(1)
    expect(out.run.seen).toContain("rosee")
    expect(lookAtObstacle(out.run, "rosee")).toEqual(out.lines)
    expect(lookAtObstacle(run, "rosee")).not.toEqual(out.lines)
    expect(influence(out.run, "rosee", "timeWarp")).toMatchObject({
      reason: "nothing",
    })
    expect(elanOf(gainElan(run, 999))).toBe(ELAN_MAX)
  })
  test("a chapter without the Influence refuses it", () => {
    const run = gainElan(startChapter("prologue", START_CARRY, 1), 999)
    expect(influence(run, "rosee", "timeWarp")).toMatchObject({
      reason: "unknown",
    })
  })
})

describe("the Carnet", () => {
  const withFlags = (flags: Record<string, string>) => ({
    flags: { ...START_CARRY.flags, ...flags },
  })
  test("it lists the 29 questions of the reference, hidden until asked", () => {
    const all = carnetEntries(withFlags({}))
    expect(all).toHaveLength(29)
    expect(all.map((e) => e.id)[28]).toBe("Q28")
    expect(all.every((e) => e.state === "hidden")).toBe(true)
    expect(all[6].kind).toBe("open")
    expect(all[1].kind).toBe("late")
  })
  test("states follow the flags and changes are reported once", () => {
    const a = withFlags({ "carnet.Q00": "ouverte" })
    const b = withFlags({
      "carnet.Q00": "fausse",
      "carnet.Q05": "ouverte",
    })
    expect(carnetEntries(a)[0].state).toBe("open")
    expect(carnetEntries(b)[0].state).toBe("false")
    expect(carnetChanges(a, b).map((c) => [c.id, c.to])).toEqual([
      ["Q00", "false"],
      ["Q05", "open"],
    ])
    expect(carnetChanges(b, b)).toEqual([])
    expect(
      carnetEntries(withFlags({ "carnet.Q05": "repondue" }))[5].state,
    ).toBe("closed")
  })
})

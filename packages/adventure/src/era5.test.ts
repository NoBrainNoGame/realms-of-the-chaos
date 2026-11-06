import { describe, expect, test } from "bun:test"
import { OUVERTES } from "./chapters/ch28"
import {
  ERA5_CHAPTERS,
  ERA5_GROWTH,
  markEnding,
  resolveEnding,
} from "./chapters/era5"
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

useChapters((id) => ERA5_CHAPTERS.find((c) => c.id === id) ?? chapterById(id))

const report = (n: number, extra: Partial<FightReport> = {}): FightReport => ({
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
  ...extra,
})

const carry = (flags: Carry["flags"] = {}): Carry => ({
  flags,
  items: [],
  team: ["lyra", "brutus", "gorr"],
  unlocks: [],
})

type Picker = (id: string, options: string[]) => string | undefined

function play(
  chapter: string,
  seed: number,
  mode: "mixed" | "win" | "lose",
  flags: Carry["flags"] = {},
  pick: Picker = () => undefined,
  fightReport?: (n: number) => FightReport,
) {
  let rng = seed * 7919 + 13
  const roll = (n: number) => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng % n
  }
  let run: Run = startChapter(chapter, carry(flags), seed)
  let fights = 0
  for (let step = 0; step < 5000; step++) {
    const f = frame(run)
    if (f.kind === "done") return { run, fights }
    if (f.kind === "choice") {
      const ids = f.options.map((o) => o.id)
      const want = pick(f.id, ids)
      run = choose(
        run,
        want && ids.includes(want) ? want : ids[roll(ids.length)],
      )
    } else if (f.kind === "hub")
      run = choose(run, f.topics[roll(f.topics.length)].id)
    else if (f.kind === "fight") {
      fights++
      const lost = mode === "lose" || (mode === "mixed" && roll(3) === 0)
      run = finishFight(
        run,
        lost
          ? { ...report(seed), result: "defeat" }
          : (fightReport ?? report)(seed + step),
      ).run
    } else run = next(run)
  }
  throw new Error(`${chapter} (seed ${seed}) did not end`)
}

describe("era V chapters", () => {
  test("ids and order", () => {
    expect(ERA5_CHAPTERS.map((c) => c.id)).toEqual(["25", "26", "27", "28"])
  })
  for (const c of ERA5_CHAPTERS) {
    test(`chapter ${c.id} "${c.title}" is valid`, () => {
      expect(validateChapter(c)).toEqual([])
    })
    test(`chapter ${c.id} ends, winning, losing or mixed`, () => {
      for (const mode of ["win", "lose", "mixed"] as const)
        for (let seed = 1; seed <= 25; seed++) {
          const { run } = play(c.id, seed, mode)
          expect(run.done).toBe(true)
          expect(run.flags.defaite ?? false).toBe(false)
          expect(JSON.parse(JSON.stringify(run))).toEqual(run)
        }
    })
    test(`chapter ${c.id}: the island is walkable`, async () => {
      const { Board, CHARACTERS } = await import("@realms/engine")
      const ex = c.exploration
      expect(ex).toBeDefined()
      if (!ex) return
      const board = Board.fromAscii(ex.island)
      const reach = board.regionOf(ex.start)
      for (const e of ex.encounters) {
        const cells = e.zone ?? [e.at, ...board.neighbors(e.at)]
        expect(cells.some((p) => reach.has(`${p.x},${p.y}`))).toBe(true)
      }
      for (const w of ex.companions ?? [])
        expect(Object.keys(CHARACTERS)).toContain(w)
    })
  }

  test("a lost fight is written: usure rises, the story goes on", () => {
    for (const id of ["25", "26", "27", "28"]) {
      const { run, fights } = play(id, 3, "lose")
      expect(fights).toBeGreaterThan(0)
      expect(run.retries).toBe(fights)
      expect(Number(run.flags.usure ?? 0)).toBeGreaterThan(0)
    }
  })

  test("growth items are the ones the chapters give", () => {
    for (const [id, items] of [
      ["25", "echarpe-frangee"],
      ["26", "chale-de-la-derniere-chaleur"],
      ["27", "mousse-de-la-friche"],
    ]) {
      const { run } = play(id, 1, "win")
      expect(run.items).toContain(`habit:${items}`)
      expect(ERA5_GROWTH[`habit:${items}`]).toBeDefined()
    }
  })
})

describe("chapter 25: the Double", () => {
  test("sparing the Double sets double_epargne through the report", () => {
    const spared = play("25", 2, "win", {}, undefined, () => ({
      ...report(2),
      fighters: [
        { id: "x", preset: "merlin~7701", team: 1, hp: 3, fled: false },
      ],
    }))
    expect(spared.run.flags.double_epargne).toBe(true)
    const lost = play("25", 2, "win", {}, undefined, () => ({
      ...report(2),
      fighters: [
        { id: "x", preset: "merlin~7701", team: 1, hp: 0, fled: false },
      ],
    }))
    expect(lost.run.flags.double_epargne ?? false).toBe(false)
  })
})

describe("chapter 28: the endings", () => {
  const OPEN = Object.fromEntries(
    OUVERTES.filter((q) => q !== "Q28").map((q) => [`carnet.${q}`, "ouverte"]),
  )
  const finOf = (
    flags: Carry["flags"],
    pick: Picker,
    rep?: (n: number) => FightReport,
  ) =>
    play(
      "28",
      5,
      "win",
      { ...OPEN, ...flags },
      (id, ids) => {
        const want = pick(id, ids)
        if (want) return want
        if (id === "q28") return "3"
        if (id === "nomination") return "aucun"
        return undefined
      },
      rep,
    )

  test("the last gesture: asking the Ghom to leave gives Découplage", () => {
    const { run } = finOf({}, (id) =>
      id === "geste" ? "retrait" : id === "retirer" ? "retirer" : undefined,
    )
    expect(run.flags.fin).toBe("decouplage")
    expect(resolveEnding(run.flags).fin).toBe("decouplage")
  })

  test("the Ghom is not made to leave: the ending is computed", () => {
    const { run } = finOf({}, (id) =>
      id === "geste" ? "retrait" : id === "retirer" ? "garder" : undefined,
    )
    expect(run.flags.fin ?? "aucune").toBe("aucune")
    expect(["cristal", "equilibre", "intrication"]).toContain(
      resolveEnding(run.flags).fin,
    )
  })

  test("the threat needs vacuum_decay: La Bascule", () => {
    const { run } = finOf({ vacuum_decay: true }, (id) =>
      id === "geste" ? "menace" : undefined,
    )
    expect(run.flags.bascule).toBe(true)
    expect(resolveEnding(run.flags).fin).toBe("bascule")
    const without = finOf({}, (id) => (id === "geste" ? "menace" : undefined))
    expect(without.run.flags.bascule ?? false).toBe(false)
  })

  test("the negotiation needs bascule_vue: La Gratuité", () => {
    const { run } = finOf({ bascule_vue: true }, (id) =>
      id === "geste" ? "negocier" : id.startsWith("g-") ? "v" : undefined,
    )
    expect(run.flags.fin).toBe("gratuite")
    expect(run.flags["q28.annotee"]).toBe(true)
    expect(resolveEnding(run.flags).fin).toBe("gratuite")
  })

  test("two wrong gestures close the negotiation", () => {
    const { run } = finOf({ bascule_vue: true }, (id) =>
      id === "geste" ? "negocier" : id.startsWith("g-") ? "f1" : undefined,
    )
    expect(run.flags.fin ?? "aucune").toBe("aucune")
    expect(run.flags.gratuite_close).toBe(true)
  })

  test("one wrong gesture is forgiven", () => {
    let wrong = 0
    const { run } = finOf({ bascule_vue: true }, (id) => {
      if (id === "geste") return "negocier"
      if (!id.startsWith("g-")) return undefined
      return id === "g-9" && wrong++ === 0 ? "f1" : "v"
    })
    expect(run.flags.fin).toBe("gratuite")
  })

  test("a false answer to Q28 closes the last gesture", () => {
    const { run } = finOf({ vacuum_decay: true }, (id) => {
      if (id === "q28") return "1"
      if (id === "geste") return "menace"
      return undefined
    })
    expect(run.flags.bascule ?? false).toBe(false)
    expect(run.flags["carnet.Q28"]).toBe("fausse")
  })

  test("a high Usure lets the hero disperse: Dispersion", () => {
    const { run } = finOf(
      { usure: 8 },
      () => undefined,
      () =>
        report(2, {
          fighters: [
            { id: "hero", preset: "@hero", team: 0, hp: 0, fled: false },
          ],
        }),
    )
    expect(run.flags.heros_disperse).toBe(true)
    expect(run.flags.fin).toBe("dispersion")
    expect(resolveEnding(run.flags)).toMatchObject({ fin: "dispersion" })
  })

  test("a very low trust also ends in Dispersion", () => {
    const { run } = finOf({ confiance: -10 }, (id) =>
      id === "geste" ? "rien" : undefined,
    )
    expect(resolveEnding(run.flags).fin).toBe("dispersion")
  })
})

describe("resolveEnding", () => {
  const base = { "carnet.Q28": "ouverte" }
  test("order beats chaos and the reverse", () => {
    expect(resolveEnding({ ...base, "lacunes.recousues": 3 }).fin).toBe(
      "cristal",
    )
    expect(resolveEnding({ ...base, "lacunes.elargies": 3 }).fin).toBe(
      "equilibre",
    )
  })
  test("the Ghom's fate and the last answer weigh in", () => {
    expect(resolveEnding({ "ghom_dechu.issue": "vaincu" }).fin).toBe("cristal")
    expect(resolveEnding({ "ghom_dechu.issue": "suivi" }).fin).toBe("equilibre")
    expect(resolveEnding({ derniere_reponse: "ghom" }).fin).toBe("cristal")
    expect(resolveEnding({ derniere_reponse: "rien_impossible" }).fin).toBe(
      "equilibre",
    )
  })
  test("a tie goes to the last Lacune", () => {
    expect(resolveEnding({ derniere_lacune: "elargie" }).fin).toBe("equilibre")
    expect(resolveEnding({ derniere_lacune: "recousue" }).fin).toBe("cristal")
  })
  test("Intrication needs the whole route", () => {
    const q = Object.fromEntries(
      Array.from({ length: 29 }, (_, i) => [
        `carnet.Q${String(i).padStart(2, "0")}`,
        "repondue",
      ]),
    )
    const route = {
      ...q,
      "carnet.Q28": "ouverte",
      couplage_ghom_dechu: true,
      confiance: 6,
      nom: "lyra",
      "lacunes.habitees": 4,
    }
    expect(resolveEnding(route).fin).toBe("intrication")
    expect(resolveEnding({ ...route, confiance: 4 }).fin).not.toBe(
      "intrication",
    )
    expect(resolveEnding({ ...route, nom: "aucun" }).fin).not.toBe(
      "intrication",
    )
    expect(
      resolveEnding({ ...route, couplage_ghom_dechu: false }).fin,
    ).not.toBe("intrication")
  })
  test("Dispersion has priority and names the world left behind", () => {
    expect(
      resolveEnding({ heros_disperse: true, "lacunes.recousues": 2 }),
    ).toEqual({ fin: "dispersion", monde: "cristal" })
    expect(
      resolveEnding({ heros_disperse: true, "lacunes.elargies": 2 }),
    ).toEqual({ fin: "dispersion", monde: "equilibre" })
    expect(
      resolveEnding({
        heros_disperse: true,
        couplage_ghom_dechu: true,
        "lacunes.habitees": 3,
      }),
    ).toEqual({ fin: "dispersion", monde: "ouvert" })
    expect(markEnding({ confiance: -6 })["fin.monde"]).toBeDefined()
  })
  test("a special ending is dropped when the route is not clean", () => {
    expect(resolveEnding({ fin: "decouplage", nom: "lyra" }).fin).not.toBe(
      "decouplage",
    )
    expect(resolveEnding({ fin: "bascule", ...base }).fin).not.toBe("bascule")
  })
})

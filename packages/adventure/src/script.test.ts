import { describe, expect, test } from "bun:test"
import { ch13 } from "./chapters/ch13"
import { ch15 } from "./chapters/ch15"
import { ch17 } from "./chapters/ch17"
import { ch18 } from "./chapters/ch18"
import { ch26 } from "./chapters/ch26"
import { OUVERTES } from "./chapters/ch28"
import { ERA5_CHAPTERS } from "./chapters/era5"
import { entryProblems, fightRules, resolveFight } from "./entries"
import {
  type Carry,
  chapterById,
  choose,
  type FightReport,
  type FightSpec,
  finishFight,
  frame,
  next,
  type Run,
  startChapter,
  useChapters,
} from "./index"

useChapters((id) => ERA5_CHAPTERS.find((c) => c.id === id) ?? chapterById(id))

const fightsOf = (c: { scenes: Record<string, { beats: unknown[] }> }) => {
  const out: FightSpec[] = []
  const walk = (beats: unknown[]) => {
    for (const b of beats as {
      t?: string
      fight?: FightSpec
      [k: string]: unknown
    }[]) {
      if (!b || typeof b !== "object") continue
      if (b.t === "fight" && b.fight) out.push(b.fight)
      for (const v of Object.values(b))
        if (Array.isArray(v)) walk(v)
        else if (v && typeof v === "object") walk(Object.values(v))
    }
  }
  for (const s of Object.values(c.scenes)) walk(s.beats)
  return out
}

describe("scripted fights", () => {
  test("chapter 15: Gorr acts by a script and the relief shifts", () => {
    const specs = fightsOf(ch15)
    expect(specs.length).toBeGreaterThan(0)
    for (const spec of specs) {
      const rules = fightRules(spec)
      expect(rules.scripts?.some((s) => s.team === 2 && s.index === 0)).toBe(
        true,
      )
      expect(rules.scripted?.length).toBeGreaterThan(0)
      expect(entryProblems(spec)).toEqual([])
    }
  })

  test("chapter 18: the groups leave by the open ways, alone only if freed", () => {
    for (const spec of fightsOf(ch18)) {
      const none = fightRules(spec, () => 0)
      expect(none.scripts?.length).toBe(6)
      expect(none.scripts?.every((s) => s.steps[0].act.do === "leave")).toBe(
        true,
      )
      const escort = (r: typeof none) =>
        r.scripts?.filter(
          (s) => s.steps[0].act.do === "leave" && s.steps[0].act.escort === 0,
        ).length ?? 0
      const freed = fightRules(spec, (k) =>
        k === "questions_rouvertes" ? 3 : 0,
      )
      expect(escort(freed)).toBeLessThan(escort(none))
      expect(spec.rules.lacunes?.stopOnDeposit).toBe(true)
      expect(entryProblems(spec)).toEqual([])
    }
  })

  test("chapter 26: the Tiédeur leaves the middle hot", () => {
    for (const spec of fightsOf(ch26)) {
      expect(spec.rules.warmth?.hot).toHaveLength(9)
      expect(entryProblems(spec)).toEqual([])
    }
  })

  test("bad scripts are reported", () => {
    const spec = fightsOf(ch15)[0]
    const bad: FightSpec = {
      ...spec,
      rules: { ...spec.rules, clock: undefined },
    }
    expect(entryProblems(bad).join()).toContain("clock")
  })
})

describe("chapter 28: who stands in the last fight", () => {
  const specs = fightsOf(ERA5_CHAPTERS.find((c) => c.id === "28")!)
  const ids = (spec: FightSpec) =>
    spec.teams[0].fighters.map((f) =>
      typeof f.preset === "string" ? f.preset : f.preset.id,
    )

  test("the heirs and Nyx come only if their flags are set", () => {
    const spec = specs[0]
    const none = resolveFight(spec, () => false)
    const all = resolveFight(spec, () => true)
    expect(all.teams[0].fighters.length).toBe(none.teams[0].fighters.length + 4)
    expect(ids(all)).toContain("nyx")
    expect(ids(none)).not.toContain("nyx")
    const evaOnly = resolveFight(spec, (k) => k === "retour.eva")
    expect(ids(evaOnly)).toContain("eva")
    expect(ids(evaOnly)).not.toContain("nerea")
  })

  test("a spared Double stands with the team as an Écho", () => {
    const spared = specs.filter((s) => s.id.includes("-d-"))
    const not = specs.filter((s) => s.id.includes("-n-"))
    expect(spared.length).toBeGreaterThan(0)
    for (const s of spared)
      expect(
        s.teams[0].fighters.some(
          (f) =>
            typeof f.preset !== "string" && f.preset.name.startsWith("Écho"),
        ),
      ).toBe(true)
    for (const s of not)
      expect(
        s.teams[0].fighters.some(
          (f) =>
            typeof f.preset !== "string" && f.preset.name.startsWith("Écho"),
        ),
      ).toBe(false)
  })

  test("a fight left by the Ghom (held) leads to the Découplage", () => {
    const OPEN = Object.fromEntries(
      OUVERTES.filter((q) => q !== "Q28").map((q) => [
        `carnet.${q}`,
        "ouverte",
      ]),
    )
    const carry: Carry = {
      flags: OPEN,
      items: [],
      team: ["lyra", "brutus", "gorr"],
      unlocks: [],
    }
    let run: Run = startChapter("28", carry, 5)
    const visited = new Set<string>()
    for (let step = 0; step < 3000 && !run.done; step++) {
      visited.add(run.node)
      const f = frame(run)
      if (f.kind === "choice") {
        const o = f.options.map((x) => x.id)
        run = choose(run, o.includes("q28") ? o[0] : o[0])
      } else if (f.kind === "hub") run = choose(run, f.topics[0].id)
      else if (f.kind === "fight") {
        const rep = {
          result: "held",
          ticks: 4,
          divineUsed: {},
          divineNearAlly: [],
          intrications: 0,
          fled: [],
          timeUp: false,
          zonesLost: [],
          zoneStates: {},
          fixed: [],
          fighters: [],
          autonomy: {
            tiers: {},
            ordered: [],
            letAct: [],
            refused: [],
            respected: [],
            insisted: [],
            autoTurns: {},
            withdrawn: true,
          },
        } as unknown as FightReport
        run = finishFight(run, rep).run
      } else run = next(run)
    }
    expect(run.done).toBe(true)
    expect(visited.has("11")).toBe(true)
    expect(visited.has("5")).toBe(false)
    expect(run.flags.fin).toBe("decouplage")
  })
})

describe("chapter 17: Relevé and Argumenter", () => {
  const specs = fightsOf(ch17)
  const flags =
    (set: Record<string, number | string | boolean>) => (k: string) =>
      set[k] ?? false

  test("Merlin measures the hero by script; arguments open with the story", () => {
    expect(specs.length).toBeGreaterThan(0)
    for (const spec of specs) {
      expect(spec.debate?.certitude).toBe(3)
      expect(fightRules(spec).scripts?.[0].steps[0].act.do).toBe("survey")
      const none = fightRules(spec, flags({}))
      const ok = (r: typeof none, id: string) =>
        r.debate?.arguments.find((a) => a.id === id)?.ok
      expect(ok(none, "mesure")).toBe(true)
      expect(ok(none, "gel")).toBe(false)
      expect(ok(none, "demandent")).toBe(false)
      const told = fightRules(
        spec,
        flags({
          gel_lu: true,
          questions_rouvertes: 3,
          premier_cristal: "sauve",
          "ghom_dechu.verite": 2,
          voix_qui_demande: true,
        }),
      )
      for (const id of ["gel", "demandent", "cristal", "fragment"])
        expect(ok(told, id)).toBe(true)
      expect(told.debate?.extraOnce).toBe(true)
      expect(none.debate?.extraOnce).toBe(false)
    }
  })
})

describe("chapter 13: the grille", () => {
  test("the flight is an exit rule, the lampadaires are Cristaux in pairs", () => {
    const specs = fightsOf(ch13)
    expect(specs.length).toBeGreaterThan(0)
    for (const spec of specs) {
      const { exit, crystals, flee } = spec.rules
      expect(exit?.who).toEqual([0, 1])
      expect(exit?.cells.length).toBeGreaterThanOrEqual(2)
      expect(crystals?.crystals.filter((c) => c.twin)).toHaveLength(4)
      expect(flee?.own?.[0].below).toBe(0.3)
    }
  })
})

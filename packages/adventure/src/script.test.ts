import { describe, expect, test } from "bun:test"
import { ch15 } from "./chapters/ch15"
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

  test("chapter 18: the inhabitants follow the hero", () => {
    for (const spec of fightsOf(ch18)) {
      const rules = fightRules(spec)
      expect(rules.scripts?.every((s) => s.steps[0].act.do === "follow")).toBe(
        true,
      )
      expect(rules.scripts?.length).toBeGreaterThan(0)
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

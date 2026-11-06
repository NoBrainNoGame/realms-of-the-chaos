import { describe, expect, test } from "bun:test"
import { objectiveOutcome, readTrace, traceProblems } from "./trace"
import type { FightReport, FightSpec } from "./types"

const spec = {
  id: "t",
  board: ["....", "....", "...."],
  teams: [
    { name: "a", side: "allies", fighters: [{ preset: "brutus" }] },
    { name: "b", side: "enemies", fighters: [{ preset: "squalor" }] },
  ],
  rules: {
    clock: { period: 1, limit: 5 },
    regions: { c: [{ x: 1, y: 1 }] },
  },
  objectives: [],
} as unknown as FightSpec

const report: FightReport = {
  result: "victory",
  ticks: 5,
  divineUsed: { earthquake: 1 },
  divineNearAlly: [],
  intrications: 0,
  fled: [],
  timeUp: false,
  zonesLost: [],
  zoneStates: {},
  fixed: [],
  fighters: [
    { id: "brutus-0-0", preset: "brutus", team: 0, hp: 5, fled: false },
    { id: "squalor-1-0", preset: "squalor", team: 1, hp: 0, fled: false },
  ],
  trace: {
    finalBlows: {
      "squalor-1-0": {
        by: "brutus-0-0",
        byTeam: 0,
        actionId: "punch",
        at: { x: 1, y: 1 },
        tick: 4,
      },
    },
    strikes: [
      {
        target: "squalor-1-0",
        targetTeam: 1,
        by: "brutus-0-0",
        byTeam: 0,
        actionId: "punch",
        cell: { x: 1, y: 1 },
        amount: 3,
        tick: 4,
      },
    ],
    turns: { "brutus-0-0": { "0,0": 2 } },
    visited: {},
    casts: [
      {
        divineId: "earthquake",
        team: 0,
        cell: { x: 3, y: 2 },
        near: ["squalor-1-0"],
        tick: 2,
      },
    ],
    regions: {
      c: {
        teams: { 0: 3, 1: 1 },
        streak: { 0: 2, 1: 1 },
        fighters: { "brutus-0-0": 3 },
        turns: { "brutus-0-0": 2 },
        visitors: ["brutus-0-0"],
      },
    },
  },
}

const read = (c: Parameters<typeof readTrace>[0]) => readTrace(c, report, spec)

describe("trace conditions", () => {
  test("held counts ticks, or the longest run", () => {
    expect(read({ held: { region: "c", who: { team: 0 }, ticks: 3 } })).toBe(
      true,
    )
    expect(
      read({
        held: { region: "c", who: { team: 0 }, ticks: 3, consecutive: true },
      }),
    ).toBe(false)
    expect(read({ held: { region: "c", who: "brutus", ticks: 3 } })).toBe(true)
    expect(read({ held: { region: "c", who: "squalor", ticks: 1 } })).toBe(
      false,
    )
    expect(read({ turnsOn: { region: "c", who: { team: 0 }, turns: 2 } })).toBe(
      true,
    )
  })

  test("final blow is attributed to a fighter, a team and an action", () => {
    const f = (by: string | { team: number }, action?: string) =>
      read({ finalBlowBy: { by, target: "squalor", action } })
    expect(f("brutus")).toBe(true)
    expect(f({ team: 0 }, "punch")).toBe(true)
    expect(f({ team: 0 }, "kick")).toBe(false)
    expect(f({ team: 1 })).toBe(false)
    expect(
      read({ noFinalBlowBy: { by: "squalor", target: { team: 1 } } }),
    ).toBe(true)
  })

  test("nothingOn, struckOn, castOn, visited", () => {
    expect(read({ nothingOn: { region: "c" } })).toBe(false)
    expect(read({ nothingOn: { region: "c", of: "cast" } })).toBe(true)
    expect(read({ nothingOn: { region: "c", of: "stand" } })).toBe(true)
    expect(read({ struckOn: { region: "c", by: { team: 0 } } })).toBe(true)
    expect(read({ struckOn: { min: 2 } })).toBe(false)
    expect(read({ castOn: { divine: "earthquake", near: { team: 1 } } })).toBe(
      true,
    )
    expect(read({ not: { castOn: { divine: "timeWarp" } } })).toBe(true)
    expect(read({ visited: { region: "c", who: "brutus" } })).toBe(true)
  })

  test("without a trace, nothing is held and nothing is struck", () => {
    const bare = { ...report, trace: undefined }
    expect(
      readTrace(
        { held: { region: "c", who: { team: 0 }, ticks: 1 } },
        bare,
        spec,
      ),
    ).toBe(false)
    expect(readTrace({ nothingOn: { region: "c" } }, bare, spec)).toBe(true)
  })

  test("an objective needs its check and all its conditions", () => {
    const o = {
      id: "o",
      mark: "★" as const,
      label: "",
      check: () => true,
      when: [{ visited: { region: "c", who: "brutus" } }],
    }
    expect(objectiveOutcome(o, report, spec)).toBe(true)
    expect(
      objectiveOutcome(
        {
          ...o,
          when: [...o.when, { visited: { region: "c", who: "squalor" } }],
        },
        report,
        spec,
      ),
    ).toBe(false)
    expect(
      objectiveOutcome(
        { ...o, check: undefined, when: undefined },
        report,
        spec,
      ),
    ).toBe(true)
  })

  test("validation names unknown regions, fighters, teams", () => {
    const bad = {
      ...spec,
      objectives: [
        {
          id: "o",
          mark: "◆",
          label: "",
          when: [
            { held: { region: "nope", who: "ghost", ticks: 1 } },
            { finalBlowBy: { by: { team: 7 }, target: "squalor" } },
            { held: { region: "c", who: "brutus", ticks: 99 } },
          ],
        },
        { id: "empty", mark: "◆", label: "" },
      ],
    } as unknown as FightSpec
    const errs = traceProblems(bad).join("\n")
    expect(errs).toContain('unknown region "nope"')
    expect(errs).toContain('no fighter "ghost"')
    expect(errs).toContain("no team 7")
    expect(errs).toContain("held 99 ticks")
    expect(errs).toContain('"empty" has neither')
  })
})

describe("struckOn farther", () => {
  const far = (distance?: number): FightReport => ({
    ...report,
    trace: {
      ...report.trace!,
      strikes: [{ ...report.trace!.strikes[0], distance }],
    },
  })
  const cond = {
    struckOn: { by: { team: 0 }, target: { team: 1 }, farther: 2 },
  }
  test("a blow from afar is told from an adjacent one", () => {
    expect(readTrace(cond, far(3), spec)).toBe(true)
    expect(readTrace(cond, far(1), spec)).toBe(false)
    expect(readTrace(cond, far(undefined), spec)).toBe(false)
  })
})

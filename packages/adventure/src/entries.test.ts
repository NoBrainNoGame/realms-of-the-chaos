import { describe, expect, test } from "bun:test"
import { ch01 } from "./chapters/ch01"
import { entryProblems, fightRules } from "./entries"
import type { FightSpec } from "./types"

const fights = (): FightSpec[] =>
  Object.values(ch01.scenes).flatMap((s) =>
    s.beats.flatMap((b) => (b.t === "fight" ? [b.fight] : [])),
  )

describe("arrivals in the chapters", () => {
  test("chapter 1 brings its three waves in at turns 1, 4 and 7", () => {
    const spec = fights().find((f) => f.id === "1.bords")!
    const rules = fightRules(spec)
    expect(rules.arrivals?.map((a) => a.tick)).toEqual([1, 1, 4, 4, 7, 7, 7])
    expect(rules.arrivals?.every((a) => a.team === 1)).toBe(true)
    expect(entryProblems(spec)).toEqual([])
  })

  test("a tick without a clock, or a bad switch, is reported", () => {
    const spec = fights().find((f) => f.id === "1.bords")!
    const bad: FightSpec = {
      ...spec,
      rules: { ...spec.rules, clock: undefined },
    }
    expect(entryProblems(bad).length).toBeGreaterThan(0)
    const twice: FightSpec = {
      ...spec,
      teams: [
        {
          ...spec.teams[0],
          fighters: [
            {
              ...spec.teams[0].fighters[0],
              switchTo: { team: 0, tick: 1 },
            },
          ],
        },
        spec.teams[1],
      ],
    }
    expect(entryProblems(twice).join()).toContain("bad team")
  })
})

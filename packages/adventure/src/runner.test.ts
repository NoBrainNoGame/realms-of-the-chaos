import { describe, expect, test } from "bun:test"
import {
  add,
  type Chapter,
  chapterById,
  choice,
  choose,
  END,
  type FightSpec,
  finishFight,
  frame,
  fx,
  go,
  gte,
  hub,
  is,
  narr,
  next,
  opt,
  redirect,
  say,
  set,
  startChapter,
  topic,
  useChapters,
  validateChapter,
  when,
} from "./index"

const fight: FightSpec = {
  id: "f",
  title: "F",
  board: ["...", "..."],
  teams: [],
  rules: {},
  influences: [],
  startEnergy: 0,
  goal: "g",
  lines: [],
  objectives: [
    {
      id: "o",
      mark: "★",
      label: "o",
      check: (r) => ({ ok: r.intrications > 0, n: r.intrications }),
      onSuccess: [{ add: "confiance.lyra", by: 1, perUnit: true }],
      onFailure: [set("lyra_usure")],
    },
  ],
}

const mini: Chapter = {
  id: "mini",
  era: 1,
  number: 1,
  title: "Mini",
  place: "nowhere",
  start: "a",
  scenes: {
    a: {
      id: "a",
      title: "A",
      kind: "scene",
      beats: [
        narr("un"),
        choice("c", [
          opt("x", "X", [fx(add("confiance.lyra", 1))]),
          opt("y", "Y", [redirect("x")]),
          opt("z", "Z", [], gte("confiance", 5)),
        ]),
        when(is("zones_prologue", 0), [say("lyra", "zero")], [narr("autre")]),
        hub("h", [
          topic("t1", "T1", [narr("t1")]),
          topic("t2", "T2", [narr("t2")], { last: true }),
        ]),
      ],
      next: "b",
    },
    b: {
      id: "b",
      title: "B",
      kind: "combat",
      beats: [{ t: "fight", fight }, go(END)],
    },
  },
}
useChapters((id) => {
  return id === "mini" ? mini : chapterById(id)
})

describe("runner", () => {
  test("mini chapter is valid", () => {
    expect(validateChapter(mini)).toEqual([])
  })

  test("lines, choices, redirect, hub, fight", () => {
    let run = startChapter("mini")
    expect(frame(run)).toMatchObject({ kind: "line", text: "un" })
    run = next(run)
    const f = frame(run)
    expect(f.kind === "choice" && f.options.map((o) => o.id)).toEqual([
      "x",
      "y",
    ])
    run = choose(run, "y")
    expect(run.flags["confiance.lyra"]).toBe(1)
    expect(frame(run)).toMatchObject({ kind: "line", text: "zero" })
    run = next(run)
    let h = frame(run)
    expect(h.kind === "hub" && h.topics.map((t) => t.id)).toEqual(["t1"])
    run = next(choose(run, "t1"))
    h = frame(run)
    expect(h.kind === "hub" && h.topics.map((t) => t.id)).toEqual(["t2"])
    run = next(choose(run, "t2"))
    expect(run.node).toBe("b")
    expect(frame(run).kind).toBe("fight")
    expect(run.flags.ecoute).toBe(2)
  })

  test("fight result: defeat goes on, victory scores objectives", () => {
    const base = {
      ticks: 0,
      divineUsed: {},
      divineNearAlly: [],
      fled: [],
      timeUp: false,
      zonesLost: [],
      zoneStates: {},
      fixed: [],
      fighters: [],
    }
    let run = startChapter("mini")
    run = next(choose(next(run), "x"))
    run = next(choose(run, "t1"))
    run = next(choose(run, "t2"))
    const lost = finishFight(run, {
      ...base,
      result: "defeat",
      intrications: 0,
    })
    expect(lost.run.retries).toBe(1)
    expect(lost.debrief.every((d) => !d.ok)).toBe(true)
    expect(frame(lost.run).kind).not.toBe("fight")
    const won = finishFight(run, {
      ...base,
      result: "victory",
      intrications: 2,
    })
    expect(won.debrief[0].ok).toBe(true)
    expect(won.run.flags["confiance.lyra"]).toBe(3)
    expect(frame(won.run).kind).toBe("done")
  })

  test("state is plain serialisable data", () => {
    const run = startChapter("mini")
    expect(JSON.parse(JSON.stringify(run))).toEqual(run)
  })
})

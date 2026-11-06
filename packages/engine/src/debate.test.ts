import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

const ground = () => Board.fromAscii(Array.from({ length: 5 }, () => "......."))

function duel(debate: NonNullable<AdventureRules["debate"]>) {
  return new Combat({
    seed: 3,
    board: ground(),
    teams: [
      { controller: "human", fighters: ["lyra"] },
      { controller: "ai", fighters: ["merlin"] },
    ],
    positions: [[{ x: 1, y: 2 }], [{ x: 4, y: 2 }]],
    adventure: {
      clock: { period: 5, limit: 30 },
      noDefeat: [0],
      scripts: [
        {
          team: 1,
          index: 0,
          steps: [{ act: { do: "survey", at: { team: 0, index: 0 } } }],
        },
      ],
      debate,
    },
  })
}

const base = {
  speaker: { team: 1, index: 0 },
  probes: [
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
    ],
    [
      { x: 0, y: 4 },
      { x: 6, y: 4 },
    ],
  ],
  lacunes: [[{ x: 3, y: 0 }], [{ x: 3, y: 4 }]],
  certitude: 2,
  arguments: [
    { id: "mesure", ok: true, needsSurvey: true },
    { id: "gorr", ok: false },
    { id: "autre", ok: true },
  ],
}

/** Run until the human fighter has to play. */
const untilHero = (c: Combat) => {
  for (let i = 0; i < 40 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter?.team === 0) return c.activeFighter
    if (c.activeFighter) c.pass()
  }
  return null
}

describe("debate: Relevé", () => {
  test("a survey breaks a pair of probes and opens a Lacune", () => {
    const c = duel(base)
    untilHero(c)
    const d = c.adventure!.report.debate
    expect(d.surveyed.length).toBeGreaterThan(0)
    expect(d.probesBroken).toBe(d.surveyed.length)
    expect(c.board.voids.size).toBeGreaterThan(0)
  })

  test("with no pair left, the speaker cannot measure", () => {
    const c = duel({ ...base, probes: [base.probes[0]], lacunes: [] })
    for (let i = 0; i < 6; i++) {
      untilHero(c)
      if (c.activeFighter) c.pass()
    }
    expect(c.adventure!.report.debate.probesBroken).toBe(1)
  })
})

describe("debate: Argumenter", () => {
  test("an argument lowers the Certitude, once; unreceivable ones are refused", () => {
    const c = duel({ ...base, certitude: 3 })
    untilHero(c)
    expect(c.argue("gorr").ok).toBe(false)
    expect(c.argue("mesure").ok).toBe(true)
    expect(c.adventure!.report.debate.certitude).toBe(2)
    untilHero(c)
    expect(c.argue("mesure").ok).toBe(false)
  })

  test("at Certitude 0 the fight stops with no winner", () => {
    const c = duel({ ...base, certitude: 1 })
    untilHero(c)
    expect(c.argue("autre").ok).toBe(true)
    expect(c.state).toBe("ended")
    expect(c.adventure!.report.debate.convinced).toBe(true)
    expect(c.winnerTeam ?? null).toBeNull()
  })

  test("only the hero near the speaker may argue, one per turn", () => {
    const far = duel({ ...base, range: 1 })
    untilHero(far)
    expect(far.argue("autre").ok).toBe(false)
    const c = duel({ ...base, certitude: 3 })
    untilHero(c)
    expect(c.argue("autre").ok).toBe(true)
  })

  test("`blocker` says why nothing can be argued (too far, nothing ready) and is null once one can", () => {
    const far = duel({ ...base, range: 1 })
    const hero = untilHero(far)!
    expect(far.adventure!.debate!.blocker(hero)).toBe("far")
    const near = duel({
      ...base,
      arguments: [{ id: "gorr", ok: false }],
    })
    const h2 = untilHero(near)!
    expect(near.adventure!.debate!.blocker(h2)).toBe("nothing")
    const ready = duel({ ...base, certitude: 3 })
    const h3 = untilHero(ready)!
    expect(ready.adventure!.debate!.blocker(h3)).toBeNull()
  })
})

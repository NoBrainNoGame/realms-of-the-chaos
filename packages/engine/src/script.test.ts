import { describe, expect, test } from "bun:test"
import type { AdventureRules } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"
import type { FightEvent } from "./types"

const ground = () =>
  Board.fromAscii(Array.from({ length: 5 }, () => "........"))

function fight(
  rules: AdventureRules,
  hold: number[] = [],
  foe = "gorr",
  heroes = ["lyra", "merlin"],
  seed = 3,
) {
  const c = new Combat({
    seed,
    board: ground(),
    teams: [
      { name: "a", controller: "ai", fighters: heroes },
      { name: "b", controller: "ai", fighters: [foe] },
    ],
    positions: [
      [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
      ],
      [{ x: 5, y: 2 }],
    ],
    adventure: rules,
  })
  for (const t of hold) c.holding.add(t)
  return c
}

const used = (events: FightEvent[], id: string) =>
  events.filter((e) => e.type === "actionUsed" && e.actionId === id)

describe("scripted fighters", () => {
  const clock = { period: 10, limit: 8 }

  test("a team on hold does nothing without a script", () => {
    const c = fight({ clock, neutral: [1], noDefeat: [0] }, [1])
    const events = c.run()
    expect(
      events.filter(
        (e) => e.type === "actionUsed" && e.fighterId.includes("gorr"),
      ),
    ).toHaveLength(0)
    expect(c.adventure?.report.script.acts).toBe(0)
  })

  test("a scripted fighter acts on its own beat even when held", () => {
    const c = fight(
      {
        clock,
        neutral: [1],
        noDefeat: [0],
        scripts: [
          {
            team: 1,
            index: 0,
            steps: [
              { every: 2, act: { do: "use", action: "smash", at: "nearest" } },
              { act: { do: "stand" } },
            ],
          },
        ],
      },
      [1],
    )
    const events = c.run()
    const smashes = used(events, "smash")
    expect(smashes.length).toBeGreaterThan(0)
    const turns = events.filter(
      (e) => e.type === "turnStarted" && e.fighterId.includes("gorr"),
    ).length
    // one turn out of two, at most (the walk to the target costs turns)
    expect(smashes.length).toBeLessThanOrEqual(Math.ceil(turns / 2))
    expect(c.adventure?.report.script.acts).toBeGreaterThan(0)
  })

  test("a step window gates the script, then the fighter stands", () => {
    const c = fight(
      {
        clock,
        neutral: [1],
        noDefeat: [0],
        scripts: [
          {
            team: 1,
            index: 0,
            steps: [{ to: 3, act: { do: "move", to: { x: 7, y: 4 } } }],
          },
        ],
      },
      [1],
    )
    c.run()
    expect(c.fighters[2].position).toEqual({ x: 7, y: 4 })
  })
})

describe("scripted earthquakes", () => {
  test("a scripted Séisme raises a low cell at its tick and is reported", () => {
    const c = fight({
      clock: { period: 10, limit: 5 },
      noDefeat: [0, 1],
      scripted: [{ tick: 2, kind: "earthquake", at: [{ x: 7, y: 0 }] }],
    })
    const before = c.board.get({ x: 7, y: 0 })?.elevation ?? 0
    const events = c.run()
    expect(c.board.get({ x: 7, y: 0 })?.elevation).toBe(before + 2)
    expect(c.adventure?.report.script.quakes).toEqual([{ x: 7, y: 0 }])
    expect(events.some((e) => e.type === "quaked")).toBe(true)
  })

  test("an occupied cell is spared", () => {
    const c = fight({
      clock: { period: 10, limit: 5 },
      noDefeat: [0, 1],
      scripted: [{ tick: 1, kind: "earthquake", at: [{ x: 1, y: 1 }] }],
    })
    c.run()
    expect(c.adventure?.report.script.quakes).toEqual([])
  })
})

describe("recomposition", () => {
  test("a fallen fighter reforms after the delay, at half its life", () => {
    const c = fight({
      clock: { period: 10, limit: 10 },
      recompose: [{ team: 0, index: 1, after: 2, hp: 0.5 }],
    })
    const events = c.run()
    const merlin = c.fighters[1]
    const died = events.findIndex(
      (e) => e.type === "died" && e.fighterId === merlin.id,
    )
    const back = events.findIndex(
      (e) => e.type === "recomposed" && e.fighterId === merlin.id,
    )
    if (died >= 0) {
      expect(back).toBeGreaterThan(died)
      expect(c.adventure?.report.script.recomposed).toContain(merlin.id)
    } else expect(back).toBe(-1)
  })

  test("the fight does not end while a team is due to reform", () => {
    const c = fight(
      {
        clock: { period: 10, limit: 40 },
        recompose: [{ team: 1, after: 3, hp: 1, times: 1 }],
      },
      [],
      "merlin",
      ["gorr", "brutus"],
    )
    const events = c.run()
    const fell = events.findIndex(
      (e) => e.type === "died" && e.fighterId === c.fighters[2].id,
    )
    expect(fell).toBeGreaterThan(-1)
    const ended = events.findIndex((e) => e.type === "ended")
    const back = events.findIndex((e) => e.type === "recomposed")
    expect(back).toBeGreaterThan(fell)
    expect(ended === -1 || ended > back).toBe(true)
    expect(c.fighters[2].alive || c.state === "ended").toBe(true)
  })

  test("without the rule, a fallen fighter stays down", () => {
    const c = fight({ clock: { period: 10, limit: 12 } })
    const events = c.run()
    expect(events.some((e) => e.type === "recomposed")).toBe(false)
  })
})

describe("tiédeur", () => {
  const all = Array.from({ length: 8 }, (_, x) =>
    Array.from({ length: 5 }, (_, y) => ({ x, y })),
  ).flat()

  test("tepid cells cost hit points, hot ones do not", () => {
    const tepid = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      warmth: { hot: [], loss: 1 },
    })
    tepid.run()
    expect(tepid.adventure?.report.script.warmth.lost).toBeGreaterThan(0)
    const warm = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      warmth: { hot: all, startTicks: 99 },
    })
    warm.run()
    expect(warm.adventure?.report.script.warmth.lost).toBe(0)
  })

  test("exempt cells are never tepid", () => {
    const pocket = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      warmth: { hot: [], loss: 1, exempt: all },
    })
    pocket.run()
    expect(pocket.adventure?.report.script.warmth.lost).toBe(0)
  })

  test("acting from a tepid cell heats it", () => {
    const c = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      warmth: { hot: [], loss: 1, heat: 3 },
    })
    const events = c.run()
    expect(events.some((e) => e.type === "warmed")).toBe(true)
    expect(c.adventure?.report.script.warmth.warmed).toBeGreaterThan(0)
  })

  test("the heat of the start fades", () => {
    const c = fight({
      clock: { period: 10, limit: 6 },
      noDefeat: [0, 1],
      warmth: { hot: all, startTicks: 2 },
    })
    const events = c.run()
    expect(events.some((e) => e.type === "cooled")).toBe(true)
  })
})

describe("leaving the island", () => {
  const clock = { period: 10, limit: 8 }
  const leaving = (exits: { at: { x: number; y: number }; to?: number }[]) =>
    fight(
      {
        clock,
        neutral: [1],
        noDefeat: [0],
        scripts: [
          { team: 1, index: 0, steps: [{ act: { do: "leave", exits } }] },
        ],
      },
      [1],
    )

  test("a scripted fighter walks to an open exit and leaves", () => {
    const c = leaving([{ at: { x: 7, y: 2 } }])
    c.run()
    const foe = c.fighters.find((f) => f.team === 1)
    expect(foe && c.departed.has(foe.id)).toBe(true)
  })

  test("a closed exit is not used", () => {
    const c = leaving([{ at: { x: 7, y: 2 }, to: -1 }])
    c.run()
    const foe = c.fighters.find((f) => f.team === 1)
    expect(foe && c.departed.has(foe.id)).toBe(false)
  })
})

describe("the Fêlure stops when a Cristal is given back", () => {
  const grown = (deposit: boolean) => {
    const c = new Combat({
      seed: 3,
      board: ground(),
      teams: [
        { controller: "human", fighters: ["brutus"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 1, y: 1 }], [{ x: 7, y: 4 }]],
      adventure: {
        clock: { period: 10, limit: 12 },
        neutral: [1],
        noDefeat: [0],
        lacunes: {
          cells: [{ x: 4, y: 0 }],
          every: 1,
          spread: 1,
          mendTeams: [],
          stopOnDeposit: true,
        },
        crystals: {
          crystals: [
            {
              id: "g",
              at: { x: 1, y: 1 },
              kind: "geode",
              carriedBy: { team: 0, index: 0 },
            },
          ],
          deposits: [{ x: 2, y: 1 }],
        },
      },
    })
    let done = !deposit
    for (let i = 0; i < 60 && c.state !== "ended"; i++) {
      c.run()
      if (!c.activeFighter) continue
      if (!done) done = c.crystal("deposit", { x: 2, y: 1 }).ok
      else c.pass()
    }
    expect(done).toBe(true)
    return c.adventure?.report.lacune.grown ?? 0
  }

  test("a Lacune that grows from its heart stops after a deposit", () => {
    expect(grown(false)).toBeGreaterThan(grown(true))
  })
})

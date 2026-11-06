import { describe, expect, test } from "bun:test"
import type { AdventureRules, AutonomyTier } from "./adventure"
import { Board } from "./board"
import { Combat } from "./combat"

const ground = () =>
  Board.fromAscii(["........", "........", "........", "........", "........"])

/**
 * A human team (brutus, lyra) against one weak squalor right beside brutus:
 * striking it would "finish" it. Brutus plays first (index 0 of the team).
 */
function fight(tier: AutonomyTier, extra: AdventureRules = {}, foeHp = 0.5) {
  const combat = new Combat({
    seed: 1,
    board: ground(),
    teams: [
      { name: "Alliés", controller: "human", fighters: ["brutus", "lyra"] },
      { name: "Eux", controller: "ai", fighters: ["squalor"], hp: [foeHp] },
    ],
    positions: [
      [
        { x: 3, y: 2 },
        { x: 0, y: 0 },
      ],
      [{ x: 4, y: 2 }],
    ],
    adventure: {
      autonomy: { allies: [{ team: 0, index: 0, tier }] },
      ...extra,
    },
  })
  combat.teams[0].energy = 5
  return combat
}

/** Runs until brutus is the one asked for an order (or the fight is over). */
function untilBrutus(c: Combat) {
  for (let i = 0; i < 50 && c.state !== "ended"; i++) {
    c.run()
    if (c.activeFighter?.presetId === "brutus") return c.activeFighter
    if (c.activeFighter) c.pass()
  }
  return c.activeFighter
}

describe("autonomy: refusal", () => {
  test("a bound ally never refuses", () => {
    const c = fight("bound")
    untilBrutus(c)
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    const r = c.useAction("kick", foe.position)
    expect(r.ok && r.events.some((e) => e.type === "refused")).toBe(false)
    expect(c.refusal).toBeNull()
  })

  test("a reserved ally refuses to finish a weak foe, with no time spent", () => {
    const c = fight("reserved")
    const brutus = untilBrutus(c)!
    const at = brutus.nextActionAt
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    const r = c.useAction("kick", foe.position)
    expect(r.ok && r.events.map((e) => e.type)).toContain("refused")
    expect(foe.hp).toBeGreaterThan(0)
    expect(brutus.nextActionAt).toBe(at)
    expect(c.activeFighter).toBe(brutus)
    expect(c.refusal?.fighterId).toBe(brutus.id)
    // the refusal must be answered first
    expect(c.pass().ok).toBe(false)
    expect(c.adventure?.report.autonomy.refused).toEqual([brutus.id])
  })

  test("a confident ally refuses once, then obeys", () => {
    const c = fight("confident")
    const brutus = untilBrutus(c)!
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    c.useAction("kick", foe.position)
    expect(c.refusal).not.toBeNull()
    c.letAct()
    expect(c.adventure?.report.autonomy.respected).toEqual([brutus.id])
    expect(c.refusal).toBeNull()
    expect(brutus.id).toBeDefined()
  })
})

describe("autonomy: Laisser agir and Insister", () => {
  test("Laisser agir: the ally plays by itself and the Ghom's Élan is kept", () => {
    const c = fight("reserved", {}, 20)
    const brutus = untilBrutus(c)!
    const before = brutus.nextActionAt
    const events = c.letAct()
    expect(events.ok).toBe(true)
    expect(c.activeFighter).not.toBe(brutus)
    expect(brutus.nextActionAt).toBeGreaterThan(before)
    expect(c.teams[0].energy).toBe(5)
    const a = c.adventure!.report.autonomy
    expect(a.letAct).toEqual([brutus.id])
    expect(a.ordered).not.toContain(brutus.id)
  })

  test("Insister forces the order, costs 2 Élan and is reported", () => {
    const c = fight("reserved")
    const brutus = untilBrutus(c)!
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    c.useAction("kick", foe.position)
    const r = c.insist()
    expect(r.ok).toBe(true)
    expect(r.ok && r.events.map((e) => e.type)).toContain("insisted")
    expect(c.teams[0].energy).toBe(3)
    expect(foe.hp).toBeLessThan(0.5)
    expect(c.adventure?.report.autonomy.insisted).toEqual([brutus.id])
    expect(c.refusal).toBeNull()
  })

  test("Insister needs a refusal and enough Élan", () => {
    const c = fight("reserved")
    untilBrutus(c)
    expect(c.insist().ok).toBe(false)
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    c.useAction("kick", foe.position)
    c.teams[0].energy = 1
    expect(c.insist().ok).toBe(false)
    expect(c.refusal).not.toBeNull()
  })

  test("a fight with refusals replays identically from its log", () => {
    const options = {
      seed: 1,
      board: ground(),
      teams: [
        {
          name: "A",
          controller: "human" as const,
          fighters: ["brutus", "lyra"],
        },
        {
          name: "B",
          controller: "ai" as const,
          fighters: ["squalor"],
          hp: [0.5],
        },
      ],
      positions: [
        [
          { x: 3, y: 2 },
          { x: 0, y: 0 },
        ],
        [{ x: 4, y: 2 }],
      ],
      adventure: {
        autonomy: {
          allies: [{ team: 0, index: 0, tier: "confident" as const }],
        },
      },
    }
    const c = new Combat(options)
    c.teams[0].energy = 4
    untilBrutus(c)
    const foe = c.fighters.find((f) => f.presetId === "squalor")!
    c.useAction("kick", foe.position)
    c.letAct()
    const replay = Combat.replay(options, c.log)
    replay.teams[0].energy = 4
    expect(replay.adventure?.report.autonomy.respected).toEqual(
      c.adventure!.report.autonomy.respected,
    )
  })
})

describe("autonomy: tiers play alone", () => {
  test("a broken ally always plays alone and never waits for an order", () => {
    const c = fight("broken")
    for (let i = 0; i < 30 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter) {
        expect(c.activeFighter.presetId).not.toBe("brutus")
        c.pass()
      }
    }
    const brutus = c.fighters.find((f) => f.presetId === "brutus")!
    expect(c.adventure!.report.autonomy.autoTurns[brutus.id]).toBeGreaterThan(0)
  })

  test("a wary ally plays every second turn alone", () => {
    const c = fight("wary")
    const brutus = c.fighters.find((f) => f.presetId === "brutus")!
    let asked = 0
    for (let i = 0; i < 60 && c.state !== "ended"; i++) {
      c.run()
      if (c.activeFighter === brutus) asked++
      if (c.activeFighter) c.pass()
    }
    const alone = c.adventure!.report.autonomy.autoTurns[brutus.id] ?? 0
    expect(alone).toBeGreaterThan(0)
    expect(Math.abs(alone - asked)).toBeLessThanOrEqual(1)
  })
})

describe("autonomy: Se retirer", () => {
  test("the Ghom withdraws: the fight ends with no winner", () => {
    const c = fight("bound", { withdraw: true })
    untilBrutus(c)
    const r = c.withdraw()
    expect(r.ok && r.events.map((e) => e.type)).toContain("withdrew")
    expect(c.state).toBe("ended")
    expect(c.winnerTeam).toBeNull()
    expect(c.adventure?.report.autonomy.withdrawn).toBe(true)
  })

  test("not allowed unless the rule is set", () => {
    const c = fight("bound")
    untilBrutus(c)
    expect(c.withdraw().ok).toBe(false)
  })
})

import { beforeEach, describe, expect, test } from "bun:test"
import { autonomyEffects, type FightSpec } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { tickUntil } from "../test/play"
import FightScene from "./FightScene"

/** Brutus (a will of his own) beside a nearly dead Squalor; Lyra far away. */
const spec = (withdraw = false): FightSpec => ({
  id: "t.autonomy",
  title: "Autonomie",
  board: [".........", ".........", ".........", ".........", "........."],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        {
          preset: "brutus",
          at: { x: 3, y: 2 },
          autonomy: { lineage: "brutus" },
        },
        { preset: "lyra", at: { x: 0, y: 0 } },
      ],
    },
    {
      name: "Eux",
      side: "enemies",
      fighters: [{ preset: "squalor", at: { x: 4, y: 2 }, hp: 0.5 }],
    },
  ],
  rules: withdraw ? { withdraw: true } : {},
  influences: [],
  startEnergy: 4,
  objectives: [],
  lines: [],
  goal: "",
})

function scene(s: FightSpec, flags: Record<string, number> = {}) {
  const fs = mount(
    new FightScene(
      fightOptions(s, 5, 1, { items: [], unlocks: [], flags }, () => []),
    ),
  )
  fs.combat.teams[0].energy = 4
  fs.startFight()
  return fs
}

/** Ticks until it is Brutus' turn to be given an order. */
function untilBrutus(fs: FightScene) {
  const internals = fs as any
  for (let i = 0; i < 60 && fs.combat.state !== "ended"; i++) {
    tickUntil(fs, () => internals._inputReady || fs.combat.state === "ended")
    const me = fs.combat.activeFighter
    if (me?.presetId === "brutus") return me
    if (me) internals._command({ type: "pass", fighterId: me.id })
  }
  return null
}

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("autonomy in the Adventure scene", () => {
  test("a reserved ally refuses, the Ghom insists, the report and trust follow", () => {
    const s = spec()
    const fs = scene(s, { "confiance.brutus": 0 })
    const internals = fs as any
    const brutus = untilBrutus(fs)!
    expect(fs.combat.adventure?.tierOf(brutus)).toBe("reserved")
    const foe = fs.combat.fighters.find((f) => f.presetId === "squalor")!
    internals._command({
      type: "useAction",
      fighterId: brutus.id,
      actionId: "kick",
      target: foe.position,
    })
    expect(fs.combat.refusal?.fighterId).toBe(brutus.id)
    expect(foe.hp).toBeGreaterThan(0)
    // the two answers are on the bar, and nothing else
    tickUntil(fs, () => !internals._playing)
    internals._hud.emit("insist")
    expect(fs.combat.refusal).toBeNull()
    expect(fs.combat.teams[0].energy).toBe(2)
    tickUntil(fs, () => !internals._playing)
    const report = reportOf(s, fs.combat)
    expect(report.autonomy?.insisted).toEqual([brutus.id])
    const effects = autonomyEffects(s, report, () => 0)
    expect(effects).toEqual([
      { add: "confiance.brutus", by: -2 },
      { add: "confiance", by: -1 },
      { add: "autonomie.insistances", by: 1 },
    ])
  })

  test("Laisser agir: the ally plays alone and earns trust at the end", () => {
    const s = spec()
    const fs = scene(s, { "confiance.brutus": 0 })
    const internals = fs as any
    const brutus = untilBrutus(fs)!
    internals._hud.emit("letAct")
    tickUntil(fs, () => !internals._playing)
    expect(fs.combat.activeFighter).not.toBe(brutus)
    expect(reportOf(s, fs.combat).autonomy?.letAct).toEqual([brutus.id])
    expect(fs.combat.teams[0].energy).toBe(4)
  })

  test("a bound ally obeys: no refusal", () => {
    const s = spec()
    const fs = scene(s, { "confiance.brutus": 4 })
    const brutus = untilBrutus(fs)!
    expect(fs.combat.adventure?.tierOf(brutus)).toBe("bound")
  })

  test("a broken ally plays every turn alone", () => {
    const fs = scene(spec(), { "confiance.brutus": -5 })
    const internals = fs as any
    for (let i = 0; i < 20 && fs.combat.state !== "ended"; i++) {
      tickUntil(fs, () => internals._inputReady || fs.combat.state === "ended")
      const me = fs.combat.activeFighter
      if (me) {
        expect(me.presetId).toBe("lyra")
        internals._command({ type: "pass", fighterId: me.id })
      }
    }
    const brutus = fs.combat.fighters.find((f) => f.presetId === "brutus")!
    expect(
      fs.combat.adventure?.report.autonomy.autoTurns[brutus.id],
    ).toBeGreaterThan(0)
  })

  test("Se retirer ends the fight as a held fight, flagged withdrawn", () => {
    const s = spec(true)
    const fs = scene(s)
    const internals = fs as any
    tickUntil(fs, () => internals._inputReady)
    internals._hud.emit("withdraw")
    expect(fs.combat.state).toBe("ended")
    const report = reportOf(s, fs.combat)
    expect(report.result).toBe("held")
    expect(report.autonomy?.withdrawn).toBe(true)
  })
})

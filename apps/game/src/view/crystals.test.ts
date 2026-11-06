import { beforeEach, describe, expect, test } from "bun:test"
import type { FightSpec } from "@realms/adventure"
import { fightOptions, reportOf } from "../adventure/fight"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import { tickUntil } from "../test/play"
import FightScene from "./FightScene"

const spec: FightSpec = {
  id: "t.crystals",
  title: "Cristaux",
  board: [".........", ".........", ".........", ".........", "........."],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [{ preset: "brutus", at: { x: 3, y: 2 } }],
    },
    {
      name: "Eux",
      side: "enemies",
      fighters: [{ preset: "squalor", at: { x: 8, y: 4 } }],
    },
  ],
  rules: {
    clock: { period: 10, limit: 80, winner: 0 },
    glass: [{ x: 6, y: 0 }],
    crystals: {
      crystals: [
        { id: "a", at: { x: 4, y: 2 }, twin: "b" },
        { id: "b", at: { x: 0, y: 0 }, twin: "a" },
      ],
    },
    gel: {},
  },
  influences: [],
  startEnergy: 0,
  objectives: [],
  lines: [],
  goal: "",
}

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

describe("crystals in the Adventure scene", () => {
  test("the Extraire button aims, a click on the crystal breaks it", () => {
    const fs = mount(
      new FightScene(
        fightOptions(spec, 5, 1, { items: [], unlocks: [] }, () => []),
      ),
    )
    fs.startFight()
    const internals = fs as any
    const brutus = untilBrutus(fs)!
    expect(brutus).toBeTruthy()
    internals._hud.emit("crystal", "extract", "elan")
    expect(internals._mode.type).toBe("crystal")
    // a click off target changes nothing but leaves the mode
    internals._onCellDown({ x: 8, y: 0 }, 0)
    expect(internals._mode.type).toBe("move")
    internals._hud.emit("crystal", "extract", "elan")
    internals._onCellDown({ x: 4, y: 2 }, 0)
    tickUntil(fs, () => !internals._playing && !internals._pending)
    const report = reportOf(spec, fs.combat)
    expect(report.crystals?.extracted).toHaveLength(1)
    expect(report.crystals?.dead).toEqual(["b"])
    expect(report.lacune?.cells).toBe(1)
  })

  test("the cold freezes an enemy: the report keeps it", () => {
    const fs = mount(
      new FightScene(
        fightOptions(spec, 5, 1, { items: [], unlocks: [] }, () => []),
      ),
    )
    fs.startFight()
    const internals = fs as any
    const brutus = untilBrutus(fs)!
    const foe = fs.combat.fighters.find((f) => f.presetId === "squalor")!
    foe.position = { x: 4, y: 3 }
    internals._hud.emit("crystal", "gel", "elan")
    internals._onCellDown({ x: 4, y: 3 }, 0)
    tickUntil(fs, () => !internals._playing && !internals._pending)
    expect(brutus.alive).toBe(true)
    const report = reportOf(spec, fs.combat)
    expect(report.gel?.frozen.map((g) => g.fighterId)).toEqual([foe.id])
  })
})

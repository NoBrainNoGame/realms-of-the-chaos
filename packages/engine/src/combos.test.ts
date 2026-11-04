import { describe, expect, test } from "bun:test"
import { decide } from "./ai"
import { Board } from "./board"
import { Combat } from "./combat"
import {
  ACTIONS,
  AFFINITIES,
  CHARACTERS,
  COMBO_COOLDOWN_BONUS,
  comboAction,
} from "./content"
import type { Point } from "./geometry"
import type { FightEvent, Fighter } from "./types"

function setup(
  fighters: [string, Point][][],
  controller: "human" | "ai" = "human",
) {
  return new Combat({
    seed: 1,
    board: new Board(9, 9),
    teams: fighters.map((team) => ({
      controller,
      fighters: team.map(([id]) => id),
    })),
    positions: fighters.map((team) => team.map(([, p]) => p)),
  })
}

function turnOf(combat: Combat, fighter: Fighter) {
  for (const f of combat.fighters) {
    if (f !== fighter)
      f.nextActionAt = Math.max(f.nextActionAt, combat.time + 500)
  }
  fighter.nextActionAt = combat.time
  combat.run()
  expect(combat.activeFighter).toBe(fighter)
}

const ofType = <T extends FightEvent["type"]>(events: FightEvent[], type: T) =>
  events.filter((e): e is Extract<FightEvent, { type: T }> => e.type === type)

const power = (effects: { type: string }[], kind?: string) =>
  effects
    .filter((e: any) => e.type === "damage" && (!kind || e.kind === kind))
    .reduce((sum, e: any) => sum + e.power, 0)

describe("combo definitions", () => {
  test("every character has an affinity with a description", () => {
    for (const preset of Object.values(CHARACTERS)) {
      expect(AFFINITIES[preset.affinity]).toBeDefined()
    }
  })

  test("every pair of characters gives a valid combo on the signature action", () => {
    for (const owner of Object.values(CHARACTERS)) {
      for (const partner of Object.values(CHARACTERS)) {
        const combo = comboAction(owner, partner)
        expect(combo.combo).toEqual({
          baseId: owner.actions[0],
          partnerPresetId: partner.id,
        })
        expect(combo.id).toBe(`combo:${owner.actions[0]}:${partner.id}`)
        expect(combo.cooldown).toBe(
          (ACTIONS[owner.actions[0]].cooldown ?? 0) + COMBO_COOLDOWN_BONUS,
        )
        expect(combo.effects.length).toBeGreaterThan(0)
      }
    }
  })

  test("the base action is never mutated", () => {
    const before = JSON.stringify(ACTIONS)
    for (const owner of Object.values(CHARACTERS)) {
      for (const partner of Object.values(CHARACTERS))
        comboAction(owner, partner)
    }
    expect(JSON.stringify(ACTIONS)).toBe(before)
  })

  test("magic adds magical damage (or stronger heals)", () => {
    const blade = comboAction(CHARACTERS.nyx, CHARACTERS.merlin)
    expect(power(blade.effects, "magical")).toBe(5)
    const heal = comboAction(CHARACTERS.lyra, CHARACTERS.merlin)
    expect(heal.effects).toContainEqual({ type: "heal", power: 11 })
  })

  test("strength hits 30% harder and pushes further, for the same cost", () => {
    const bash = comboAction(CHARACTERS.brutus, CHARACTERS.gorr)
    expect(power(bash.effects)).toBe(Math.ceil(7 * 1.3))
    expect(bash.effects).toContainEqual({ type: "push", distance: 3 })
    expect(bash.timeCost).toBe(ACTIONS.shieldBash.timeCost)
  })

  test("precision extends the range", () => {
    expect(comboAction(CHARACTERS.merlin, CHARACTERS.lyra).launch.max).toBe(5)
    expect(comboAction(CHARACTERS.lyra, CHARACTERS.eva).launch.max).toBe(6)
    expect(comboAction(CHARACTERS.nyx, CHARACTERS.eva).launch.max).toBe(2)
  })

  test("faith heals the launcher, shadow is faster", () => {
    expect(comboAction(CHARACTERS.eva, CHARACTERS.lyra).effects).toContainEqual(
      { type: "selfHeal", power: 5 },
    )
    expect(comboAction(CHARACTERS.brutus, CHARACTERS.nyx).timeCost).toBeCloseTo(
      ACTIONS.shieldBash.timeCost * 0.6,
    )
  })

  test("the doc's enchanted arrow: Eva with Merlin", () => {
    const arrow = comboAction(CHARACTERS.eva, CHARACTERS.merlin)
    expect(arrow.name).toBe("Flèche incendiaire")
    expect(arrow.area).toEqual({ shape: "diamond", max: 1 })
    expect(power(arrow.effects, "magical")).toBe(6)
  })
})

describe("combos in a fight", () => {
  test("an ally on the same cell unlocks a combo for both", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["merlin", { x: 0, y: 0 }],
      ],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva, merlin] = combat.fighters
    expect(combat.actionsOf(eva).map((a) => a.id)).toContain(
      "combo:arrow:merlin",
    )
    expect(combat.actionsOf(merlin).map((a) => a.id)).toContain(
      "combo:fireball:eva",
    )
  })

  test("no combo when alone or next to an enemy", () => {
    const combat = setup([
      [["eva", { x: 0, y: 0 }]],
      [["gorr", { x: 1, y: 0 }]],
    ])
    const [eva] = combat.fighters
    expect(combat.actionsOf(eva)).toHaveLength(eva.actions.length)
  })

  test("a full cell gives one combo per different partner", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["merlin", { x: 0, y: 0 }],
        ["brutus", { x: 0, y: 0 }],
      ],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva] = combat.fighters
    const combos = combat.actionsOf(eva).filter((a) => a.combo)
    expect(combos.map((a) => a.id).sort()).toEqual([
      "combo:arrow:brutus",
      "combo:arrow:merlin",
    ])
  })

  test("using a combo deals the extra damage and reports the partner", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["merlin", { x: 0, y: 0 }],
      ],
      [
        ["gorr", { x: 4, y: 0 }],
        ["nyx", { x: 4, y: 1 }],
      ],
    ])
    const [eva, merlin, gorr, nyx] = combat.fighters
    turnOf(combat, eva)
    const result = combat.useAction("combo:arrow:merlin", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    const used = ofType(result.events, "actionUsed")[0]
    expect(used.baseActionId).toBe("arrow")
    expect(used.partnerId).toBe(merlin.id)
    // the explosion also hits Nyx next to Gorr
    const hit = new Set(
      ofType(result.events, "damaged").map((e) => e.fighterId),
    )
    expect(hit).toEqual(new Set([gorr.id, nyx.id]))
    expect(eva.cooldowns["combo:arrow:merlin"]).toBe(COMBO_COOLDOWN_BONUS + 1)
  })

  test("a combo is refused once the partner has left", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["merlin", { x: 0, y: 0 }],
      ],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva, merlin, gorr] = combat.fighters
    merlin.position = { x: 1, y: 0 }
    turnOf(combat, eva)
    expect(combat.useAction("combo:arrow:merlin", gorr.position)).toEqual({
      ok: false,
      reason: "Action inconnue",
    })
  })

  test("faith combo heals the launcher", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["lyra", { x: 0, y: 0 }],
      ],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva, , gorr] = combat.fighters
    eva.hp -= 30
    turnOf(combat, eva)
    const result = combat.useAction("combo:arrow:lyra", gorr.position)
    if (!result.ok) throw new Error(result.reason)
    expect(ofType(result.events, "healed")[0]).toMatchObject({
      fighterId: eva.id,
    })
  })

  test("normal actions stay available next to the combos", () => {
    const combat = setup([
      [
        ["eva", { x: 0, y: 0 }],
        ["merlin", { x: 0, y: 0 }],
      ],
      [["gorr", { x: 4, y: 0 }]],
    ])
    const [eva, , gorr] = combat.fighters
    turnOf(combat, eva)
    expect(combat.useAction("arrow", gorr.position).ok).toBe(true)
  })
})

describe("AI and combos", () => {
  test("uses a combo when it is the best option", () => {
    const combat = setup(
      [
        [
          ["eva", { x: 0, y: 0 }],
          ["merlin", { x: 0, y: 0 }],
        ],
        [
          ["gorr", { x: 4, y: 0 }],
          ["nyx", { x: 4, y: 1 }],
        ],
      ],
      "ai",
    )
    const [eva] = combat.fighters
    const [command] = decide(combat, eva)
    expect(command).toMatchObject({
      type: "action",
      actionId: "combo:arrow:merlin",
    })
  })

  test("walks onto an ally's cell to unlock a combo", () => {
    const combat = setup(
      [
        [
          ["eva", { x: 0, y: 0 }],
          ["merlin", { x: 2, y: 4 }],
        ],
        [
          ["gorr", { x: 6, y: 4 }],
          ["nyx", { x: 6, y: 5 }],
        ],
      ],
      "ai",
    )
    const [eva, merlin] = combat.fighters
    // nothing in range: from Merlin's cell, the enchanted arrow hits both enemies
    const commands = decide(combat, eva)
    expect(commands[0]).toEqual({ type: "move", destination: merlin.position })
  })
})

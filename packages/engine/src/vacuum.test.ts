import { describe, expect, test } from "bun:test"
import { bestAction, decide, usefulActions } from "./ai"
import { Board } from "./board"
import { Combat } from "./combat"
import { ACTIONS, CHARACTERS, FORBIDDEN_ACTIONS } from "./content"
import {
  type CustomCharacter,
  checkCustom,
  customDefaults,
  PICKABLE_ACTIONS,
} from "./custom"
import { checkSpell } from "./spells"
import type { FightEvent } from "./types"

const SPELLS = [...CHARACTERS.merlin.actions.slice(0, 2), "vacuumDecay"]
const character = (): CustomCharacter => ({
  name: "Aube",
  kit: "merlin",
  stats: customDefaults("merlin", SPELLS),
  spells: SPELLS,
})

describe("vacuum decay", () => {
  test("is forbidden: in no kit, not pickable, not in the catalogue", () => {
    expect(FORBIDDEN_ACTIONS.vacuumDecay.name).toBe("Vacuum decay")
    expect(ACTIONS.vacuumDecay).toBeUndefined()
    expect(PICKABLE_ACTIONS).not.toContain("vacuumDecay")
    for (const c of Object.values(CHARACTERS))
      expect(c.actions).not.toContain("vacuumDecay")
  })

  test("a custom character refuses it unless the caller allows it", () => {
    const refused = checkCustom(character())
    expect(refused.ok).toBe(false)
    const allowed = checkCustom(character(), { forbidden: true })
    expect(allowed.ok).toBe(true)
    if (!allowed.ok) return
    expect(allowed.preset.actions).toContain("vacuumDecay")
    expect(allowed.preset.actionDefs?.vacuumDecay).toBeDefined()
  })

  test("the spell builder never produces it", () => {
    expect(
      checkSpell({ name: "Vide", effects: [{ type: "vacuumDecay" }] } as never)
        .ok,
    ).toBe(false)
  })

  test("using it ends the fight with no winner and emits the event", () => {
    const check = checkCustom(character(), { forbidden: true })
    if (!check.ok) throw new Error(check.reason)
    const combat = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: [check.preset] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 1, y: 1 }], [{ x: 7, y: 7 }]],
    })
    const caster = combat.fighters[0]
    for (const f of combat.fighters) f.nextActionAt = 500
    caster.nextActionAt = 0
    combat.run()
    expect(combat.activeFighter).toBe(caster)
    const result = combat.useAction("vacuumDecay", caster.position)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const types = result.events.map((e: FightEvent) => e.type)
    expect(types).toContain("vacuumDecay")
    expect(types.at(-1)).toBe("ended")
    expect(combat.state).toBe("ended")
    expect(combat.winnerTeam).toBeNull()
    expect(combat.collapsed).toBe(true)
    // replays agree
    const replay = Combat.replay(
      {
        seed: 1,
        board: new Board(9, 9),
        teams: [
          { controller: "human", fighters: [check.preset] },
          { controller: "ai", fighters: ["gorr"] },
        ],
        positions: [[{ x: 1, y: 1 }], [{ x: 7, y: 7 }]],
      },
      [],
    )
    expect(replay.collapsed).toBe(false)
  })

  test("the AI never uses it", () => {
    const check = checkCustom(character(), { forbidden: true })
    if (!check.ok) throw new Error(check.reason)
    const combat = new Combat({
      seed: 3,
      teams: [
        { controller: "ai", fighters: [check.preset] },
        { controller: "ai", fighters: ["gorr"] },
      ],
    })
    const caster = combat.fighters[0]
    expect(bestAction(combat, caster)?.action.id).not.toBe("vacuumDecay")
    expect(usefulActions(combat, caster)).not.toContain("vacuumDecay")
    expect(JSON.stringify(decide(combat, caster))).not.toContain("vacuumDecay")
    combat.run()
    expect(combat.state).toBe("ended")
    expect(combat.collapsed).toBe(false)
  })
})

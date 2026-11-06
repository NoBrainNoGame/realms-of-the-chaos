import { beforeEach, describe, expect, test } from "bun:test"
import {
  buildSpell,
  checkSpells,
  customDefaults,
  customPreset,
  MAX_SPELLS,
  previewSpell,
  type SpellRecipe,
} from "@realms/engine"
import { clearStorage, customCharacters } from "../storage"
import { mount, tick } from "../test/harness"
import Creator from "./Creator"
import FightScene, { classicFight } from "./FightScene"
import SpellForge from "./SpellForge"

beforeEach(() => clearStorage())

const fire: SpellRecipe = {
  name: "Éclair ardent",
  target: "any",
  launch: { shape: "diamond", min: 0, max: 6 },
  lineOfSight: false,
  effects: [{ type: "damage", kind: "physical", power: 3 }],
}

describe("spell forge", () => {
  test("stepping a part changes the derived delay and the text", () => {
    const forge = mount(new SpellForge(fire, [], 1))
    const cost = forge.preview.cost
    const text = forge.description
    expect(forge.canStep("launchMax", -1)).toBe(true)
    expect(forge.step("launchMax", -1)).toBe(true)
    expect(forge.recipe.launch.max).toBe(5)
    expect(forge.preview.cost).toBeLessThan(cost)
    forge.step("e0:amount", 1)
    expect(forge.description).not.toBe(text)
    expect(forge.valueOf("e0:amount")).toBe("4")
    tick(forge, 100)
  })

  test("an over-powered recipe cannot be validated, and says why", () => {
    const forge = mount(new SpellForge(fire, [], 1))
    let done = 0
    forge.on("done", () => done++)
    forge.step("areaShape", 1)
    forge.step("areaMax", 1)
    forge.step("areaShape", 1)
    forge.step("affects", 1)
    forge.step("launchMax", 1)
    while (forge.step("e0:amount", 1));
    forge.addEffect()
    expect(previewSpell(forge.recipe).reason).not.toBeNull()
    expect(forge.canValidate).toBe(false)
    expect(forge.validate()).toBe(false)
    expect(done).toBe(0)
    tick(forge, 100)
    const find = (v: any, label: string): any =>
      v.label === label
        ? v
        : v.children?.map((c: any) => find(c, label)).find(Boolean)
    const root = (forge as any)._container
    expect(find(root, "forge:reason")).toBeTruthy()
    expect(find(root, "forge:validate")).toBeTruthy()
    // easing back to something fair validates again
    while (forge.step("e0:amount", -1));
    forge.removeEffect(1)
    forge.step("areaShape", -1)
    forge.step("areaShape", -1)
    forge.step("areaShape", -1)
    forge.step("areaShape", -1)
    forge.step("launchMax", -1)
    while (forge.step("launchMax", -1));
    expect(forge.canValidate).toBe(true)
    expect(forge.validate()).toBe(true)
    expect(done).toBe(1)
  })

  test("names are generated, effects added and removed, Escape cancels", () => {
    const forge = mount(new SpellForge(undefined, ["Autre sort"], 4))
    let cancelled = 0
    forge.on("cancel", () => cancelled++)
    const names = new Set<string>()
    for (let i = 0; i < 10; i++) {
      forge.rerollName()
      names.add(forge.recipe.name)
    }
    expect(names.size).toBeGreaterThan(4)
    expect(forge.canValidate).toBe(true)
    const effects = forge.recipe.effects.length
    if (effects === 1) {
      expect(forge.addEffect()).toBe(true)
      expect(forge.recipe.effects).toHaveLength(2)
      expect(forge.removeEffect(1)).toBe(true)
    }
    expect(forge.removeEffect(0)).toBe(false)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(cancelled).toBe(1)
  })
})

describe("spells in the workshop", () => {
  test("untouched, the kit's actions are kept", () => {
    const creator = mount(new Creator(undefined, 3))
    expect(creator.ownSpells).toBe(false)
    expect(creator.character.spells).toBeUndefined()
    expect(creator.stats).toEqual(customDefaults(creator.kit))
  })

  test("changing spells keeps the stats valid, saves them, and edits them", () => {
    const creator = mount(new Creator(undefined, 3))
    expect(creator.setSpell(0, "heal")).toBe(true)
    expect(creator.ownSpells).toBe(true)
    expect(creator.spells[0]).toBe("heal")
    expect(creator.canSave).toBe(true)
    // forged through the chooser and the forge
    const kit = creator.kit
    creator.openChooser(1)
    const forge = creator.openForge(1)!
    expect(forge).toBeTruthy()
    // the workshop is hidden, its own keys are off while forging
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
    expect(creator.kit).toBe(kit)
    expect(forge.validate()).toBe(true)
    expect(creator.forge).toBeNull()
    expect(typeof creator.spells[1]).toBe("object")
    expect(creator.spells).toHaveLength(3)
    expect(creator.canSave).toBe(true)
    // every stat still has a valid range
    expect(creator.health).toBeGreaterThan(0)
    expect(creator.removeSpell(0)).toBe(true)
    expect(creator.removeSpell(0)).toBe(true)
    expect(creator.removeSpell(0)).toBe(false)
    expect(creator.spells).toHaveLength(1)
    creator.setSpell(1, "blade")
    expect(creator.spells).toHaveLength(2)
    expect(creator.setSpell(MAX_SPELLS, "kick")).toBe(false)
    tick(creator, 100)

    expect(creator.save()).toBe(true)
    const saved = customCharacters()[0]
    expect(saved.spells).toEqual(creator.spells as any)
    expect(checkSpells(saved.spells).ok).toBe(true)
    const edit = mount(new Creator(saved.name, 2))
    expect(edit.spells).toEqual(saved.spells as any)
    edit.resetSpells()
    expect(edit.ownSpells).toBe(false)
    tick(edit, 100)
  })

  test("the chooser lists pickable actions by page and cancels with Escape", () => {
    const creator = mount(new Creator(undefined, 3))
    creator.openChooser(0)
    expect(creator.chooser).toEqual({ slot: 0, page: 0 })
    tick(creator, 100)
    creator.chooserPage(1)
    expect(creator.chooser?.page).toBe(1)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(creator.chooser).toBeNull()
    creator.openChooser(0)
    expect(creator.pickAction("blade")).toBe(true)
    expect(creator.spells[0]).toBe("blade")
    expect(creator.pickAction("nope")).toBe(false)
    tick(creator, 100)
  })
})

describe("a forged spell in a fight", () => {
  test("shows in the action bar and plays its generic visuals", () => {
    const recipe: SpellRecipe = {
      name: "Trait vif",
      target: "self",
      launch: { shape: "point", min: 0, max: 0 },
      lineOfSight: false,
      effects: [{ type: "heal", power: 6 }],
    }
    const character = {
      name: "Zaren",
      kit: "eva",
      stats: customDefaults("eva", [recipe, "kick"]),
      spells: [recipe, "kick"],
    }
    const preset = customPreset(character)
    const s = mount(
      new FightScene(
        classicFight({
          seed: 8,
          spectate: false,
          speed: 4,
          playerTeam: [preset],
          enemyTeam: ["gorr"],
        }),
      ),
    )
    const internals = s as any
    const runUntil = (done: () => boolean) => {
      for (let t = 0; t < 120_000 && !done(); t += 50)
        s.tick({ timeSinceLastTick: 50 })
    }
    runUntil(() => internals._inputReady && s.combat.activeFighter?.team === 0)
    const me = s.combat.activeFighter!
    const id = buildSpell(recipe).id
    expect(s.combat.actionsOf(me).map((a) => a.id)).toContain(id)
    const find = (v: any): any =>
      v.label === id ? v : v.children?.map(find).find(Boolean)
    expect(find(internals._hud.container)).toBeTruthy()

    internals._hud.emit("action", id)
    internals._board.emit("cellDown", me.position, 0)
    expect(
      s.combat.log.some((e) => e.type === "useAction" && e.actionId === id),
    ).toBe(true)
    runUntil(() => !internals._playing && !internals._pending)
    expect(s.combat.log.some((e) => e.type === "useAction")).toBe(true)
  })
})

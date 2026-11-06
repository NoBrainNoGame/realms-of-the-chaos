import { beforeEach, describe, expect, test } from "bun:test"
import {
  CHARACTERS,
  CUSTOM_NAME,
  CUSTOM_STATS,
  CUSTOM_STEP,
  customDefaults,
  customRange,
} from "@realms/engine"
import { generateName } from "../names"
import {
  clearStorage,
  customCharacters,
  customId,
  deleteCustom,
  SAVE_KEYS,
  saveCustom,
} from "../storage"
import { mount, tick } from "../test/harness"
import ArcadeRun from "./ArcadeRun"
import Creator from "./Creator"
import FightScene from "./FightScene"
import { pickedFight } from "./Game"
import { lookOf } from "./looks"
import TeamPicker, { DIFFICULTIES } from "./TeamPicker"

const sample = (name = "Zaren") => ({
  name,
  kit: "eva",
  stats: customDefaults("eva"),
})

beforeEach(() => clearStorage())

describe("custom storage", () => {
  test("round trip, replace by name, delete", () => {
    expect(customCharacters()).toEqual([])
    saveCustom(sample())
    saveCustom({ ...sample(), kit: "gorr", stats: customDefaults("gorr") })
    expect(customCharacters()).toHaveLength(1)
    expect(customCharacters()[0].kit).toBe("gorr")
    saveCustom(sample("Mira"))
    expect(customCharacters().map((c) => c.name)).toEqual(["Zaren", "Mira"])
    deleteCustom("Zaren")
    expect(customCharacters().map((c) => c.name)).toEqual(["Mira"])
  })

  test("invalid entries are dropped, at most 12 are kept", () => {
    localStorage.setItem(
      SAVE_KEYS.custom,
      JSON.stringify([
        sample(),
        { ...sample("Bad1"), kit: "nobody" },
        { ...sample("B4d name!") },
        { name: "NoStats", kit: "eva" },
        null,
        42,
      ]),
    )
    expect(customCharacters().map((c) => c.name)).toEqual(["Zaren"])
    localStorage.setItem(SAVE_KEYS.custom, "not json")
    expect(customCharacters()).toEqual([])
    for (let i = 0; i < 15; i++)
      saveCustom(sample(`Nom${"abcdefghijklmnop"[i]}`))
    expect(customCharacters()).toHaveLength(12)
  })
})

describe("names", () => {
  test("generated names pass the rules and are deterministic", () => {
    for (let seed = 0; seed < 300; seed++) {
      const name = generateName(seed)
      expect(CUSTOM_NAME.test(name)).toBe(true)
      expect(generateName(seed)).toBe(name)
    }
    expect(
      new Set(Array.from({ length: 50 }, (_, i) => generateName(i))).size,
    ).toBeGreaterThan(30)
  })
})

describe("creator", () => {
  test("steps a stat within its range, and shows the solved health", () => {
    const creator = mount(new Creator(undefined, 5))
    const stat = CUSTOM_STATS[1]
    const before = creator.stats[stat]
    const health = creator.health
    expect(creator.step(stat, 1)).toBe(true)
    expect(creator.stats[stat]).toBe(before + CUSTOM_STEP)
    expect(creator.health).toBeLessThan(health)
    // walks to the top, stops there
    while (creator.step(stat, 1));
    expect(creator.stats[stat]).toBe(creator.range(stat).max)
    expect(creator.canStep(stat, 1)).toBe(false)
    expect(creator.canStep(stat, -1)).toBe(true)
    while (creator.step(stat, -1));
    expect(creator.stats[stat]).toBe(
      customRange(creator.kit, creator.stats, stat).min,
    )
    tick(creator, 100)
  })

  test("changes the kit (arrows), rerolls names that are valid", () => {
    const creator = mount(new Creator(undefined, 9))
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
    expect(creator.kit).toBe(Object.keys(CHARACTERS)[1])
    expect(creator.stats).toEqual(customDefaults(creator.kit))
    const names = new Set<string>()
    for (let i = 0; i < 20; i++) {
      creator.rerollName()
      expect(CUSTOM_NAME.test(creator.name)).toBe(true)
      names.add(creator.name)
    }
    expect(names.size).toBeGreaterThan(10)
    tick(creator, 100)
  })

  test("saves and goes back; edits and deletes", () => {
    const creator = mount(new Creator(undefined, 1))
    let backs = 0
    creator.on("back", () => backs++)
    creator.step("luck", 1)
    const { name } = creator
    expect(creator.save()).toBe(true)
    expect(backs).toBe(1)
    expect(customCharacters().map((c) => c.name)).toEqual([name])

    const edit = mount(new Creator(name, 2))
    expect(edit.editing).toBe(name)
    expect(edit.stats).toEqual(customCharacters()[0].stats)
    tick(edit, 100)
    edit.remove()
    expect(customCharacters()).toEqual([])
    expect(edit.editing).toBeNull()
  })
})

describe("a custom fighter", () => {
  test("shows in the picker and fights", () => {
    saveCustom({
      ...sample("Zaren"),
      kit: "lyra",
      stats: customDefaults("lyra"),
    })
    const id = "custom:Zaren"
    expect(lookOf(id)).toBe("lyra")
    const picker = mount(new TeamPicker("skirmish", { seed: 3 }))
    expect(picker.focusedId).toBe(Object.keys(CHARACTERS)[0])
    const ids = (picker as any)._cards.map((c: any) => c.id)
    expect(ids).toEqual([...Object.keys(CHARACTERS), id])
    picker.toggle(id)
    picker.add("gorr")
    expect(picker.picks[0]).toEqual([id, "gorr"])
    tick(picker, 100)
    // offered to the arcade too
    const arcade = mount(new TeamPicker("arcade", { seed: 3 }))
    expect((arcade as any)._cards).toHaveLength(
      Object.keys(CHARACTERS).length + 1,
    )

    const options = pickedFight(
      {
        mode: "skirmish",
        teams: [picker.picks[0].slice()],
        enemies: ["nyx"],
        difficulty: DIFFICULTIES[1],
        seed: 3,
      },
      4,
    )
    const scene = mount(new FightScene(options))
    expect(scene.combat.fighters.some((f) => f.presetId === id)).toBe(true)
    tick(scene, 1500)
  })

  test("a custom that vanished is skipped", () => {
    const options = pickedFight(
      {
        mode: "skirmish",
        teams: [["custom:Ghost", "eva"]],
        enemies: ["nyx"],
        difficulty: DIFFICULTIES[1],
        seed: 3,
      },
      4,
    )
    expect(options.teams[0].fighters).toEqual(["eva"])
  })
})

describe("a custom fighter in the arcade", () => {
  test("joins the run as its character, and the run is verifiable", () => {
    saveCustom(sample())
    const id = customId(sample().name)
    const run = mount(new ArcadeRun([id, "gorr"], { speed: 4, seed: 9 }))
    expect(run.run.team[0]).toEqual(sample())
    const scene = run.screen as FightScene
    const fighter = scene.combat.fighters.find((f) => f.presetId === id)!
    expect(scene.combat.presetOf(fighter).name).toBe(sample().name)
    expect(lookOf(id)).toBe(sample().kit)
  })
})

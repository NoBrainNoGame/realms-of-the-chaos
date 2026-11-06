import { beforeEach, describe, expect, test } from "bun:test"
import {
  CHARACTERS,
  customDefaults,
  FORBIDDEN_ACTIONS,
  PICKABLE_ACTIONS,
  presetPower,
  scarredCharacters,
} from "@realms/engine"
import type { Container } from "pixi.js"
import { ENDING_BASCULE, ENDING_GRATUITE } from "../endings"
import { parseParams } from "../params"
import { resetSettings, updateSettings } from "../settings"
import {
  adventureSave,
  arcadeBest,
  clearStorage,
  congratulateNext,
  customCharacters,
  endingsSeen,
  grantHeroSpell,
  markEnding,
  SAVE_KEYS,
  SAVE_PREFIX,
  saveCustom,
  scarCount,
  secondEndingAvailable,
  submitArcadeScore,
  takeCongratulation,
  vacuumDecayWipe,
} from "../storage"
import { mount, tick } from "../test/harness"
import { tickUntil } from "../test/play"
import Creator from "./Creator"
import type FightScene from "./FightScene"
import { classicFight } from "./FightScene"
import Game from "./Game"
import { resolveFighters } from "./looks"
import { hslToRgb, rgbToHsl, scarTint } from "./scarTint"
import TeamPicker from "./TeamPicker"
import { applyScars, COLORS, GROUND_TOP, MEANING, SKY } from "./theme"

const SPELLS = [...CHARACTERS.merlin.actions.slice(0, 2), "vacuumDecay"]
const caster = () => ({
  name: "Aube",
  kit: "merlin",
  stats: customDefaults("merlin", SPELLS),
  spells: SPELLS,
})

const labels = (root: Container, out: string[] = []): string[] => {
  if (root.label) out.push(root.label)
  for (const child of root.children) labels(child as Container, out)
  return out
}

beforeEach(() => {
  clearStorage()
  resetSettings()
  applyScars(0)
})

describe("the save", () => {
  test("the hero gets the spell by grant, once; a character never holds it", () => {
    grantHeroSpell("vacuumDecay")
    grantHeroSpell("vacuumDecay")
    expect(adventureSave().granted).toEqual(["vacuumDecay"])
    saveCustom(caster())
    expect(customCharacters()).toEqual([])
  })

  test("the wipe erases every save key, keeps settings and scars", () => {
    grantHeroSpell("vacuumDecay")
    submitArcadeScore({ score: 300, waves: 3, team: ["eva"], date: "x" })
    // a future key under the prefix is wiped too
    localStorage.setItem(`${SAVE_PREFIX}adventure.chapter`, "7")
    updateSettings({ textSize: 1.3 })
    localStorage.setItem("realms.timeline.expanded", "1")
    expect(scarCount()).toBe(0)

    expect(vacuumDecayWipe()).toBe(1)
    expect(arcadeBest()).toBeNull()
    expect(customCharacters()).toEqual([])
    expect(adventureSave().granted).toEqual([])
    for (const key of Object.values(SAVE_KEYS))
      expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem(`${SAVE_PREFIX}adventure.chapter`)).toBeNull()
    expect(localStorage.getItem("realms.settings")).toContain("1.3")
    expect(localStorage.getItem("realms.timeline.expanded")).toBe("1")
    expect(scarCount()).toBe(1)
    expect(vacuumDecayWipe()).toBe(2)
  })

  test("an old save (keys without prefix) is moved, then wiped like the rest", () => {
    localStorage.setItem("realms.arcade.best", "{}")
    vacuumDecayWipe()
    expect(localStorage.getItem("realms.arcade.best")).toBeNull()
  })
})

describe("using it in a game", () => {
  test("a skirmish refuses it: nothing is wiped, no scar", () => {
    saveCustom({ ...caster(), spells: SPELLS.slice(0, 2) })
    submitArcadeScore({ score: 300, waves: 3, team: ["eva"], date: "x" })
    const game = mount(new Game(parseParams(new URLSearchParams(""))))
    game.show({
      type: "fight",
      options: classicFight({
        seed: 5,
        speed: 4,
        spectate: false,
        playerTeam: resolveFighters(["custom:Aube"]),
        enemyTeam: ["gorr"],
      }),
    })
    const scene = game.current as FightScene
    const internals = scene as any
    scene.startFight()
    tickUntil(scene, () => internals._inputReady)
    const me = scene.combat.activeFighter!
    expect(scene.combat.actionsOf(me).map((a) => a.id)).not.toContain(
      "vacuumDecay",
    )
    expect(scene.combat.useAction("vacuumDecay", me.position).ok).toBe(false)
    expect(scene.combat.collapsed).toBe(false)
    expect(arcadeBest()).not.toBeNull()
    expect(scarCount()).toBe(0)
  })
})

describe("the workshop", () => {
  const chooserLabels = (creator: Creator) => {
    creator.openChooser(2)
    tick(creator, 100)
    return labels(creator.container)
  }

  test("never offers the forbidden spell, even when the hero owns it", () => {
    expect(PICKABLE_ACTIONS).not.toContain("vacuumDecay")
    grantHeroSpell("vacuumDecay")
    const creator = mount(new Creator(undefined, 3))
    expect(chooserLabels(creator)).not.toContain("creator:pick:vacuumDecay")
    expect(creator.pickAction("vacuumDecay")).toBe(false)
    expect(FORBIDDEN_ACTIONS.vacuumDecay.name).toBe("Vacuum decay")
  })

  test("no scar leaves every colour alone", () => {
    for (const c of [0x15121f, 0x4dabf7, 0xffffff, 0x5e9a3c])
      expect(scarTint(c, 0)).toBe(c)
    const before = JSON.stringify({ COLORS, MEANING, GROUND_TOP, SKY })
    applyScars(0)
    expect(JSON.stringify({ COLORS, MEANING, GROUND_TOP, SKY })).toBe(before)
  })

  test("colours drift a little, deterministically, with lightness kept", () => {
    for (const scars of [1, 3, 10, 100]) {
      for (const color of [
        ...Object.values(COLORS),
        ...Object.values(MEANING),
      ]) {
        const tinted = scarTint(color, scars)
        expect(scarTint(color, scars)).toBe(tinted)
        const [h0, s0, l0] = rgbToHsl(color)
        const [h1, s1, l1] = rgbToHsl(tinted)
        if (s0 < 0.06 || l0 < 0.02 || l0 > 0.98) continue
        const dh = Math.min(Math.abs(h1 - h0), 360 - Math.abs(h1 - h0))
        expect(dh).toBeLessThanOrEqual(30)
        expect(Math.abs(s1 - s0)).toBeLessThanOrEqual(0.11)
        expect(Math.abs(l1 - l0)).toBeLessThanOrEqual(0.02)
      }
    }
    expect(hslToRgb(...rgbToHsl(0x4dabf7))).toBe(0x4dabf7)
  })

  test("applyScars drifts the palettes in place, and 0 restores them", () => {
    const original = COLORS.reachable
    applyScars(1)
    expect(COLORS.reachable).not.toBe(original)
    expect(COLORS.reachable).toBe(scarTint(original, 1))
    applyScars(5)
    expect(COLORS.reachable).toBe(scarTint(original, 5))
    applyScars(0)
    expect(COLORS.reachable).toBe(original)
  })
})

describe("scars on the characters", () => {
  test("offline fighters are the scarred ones, same power, same ids", () => {
    vacuumDecayWipe()
    vacuumDecayWipe()
    const scarred = scarredCharacters(2)
    const resolved = resolveFighters(["merlin", "gorr", "eva", "nyx"])
    for (const entry of resolved) {
      const preset = typeof entry === "string" ? CHARACTERS[entry] : entry
      expect(presetPower(preset)).toBeCloseTo(
        presetPower(CHARACTERS[preset.id]),
        3,
      )
    }
    const changed = Object.keys(CHARACTERS).filter(
      (id) => scarred[id] !== CHARACTERS[id],
    )
    expect(changed.length).toBeGreaterThanOrEqual(2)
  })

  test("the team picker shows the scarred stats", () => {
    vacuumDecayWipe()
    const changed = Object.keys(CHARACTERS).find(
      (id) => scarredCharacters(1)[id] !== CHARACTERS[id],
    )!
    const picker = mount(new TeamPicker("skirmish", { seed: 1 })) as any
    expect(picker._roster[changed].stats).toEqual(
      scarredCharacters(1)[changed].stats,
    )
    expect(picker._roster[changed].stats).not.toEqual(CHARACTERS[changed].stats)
  })
})

describe("secret endings", () => {
  const start = () => mount(new Game(parseParams(new URLSearchParams(""))))

  test("an ending wipe records it, keeps settings, scars and endings", () => {
    grantHeroSpell("vacuumDecay")
    updateSettings({ textSize: 1.3 })
    expect(secondEndingAvailable()).toBe(false)

    expect(vacuumDecayWipe({ ending: ENDING_BASCULE })).toBe(1)
    expect(customCharacters()).toEqual([])
    expect(adventureSave().granted).toEqual([])
    expect(localStorage.getItem("realms.settings")).toContain("1.3")
    expect(endingsSeen()).toEqual([ENDING_BASCULE])
    expect(secondEndingAvailable()).toBe(true)

    // a later wipe keeps what was reached
    vacuumDecayWipe()
    expect(endingsSeen()).toEqual([ENDING_BASCULE])
    expect(scarCount()).toBe(2)
    expect(() => markEnding("nope")).toThrow()
  })

  test("the next start congratulates once, then the flag is gone", () => {
    vacuumDecayWipe({ ending: ENDING_BASCULE })
    const game = start()
    expect(game.screen).toEqual({ type: "congrats", ending: ENDING_BASCULE })
    expect(takeCongratulation()).toBeNull()
    ;(game.current as any).menu.select(0)
    expect(game.screen.type).toBe("title")
    expect(start().screen.type).toBe("title")
    expect(endingsSeen()).toEqual([ENDING_BASCULE])
  })

  test("a normal wipe congratulates nothing", () => {
    vacuumDecayWipe()
    expect(endingsSeen()).toEqual([])
    expect(start().screen.type).toBe("title")
  })

  test("the second ending needs the first, and is congratulated too", () => {
    markEnding(ENDING_GRATUITE)
    congratulateNext(ENDING_GRATUITE)
    expect(start().screen).toEqual({
      type: "congrats",
      ending: ENDING_GRATUITE,
    })
  })

  test("?ending= is read only for a known ending", () => {
    expect(parseParams(new URLSearchParams("ending=bascule")).ending).toBe(
      "bascule",
    )
    expect(parseParams(new URLSearchParams("ending=x")).ending).toBeNull()
  })
})

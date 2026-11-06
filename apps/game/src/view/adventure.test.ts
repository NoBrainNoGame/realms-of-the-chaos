import { beforeEach, describe, expect, test } from "bun:test"
import { CHAPTERS } from "@realms/adventure"
import { unlockedChapters } from "../adventure/progress"
import { parseParams } from "../params"
import { resetSettings } from "../settings"
import {
  adventureSave,
  clearStorage,
  scarCount,
  takeCongratulation,
  vacuumDecayWipe,
} from "../storage"
import { mount, tick } from "../test/harness"
import { playLocally } from "../test/play"
import type AppearanceEditor from "./AppearanceEditor"
import type Chronicles from "./Chronicles"
import type FightScene from "./FightScene"
import Game from "./Game"
import type StoryScene from "./StoryScene"
import type TitleScreen from "./TitleScreen"

const game = (query = "") =>
  mount(new Game(parseParams(new URLSearchParams(query))))

/** Reads and picks the first gesture until a fight card (or the end). */
function toFight(story: StoryScene) {
  for (let i = 0; i < 400; i++) {
    const f = story.frame
    if (f.kind === "fight" || f.kind === "done") return f
    if (f.kind === "choice") story.pick(f.options[0].id)
    else if (f.kind === "hub") story.pick(f.topics[0].id)
    else story.advance()
  }
  throw new Error("no fight")
}

/** Launches the fight of the story card through its own menu. */
function launch(g: Game) {
  const story = g.current as StoryScene
  toFight(story)
  story.menu!.select(0)
  expect(g.screen.type).toBe("fight")
  return g.current as FightScene
}

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("Chroniques", () => {
  test("the title menu opens the selector, which lists unlocked chapters only", () => {
    const g = game()
    const title = g.current as TitleScreen
    const item = title.menu.items.find((i) => i.id === "codex")!
    expect(item.enabled).not.toBe(false)
    title.menu.select(title.menu.items.indexOf(item))
    expect(g.screen.type).toBe("chronicles")
    const sel = g.current as Chronicles
    const ids = sel.menu.items.map((i) => i.id)
    expect(ids).toContain("new")
    expect(ids).not.toContain("resume")
    const locked = sel.menu.items.find(
      (i) => i.id === `chapter:${CHAPTERS[1].id}`,
    )
    expect(locked?.enabled).toBe(false)
    expect(unlockedChapters()).toEqual([CHAPTERS[0].id])
  })

  test("selector -> scene -> gesture -> fight -> next node, saved on the way", () => {
    const g = game("mode=chronicles")
    expect(g.screen.type).toBe("chronicles")
    const sel = g.current as Chronicles
    sel.menu.select(sel.menu.items.findIndex((i) => i.id === "new"))
    expect(g.screen.type).toBe("hero")
    ;(g.current as AppearanceEditor).validate()
    expect(g.screen.type).toBe("story")
    expect(adventureSave().body).not.toBeNull()
    const story = g.current as StoryScene
    expect(story.run.chapter).toBe("prologue")
    story.advance()
    expect(adventureSave().run?.pc).toBe(story.run.pc)

    const scene = launch(g)
    const before = adventureSave().run!
    const at = (r: { node: string; pc: number }) => `${r.node}:${r.pc}`
    scene.startFight()
    playLocally(scene)
    expect(scene.combat.state).toBe("ended")
    const won = scene.combat.winnerTeam === 0
    const id = won ? "continue" : "defeat"
    ;(scene as any).emit("endAction", id)
    if (won) {
      expect(g.screen.type).toBe("story")
      const next = g.current as StoryScene
      expect(next.debriefing).toBe(true)
      expect(at(next.run)).not.toBe(at(before))
      next.advance()
      expect(next.debriefing).toBe(false)
    } else {
      expect(g.screen.type).toBe("story")
    }
  })

  test("?chapter= opens that chapter, resuming restores the saved step", () => {
    const g = game("chapter=prologue")
    expect(g.screen.type).toBe("story")
    const story = g.current as StoryScene
    story.advance()
    story.advance()
    const pc = story.run.pc
    const g2 = game("mode=chronicles")
    const sel = g2.current as Chronicles
    sel.menu.select(sel.menu.items.findIndex((i) => i.id === "resume"))
    expect(g2.screen.type).toBe("story")
    expect((g2.current as StoryScene).run.pc).toBe(pc)
  })

  test("the end of a chapter unlocks the next one", () => {
    const g = game("chapter=prologue")
    const story = g.current as StoryScene
    const f = toFight(story)
    expect(f.kind).toBe("fight")
    // skip the fight through a victory report, then read to the end
    const scene = launch(g) as FightScene
    scene.startFight()
    playLocally(scene)
    ;(scene as any).emit(
      "endAction",
      scene.combat.winnerTeam === 0 ? "continue" : "defeat",
    )
    expect(g.screen.type).toBe("story")
    expect(unlockedChapters().length).toBeGreaterThanOrEqual(1)
  })
})

describe("the save", () => {
  test("adventure progress is wiped by vacuum decay, endings survive", () => {
    const g = game("chapter=prologue")
    ;(g.current as StoryScene).advance()
    expect(adventureSave().run).not.toBeNull()
    expect(localStorage.getItem("realms.save.adventure")).not.toBeNull()
    vacuumDecayWipe()
    expect(localStorage.getItem("realms.save.adventure")).toBeNull()
    expect(adventureSave().run).toBeNull()
    expect(adventureSave().completed).toEqual([])
  })

  test("vacuum decay inside an adventure fight wipes the save and scars", () => {
    const g = game("chapter=prologue")
    const scene = launch(g)
    const scars = scarCount()
    ;(scene as any).emit("vacuumDecay")
    tick(g, 100)
    expect(g.screen.type).toBe("collapse")
    expect(scarCount()).toBe(scars + 1)
    expect(adventureSave().run).toBeNull()
    expect(takeCongratulation()).toBeNull()
  })
})

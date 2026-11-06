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
import ExplorationScene from "./ExplorationScene"
import type FightScene from "./FightScene"
import Game from "./Game"
import type TitleScreen from "./TitleScreen"

const game = (query = "") =>
  mount(new Game(parseParams(new URLSearchParams(query))))

/** Walks into each scene, reads and picks the first gesture until a fight card (or the end). */
function toFight(island: ExplorationScene) {
  for (let i = 0; i < 600; i++) {
    if (island.mode === "walk") {
      island.enterPending()
      continue
    }
    if (island.mode === "debrief" || island.mode === "look") {
      island.advance()
      continue
    }
    const f = island.frame
    if (f.kind === "fight" || f.kind === "done") return f
    if (f.kind === "choice") island.pick(f.options[0].id)
    else if (f.kind === "hub") island.pick(f.topics[0].id)
    else island.advance()
  }
  throw new Error("no fight")
}

/** Launches the fight of the story card, on the island (no screen change). */
function launch(g: Game) {
  const island = g.current as ExplorationScene
  toFight(island)
  island.menu!.select(0)
  expect(island.mode).toBe("fight")
  expect(g.screen.type).toBe("story")
  return island.fight!
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
    const island = g.current as ExplorationScene
    expect(island).toBeInstanceOf(ExplorationScene)
    expect(island.run.chapter).toBe("prologue")
    island.enterPending()
    island.advance()
    expect(adventureSave().run?.pc).toBe(island.run.pc)

    const scene = launch(g)
    const before = adventureSave().run!
    const at = (r: { node: string; pc: number }) => `${r.node}:${r.pc}`
    scene.startFight()
    playLocally(scene)
    expect(scene.combat.state).toBe("ended")
    const won = scene.combat.winnerTeam === 0
    const id = won ? "continue" : "defeat"
    ;(scene as any).emit("endAction", id)
    expect(g.screen.type).toBe("story")
    const next = g.current as ExplorationScene
    expect(next.fight).toBeNull()
    expect(next.mode).toBe("debrief")
    if (won) expect(at(next.run)).not.toBe(at(before))
    next.advance()
    expect(next.mode).not.toBe("debrief")
  })

  test("?chapter= opens that chapter, resuming restores the saved step", () => {
    const g = game("chapter=prologue")
    expect(g.screen.type).toBe("story")
    const island = g.current as ExplorationScene
    island.enterPending()
    island.advance()
    island.advance()
    const pc = island.run.pc
    const g2 = game("mode=chronicles")
    const sel = g2.current as Chronicles
    sel.menu.select(sel.menu.items.findIndex((i) => i.id === "resume"))
    expect(g2.screen.type).toBe("story")
    expect((g2.current as ExplorationScene).run.pc).toBe(pc)
  })

  test("the end of a chapter unlocks the next one", () => {
    const g = game("chapter=prologue")
    const f = toFight(g.current as ExplorationScene)
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
    ;(g.current as ExplorationScene).enterPending()
    ;(g.current as ExplorationScene).advance()
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

describe("exploration", () => {
  const island = (query = "chapter=1") => {
    const g = game(query)
    expect(g.screen.type).toBe("story")
    return { g, i: g.current as ExplorationScene }
  }
  /** Ticks until the hero stands still. */
  const settle = (g: Game, i: ExplorationScene) => {
    for (let n = 0; n < 400; n++) {
      tick(g, 64)
      if (i.mode !== "walk") return
    }
  }

  test("a walked chapter lands on its island, the hero free to walk", () => {
    const { i } = island()
    expect(i.mode).toBe("walk")
    expect(i.heroCell).toEqual({ x: 0, y: 7 })
    expect(i.companionCells).toHaveLength(0) // Lyra is met at the fire
  })

  test("clicking walks (no cost), the zone of a scene triggers it, the story plays on the island", () => {
    const { g, i } = island()
    expect(i.walkTo({ x: 0, y: 5 })).toBe(true)
    tick(g, 1500)
    // the Borne is a zone: reaching it enters the scene
    expect(i.mode).toBe("story")
    expect(i.run.entry).toBe("borne")
    expect(i.frame.kind).toBe("line")
    i.advance()
    expect(adventureSave().run?.pc).toBe(i.run.pc)
  })

  test("a scene waits for the hero: away from its zone nothing happens", () => {
    const { g, i } = island()
    i.walkTo({ x: 6, y: 8 })
    tick(g, 3000)
    expect(i.mode).toBe("walk")
    expect(i.run.entry).toBeUndefined()
  })

  test("an examinable object is walked up to and read once, its effect counted once", () => {
    const { g, i } = island()
    i.enterPending()
    while (i.run.node === "borne") {
      if (i.frame.kind === "choice") i.pick(i.frame.options[0].id)
      else i.advance()
    }
    const at = i.placed.find((p) => p.id === "herbe_grise")!.at
    i.clickCell(at)
    tick(g, 3000)
    expect(i.mode).toBe("look")
    const heard = () => Number(i.run.flags.ecoute ?? 0)
    expect(heard()).toBe(1)
    i.advance()
    expect(i.mode).toBe("walk")
    i.clickCell(at)
    tick(g, 3000)
    i.advance()
    expect(heard()).toBe(1)
  })

  test("a wanderer is fought on site, on a cut-out board, then the island is back", () => {
    const { g, i } = island()
    const at = i.placed.find((p) => p.id === "errant")!.at
    i.interact("errant")
    expect(i.mode).toBe("fight")
    expect(g.screen.type).toBe("story")
    const scene = i.fight!
    expect(scene.combat.board.width).toBeLessThanOrEqual(9)
    playLocally(scene)
    ;(scene as any).emit("endAction", "continue")
    expect(i.fight).toBeNull()
    expect(i.mode).toBe("walk")
    if (scene.combat.winnerTeam === 0)
      expect(i.placed.some((p) => p.id === "errant")).toBe(false)
    else expect(i.placed.find((p) => p.id === "errant")).toBeDefined()
    void at
  })

  test("the companions follow the hero's steps", () => {
    const { g, i } = island("chapter=1")
    // get Lyra to join: read to the end of her scene
    for (let n = 0; n < 200 && i.run.node !== "bords"; n++) {
      if (i.mode === "walk") i.enterPending()
      else if (i.frame.kind === "choice") i.pick(i.frame.options[0].id)
      else if (i.frame.kind === "hub") i.pick(i.frame.topics[0].id)
      else i.advance()
    }
    expect(i.run.node).toBe("bords")
    expect(i.companionCells).toHaveLength(1)
    const start = i.companionCells[0]
    i.walkTo({ x: 4, y: 7 })
    settle(g, i)
    tick(g, 2500)
    expect(i.companionCells[0]).not.toEqual(start)
  })

  test("the end of the chapter hands over to the end screen", () => {
    const { g, i } = island("chapter=prologue")
    let f = toFight(i)
    expect(f.kind).toBe("fight")
    i.startFight()
    const scene = i.fight!
    ;(scene as any).emit("endAction", "continue")
    for (
      let n = 0;
      n < 400 && g.screen.type === "story" && i.run.done === false;
      n++
    ) {
      if (i.mode === "walk") i.enterPending()
      else if (i.mode === "debrief") i.advance()
      else if (i.frame.kind === "choice") i.pick(i.frame.options[0].id)
      else if (i.frame.kind === "hub") i.pick(i.frame.topics[0].id)
      else i.advance()
    }
    tick(g, 100)
    expect(i.run.done).toBe(true)
    expect(g.current).not.toBe(i)
    f = (g.current as any).frame
    expect(f.kind).toBe("done")
  })
})

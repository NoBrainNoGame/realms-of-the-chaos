import { beforeEach, describe, expect, test } from "bun:test"
import {
  CHAPTERS,
  ENDING_NAMES,
  type Ending,
  type EndingResult,
  type FightReport,
  type FightSpec,
} from "@realms/adventure"
import { parseParams } from "../params"
import { resetSettings } from "../settings"
import { adventureSave, clearStorage, endingsSeen } from "../storage"
import { mount, tick } from "../test/harness"
import type Epilogue from "./Epilogue"
import ExplorationScene from "./ExplorationScene"
import Game from "./Game"
import type StoryScene from "./StoryScene"

const game = (query = "") =>
  mount(new Game(parseParams(new URLSearchParams(query))))

const victory: FightReport = {
  result: "victory",
  ticks: 12,
  divineUsed: {},
  divineNearAlly: [],
  intrications: 0,
  fled: [],
  timeUp: false,
  zonesLost: [],
  zoneStates: {},
  fixed: [],
  fighters: [],
}

/** Walks a chapter to its end like a player: first gestures, every fight won. */
function walk(g: Game): ExplorationScene {
  const island = g.current as ExplorationScene
  for (let i = 0; i < 3000; i++) {
    if (island.mode === "walk") {
      island.enterPending()
      continue
    }
    if (island.mode === "debrief" || island.mode === "look") {
      island.advance()
      continue
    }
    const f = island.frame
    if (f.kind === "done") return island
    if (f.kind === "fight") {
      island.startFight()
      ;(island as any)._leaveFight(victory, f.fight as FightSpec)
    } else if (f.kind === "choice") island.pick(f.options[0].id)
    else if (f.kind === "hub") island.pick(f.topics[0].id)
    else island.advance()
  }
  throw new Error("chapter did not end")
}

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("every chapter is playable from ?chapter=N", () => {
  for (const c of CHAPTERS.filter((c) => Number(c.id) >= 7))
    test(`chapter ${c.id} "${c.title}" walks to its end`, () => {
      const g = game(`chapter=${c.id}`)
      expect(g.screen.type).toBe("story")
      expect(g.current).toBeInstanceOf(ExplorationScene)
      walk(g)
      tick(g, 100)
      expect(g.screen.type).toBe("story")
      const story = g.current as StoryScene
      expect(story.menu).not.toBeNull()
    })
})

describe("the endings", () => {
  /** Plays chapter 28 from a start, up to the epilogue screen. */
  function toEpilogue(query: string) {
    const g = game(query)
    walk(g)
    tick(g, 100)
    const story = g.current as StoryScene
    const items = story.menu!.items
    const at = items.findIndex((i) => i.id === "ending")
    expect(at).toBeGreaterThanOrEqual(0)
    story.menu!.select(at)
    expect(g.screen.type).toBe("ending")
    return g
  }
  const read = (g: Game) => {
    const e = g.current as Epilogue
    for (let i = 0; i < 60 && g.screen.type === "ending"; i++) e.advance()
  }

  test("a finished chapter 28 leads to an epilogue, then the title", () => {
    const g = toEpilogue("chapter=28")
    read(g)
    expect(g.screen.type).not.toBe("ending")
    expect(adventureSave().ending).not.toBeNull()
  })

  test("La Bascule: the forbidden spell in the last fight wipes and congratulates", () => {
    const g = game("chapter=28")
    const island = g.current as ExplorationScene
    for (let i = 0; i < 3000; i++) {
      if (island.mode === "walk") island.enterPending()
      else if (island.mode === "debrief" || island.mode === "look")
        island.advance()
      else if (island.frame.kind === "fight") break
      else if (island.frame.kind === "choice")
        island.pick(island.frame.options[0].id)
      else if (island.frame.kind === "hub")
        island.pick(island.frame.topics[0].id)
      else island.advance()
    }
    expect(island.frame.kind).toBe("fight")
    island.startFight()
    ;(island.fight as any).emit("vacuumDecay")
    tick(g, 100)
    expect(g.screen.type).toBe("ending")
    read(g)
    expect(endingsSeen()).toContain("bascule")
    expect(g.screen.type).toBe("congrats")
    expect(adventureSave().run).toBeNull()
  })

  for (const fin of Object.keys(ENDING_NAMES) as Ending[])
    test(`the ending "${fin}" has an epilogue that closes the run`, () => {
      const g = game("chapter=28")
      const run = (g.current as ExplorationScene).run
      const forced: EndingResult =
        fin === "dispersion"
          ? { fin, monde: "ouvert" }
          : ({ fin } as EndingResult)
      g.show({ type: "ending", run, forced })
      read(g)
      expect(g.screen.type).not.toBe("ending")
      if (fin === "bascule" || fin === "gratuite")
        expect(endingsSeen()).toContain(fin)
      else expect(adventureSave().ending).toBe(fin)
    })
})

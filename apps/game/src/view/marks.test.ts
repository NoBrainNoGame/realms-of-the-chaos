import { describe, expect, test } from "bun:test"
import { CHAPTERS, type Run } from "@realms/adventure"
import { parseParams } from "../params"
import { mount, tick } from "../test/harness"
import type ExplorationScene from "./ExplorationScene"
import Game from "./Game"
import { markAnchor, markInfo } from "./marks"
import { toScreen } from "./theme"

const island = (query: string) => {
  const g = mount(new Game(parseParams(new URLSearchParams(query))))
  return g.current as ExplorationScene
}

describe("point-of-interest markers", () => {
  test("the anchor sits above the target's head, never below its feet", () => {
    const a = markAnchor({ x: 100, y: 200 }, -60)
    expect(a).toEqual({ x: 100, y: 136 })
    expect(markAnchor({ x: 5, y: 9 }, 12).y).toBeLessThan(9)
  })

  test("every encounter of every chapter has a short French label", () => {
    for (const chapter of CHAPTERS) {
      const run = { chapter: chapter.id, node: chapter.start } as unknown as Run
      for (const e of chapter.exploration?.encounters ?? []) {
        const info = markInfo(run, e)
        expect(info.label.length).toBeGreaterThan(3)
        expect(info.label.length).toBeLessThanOrEqual(32)
      }
    }
  })

  test("markers float exactly above their target on the island", () => {
    const scene = island("chapter=3")
    tick(scene, 100)
    const marked = (scene as any)._marked as {
      g: { x: number; y: number; visible: boolean }
      place: boolean
      id: string
      at: { x: number; y: number }
    }[]
    expect(marked.length).toBeGreaterThan(0)
    for (const m of marked) {
      const actor =
        (scene as any)._wanderers.get(m.id)?.actor ??
        (scene as any)._npcs.get(m.id)
      const feet = actor
        ? { x: actor.node.x, y: actor.node.y }
        : toScreen(m.at, (scene as any)._topAround(m.at))
      expect(m.g.x).toBeCloseTo(feet.x, 5)
      // above the target (the bob moves it by a couple of pixels only)
      expect(scene.run).toBeDefined()
      expect((scene as any)._board.get(m.at)).toBeDefined()
      expect(m.g.y).toBeLessThan(feet.y - 2)
      expect(m.g.y).toBeGreaterThan(feet.y - 140)
    }
  })

  test("a place marker hides while the hero stands on it", () => {
    const scene = island("chapter=prologue")
    tick(scene, 100)
    const marked = (scene as any)._marked as {
      g: { visible: boolean }
      at: { x: number; y: number }
      place: boolean
    }[]
    for (const m of marked) {
      const here =
        m.at.x === (scene as any)._hero.cell.x &&
        m.at.y === (scene as any)._hero.cell.y
      if (m.place) expect(m.g.visible).toBe(!here)
    }
  })
})

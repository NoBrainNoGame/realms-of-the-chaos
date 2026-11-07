import { afterEach, describe, expect, test } from "bun:test"
import { parseParams } from "../params"
import { mount, tick } from "../test/harness"
import { TURN_DURATION } from "./cameraRig"
import type ExplorationScene from "./ExplorationScene"
import Game from "./Game"
import { camera, diamond, resetCamera, toScreen } from "./theme"

const island = (query: string) => {
  const g = mount(new Game(parseParams(new URLSearchParams(query))))
  return g.current as ExplorationScene
}

afterEach(() => resetCamera())

const heroAt = (s: ExplorationScene) => {
  const hero = (s as any)._hero
  return { x: hero.node.x as number, y: hero.node.y as number }
}

describe("exploration camera", () => {
  test("four quarter turns come back to the same view", () => {
    const s = island("chapter=3")
    tick(s, 100)
    const before = heroAt(s)
    for (let i = 0; i < 4; i++) {
      s.turnCamera(1)
      tick(s, TURN_DURATION + 100)
    }
    expect(camera.quarter).toBe(0)
    const after = heroAt(s)
    expect(after.x).toBeCloseTo(before.x, 3)
    expect(after.y).toBeCloseTo(before.y, 3)
  })

  test("after a quarter turn, everything follows the new view", () => {
    const s = island("chapter=3")
    tick(s, 100)
    const before = heroAt(s)
    s.turnCamera(1)
    tick(s, TURN_DURATION + 100)
    expect(camera.quarter).toBe(1)
    const internals = s as any
    const cell = internals._hero.cell
    const now = heroAt(s)
    const want = toScreen(cell, internals._board.standHeight(cell))
    expect(now.x).toBeCloseTo(want.x, 3)
    expect(now.y).toBeCloseTo(want.y, 3)
    expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeGreaterThan(1)

    // picking: the hit area of the hero's cell sits where the cell is drawn
    const hits = internals._hits.children[0].children as {
      x: number
      y: number
      hitArea: { contains(x: number, y: number): boolean }
    }[]
    const mine = hits.find(
      (h) => Math.abs(h.x - want.x) < 0.01 && Math.abs(h.y - want.y) < 0.01,
    )
    expect(mine).toBeDefined()
    expect(mine!.hitArea.contains(0, 8)).toBe(true)

    // a click on a neighbour walks there, whichever way we look
    const next = internals._board
      .neighbors(cell)
      .find((p: any) => internals._board.canStand(p))
    expect(s.walkTo(next)).toBe(true)

    // markers stay above their targets
    for (const m of internals._marked) {
      const actor =
        internals._wanderers.get(m.id)?.actor ?? internals._npcs.get(m.id)
      const feet = actor
        ? { x: actor.node.x, y: actor.node.y }
        : toScreen(m.at, internals._board.standHeight(m.at))
      expect(m.g.x).toBeCloseTo(feet.x, 3)
      expect(m.g.y).toBeLessThan(feet.y - 2)
    }

    // the puppet faces the way it goes, on screen
    expect(internals._hero.facing).toBeDefined()
  })

  test("the keys and the wheel drive the camera as in a fight", () => {
    const s = island("chapter=3")
    tick(s, 100)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }))
    tick(s, TURN_DURATION + 100)
    expect(camera.quarter).toBe(1)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "v" }))
    tick(s, TURN_DURATION + 600)
    expect(camera.quarter).toBe(0)
    const rig = (s as any)._rig
    rig.zoomAt({ x: 400, y: 300 }, 3)
    tick(s, 1500)
    expect(rig.zoom.value).toBeGreaterThan(1.3)
  })

  test("ground overlays follow the tilt like the tile tops", () => {
    const s = island("chapter=3")
    tick(s, 100)
    const x = s as any
    const cell = x._hero.cell
    x._highlights = [{ cells: [cell], color: 0xffe066, alpha: 0.3 }]
    x._view.setHighlights(x._highlights)
    const size = () => {
      const b = x._view._parts
        .get(`${cell.x},${cell.y}`)
        .overlay.getLocalBounds()
      return { w: b.width, h: b.height }
    }
    const want = () => {
      const d = diamond(3)
      const xs = d.filter((_, i) => i % 2 === 0)
      const ys = d.filter((_, i) => i % 2 === 1)
      return {
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      }
    }
    const flat = want()
    expect(size().h).toBeCloseTo(flat.h, 1)
    x._rig.aimCamera(60, 0)
    tick(s, 2000)
    const tall = want()
    expect(tall.h).toBeGreaterThan(flat.h + 4)
    expect(size().w).toBeCloseTo(tall.w, 1)
    expect(size().h).toBeCloseTo(tall.h, 1)
  })
})

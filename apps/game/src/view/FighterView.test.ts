import { describe, expect, test } from "bun:test"
import { Container } from "pixi.js"

import { Board, Combat, keyOf } from "@realms/engine"
import { mount, tick } from "../test/harness"
import { tickUntil } from "../test/play"
import FighterView from "./FighterView"
import FightScene, { classicFight } from "./FightScene"

describe("fighter moves", () => {
  test("a step starts where the fighter stands (never at the world origin)", () => {
    const combat = new Combat({
      seed: 1,
      board: new Board(5, 5),
      teams: [
        { controller: "ai", fighters: ["eva"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 4, y: 4 }]],
    })
    const view = mount(
      new FighterView(combat.fighters[0], combat.baseMaxHp(combat.fighters[0])),
      new Container(),
    )
    view.container.position.set(200, 120)
    const move = view.moveChip({ x: 232, y: 136 }, 160, 4)
    const seen: { x: number; y: number }[] = []
    move.activate({ timeSinceLastTick: 0 }, { container: new Container() })
    seen.push({ x: view.container.x, y: view.container.y })
    while (move.state === "active") {
      move.tick({ timeSinceLastTick: 16 })
      seen.push({ x: view.container.x, y: view.container.y })
    }
    for (const p of seen) {
      expect(p.x).toBeGreaterThanOrEqual(200)
      expect(p.x).toBeLessThanOrEqual(232)
      expect(p.y).toBeGreaterThan(100)
    }
    expect(seen.at(-1)).toEqual({ x: 232, y: 136 })
  })
})

describe("sprint in a fight", () => {
  test("C selects the sprint, a click runs it: quick steps, turn over", () => {
    const scene = mount(
      new FightScene(
        classicFight({
          seed: 8,
          speed: 4,
          spectate: false,
          playerTeam: ["eva", "brutus"],
          enemyTeam: ["gorr"],
        }),
      ),
    )
    const internals = scene as any
    tickUntil(scene, () => internals._inputReady)
    const me = scene.combat.activeFighter!
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }))
    expect(internals._mode.type).toBe("action")
    expect(internals._mode.action.id).toBe("sprint")

    const targets = scene.combat.getValidTargets(me, internals._mode.action)
    const far = targets.reduce((a, b) =>
      scene.combat.movementPaths(me, 3).get(keyOf(b))!.length >
      scene.combat.movementPaths(me, 3).get(keyOf(a))!.length
        ? b
        : a,
    )
    internals._board.emit("cellOver", far) // path preview
    internals._board.emit("cellDown", far, 0)
    expect(me.position).toEqual(far)
    expect(internals._sprint).not.toBeNull()
    tickUntil(scene, () => !internals._playing)
    expect(internals._cells.get(me.id)).toEqual(far)
    expect(internals._sprint.steps).toBe(0)
    expect(scene.combat.activeFighter).not.toBe(me)
    tick(scene, 100)
  })
})

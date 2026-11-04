import { describe, expect, test } from "bun:test"
import { Board, Combat, keyOf } from "@realms/engine"
import { Container } from "pixi.js"
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

describe("movement cost previews", () => {
  test("hovering shows the time of a walk or a sprint, and the card the planned walk", () => {
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

    // walk: a far reachable cell takes several of its turns
    const reachable = scene.combat.getReachableCells(me)
    const far = reachable.reduce((a, b) =>
      Math.abs(b.x - me.position.x) + Math.abs(b.y - me.position.y) >
      Math.abs(a.x - me.position.x) + Math.abs(a.y - me.position.y)
        ? b
        : a,
    )
    internals._board.emit("cellOver", far)
    const walk = scene
      .movePreview()!
      .map((part) => part.text)
      .join("")
    expect(walk).toContain("Marche")
    expect(walk).toMatch(/\d+ temps/)
    expect(walk).toMatch(/arrivée en \d+ tours?/)
    // shown in the HUD, above the action bar, not as a tooltip on the board
    expect(internals._hud.previewText).toBe(walk)
    expect(internals._hud._tooltip.visible).toBe(false)

    // sprint: immediate, ends the turn, worth some actions
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }))
    const target = scene.combat.getValidTargets(me, internals._mode.action)[0]
    internals._board.emit("cellOver", target)
    const sprint = scene
      .movePreview()!
      .map((part) => part.text)
      .join("")
    expect(sprint).toContain("Course")
    expect(sprint).toContain("le tour se termine")

    // a planned walk shows in the card
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    internals._board.emit("cellDown", far, 0)
    tickUntil(scene, () => !internals._playing)
    internals._board.emit("cellOut", target)
    internals._refreshCard()
    const texts: string[] = []
    const walkTexts = (c: Container) => {
      if ("text" in c && typeof (c as any).text === "string")
        texts.push((c as any).text)
      for (const child of c.children) walkTexts(child as Container)
    }
    walkTexts(internals._hud._card)
    if (me.path.length)
      expect(texts.some((t) => t.startsWith("En route"))).toBe(true)

    // nothing to preview on the fighter's own cell
    internals._board.emit("cellOver", me.position)
    expect(scene.movePreview()).toBeNull()
    expect(internals._hud.previewText).toBe("")
  })
})

describe("landing preview on the timeline", () => {
  test("hovering an action, Passer or a sprint cell shows where the fighter lands", () => {
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
    const hud = internals._hud
    expect(hud.landingGhost).toBeNull()

    const action = scene.combat.actionsOf(me).find((a) => !a.movement)!
    hud.emit("hoverChoice", action.id)
    expect(scene.landingPreview()!.delay).toBeCloseTo(
      scene.combat.turnDelayOf(me, { type: "action", actionId: action.id })!,
    )
    expect(hud.landingGhost).not.toBeNull()

    hud.emit("hoverChoice", "pass")
    expect(scene.landingPreview()!.delay).toBeCloseTo(
      scene.combat.passDelay(me),
    )
    hud.emit("hoverChoice", null)
    expect(hud.landingGhost).toBeNull()

    // the sprint: nothing on its button, nor before a cell is hovered
    const sprint = scene.combat.actionsOf(me).find((a) => a.movement)!
    hud.emit("hoverChoice", sprint.id)
    expect(scene.landingPreview()).toBeNull()
    expect(hud.landingGhost).toBeNull()
    hud.emit("hoverChoice", null)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }))
    internals._hovered = null
    expect(scene.landingPreview()).toBeNull()
    // nor on a cell out of its reach
    const far = { x: me.position.x + 7, y: me.position.y + 7 }
    internals._board.emit("cellOver", far)
    expect(scene.landingPreview()).toBeNull()
    expect(hud.landingGhost).toBeNull()
    // then its landing depends on the hovered cell
    const targets = scene.combat.getValidTargets(me, internals._mode.action)
    const delays = new Set<number>()
    for (const target of targets) {
      internals._board.emit("cellOver", target)
      delays.add(Math.round(scene.landingPreview()!.delay))
      expect(hud.landingGhost).not.toBeNull()
    }
    expect(delays.size).toBeGreaterThan(1)
  })
})

describe("click out of reach", () => {
  test("cancels the selected action instead of failing it", () => {
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
    const valid = scene.combat.getValidTargets(me, internals._mode.action)
    const out = scene.combat.board.cells.find(
      (c) => !valid.some((v) => keyOf(v) === keyOf(c)),
    )!
    const before = { ...me.position }
    internals._board.emit("cellDown", out, 0)
    expect(internals._mode.type).toBe("move")
    expect(me.position).toEqual(before)
    expect(scene.combat.activeFighter).toBe(me)
  })
})

describe("walk with stops", () => {
  test("each click adds a stop, the button and Backspace cancel the walk", () => {
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
    const reachable = scene.combat
      .getReachableCells(me)
      .filter(
        (c) =>
          Math.abs(c.x - me.position.x) + Math.abs(c.y - me.position.y) >= 2,
      )
    const [a, b] = [reachable[0], reachable.at(-1)!]
    const cancelButton = () =>
      internals._hud._actionBar.children.find(
        (c: Container) => c.label === "cancelWalk",
      )
    expect(cancelButton()).toBeUndefined()

    internals._board.emit("cellDown", a, 0)
    tickUntil(scene, () => !internals._playing)
    expect(me.waypoints).toEqual([a])
    expect(cancelButton()).toBeDefined()
    internals._board.emit("cellOver", b)
    expect(scene.movePreview()![0].text).toContain("Étape 2")
    internals._board.emit("cellDown", b, 0)
    tickUntil(scene, () => !internals._playing)
    expect(me.waypoints).toEqual([a, b])
    expect(me.path.some((c) => keyOf(c) === keyOf(a))).toBe(true)
    expect(me.path.at(-1)).toEqual(b)
    expect(scene.combat.activeFighter).toBe(me) // planning is free

    cancelButton().emit("pointertap")
    tickUntil(scene, () => !internals._playing)
    expect(me.waypoints).toEqual([])
    expect(me.path).toEqual([])
    expect(cancelButton()).toBeUndefined()

    internals._board.emit("cellDown", a, 0)
    tickUntil(scene, () => !internals._playing)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }))
    expect(me.path).toEqual([])
  })
})

describe("camera zoom", () => {
  test("the wheel zooms around the cursor, within bounds, the HUD stays", () => {
    const scene = mount(
      new FightScene(
        classicFight({
          seed: 8,
          speed: 4,
          spectate: false,
          playerTeam: ["eva"],
          enemyTeam: ["gorr"],
        }),
      ),
    )
    const internals = scene as any
    tickUntil(scene, () => internals._inputReady)
    internals._onResize(1280, 720)
    const world = internals._world as Container
    const fit = world.scale.x
    const cursor = { x: 300, y: 200 }
    const local = () => ({
      x: (cursor.x - world.x) / world.scale.x,
      y: (cursor.y - world.y) / world.scale.y,
    })
    const under = local()
    const hud = { ...internals._hud._container.position }

    window.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }))
    scene.zoomAt(cursor, 2)
    tick(scene, 600)
    expect(scene.zoom).toBeGreaterThan(1.4)
    expect(world.scale.x).toBeCloseTo(fit * scene.zoom)
    // the point under the cursor did not move
    expect(local().x).toBeCloseTo(under.x, 0)
    expect(local().y).toBeCloseTo(under.y, 0)
    expect(internals._hud._container.position).toEqual(hud)

    for (let i = 0; i < 30; i++) scene.zoomAt(cursor, 3)
    tick(scene, 2000)
    expect(scene.zoom).toBe(3)
    for (let i = 0; i < 30; i++) scene.zoomAt(cursor, -3)
    tick(scene, 2000)
    expect(scene.zoom).toBe(0.6)
  })
})

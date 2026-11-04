import { describe, expect, test } from "bun:test"
import { mount, tick } from "../test/harness"
import Tutorial, {
  placeBubble,
  TUTORIAL_CELLS,
  TUTORIAL_STEPS,
} from "./Tutorial"
import { camera } from "./theme"

const screen = { width: 1280, height: 720 }
const size = { width: 340, height: 200 }

describe("placeBubble", () => {
  test("centred without a target", () => {
    const p = placeBubble(null, size, screen)
    expect(p.side).toBeNull()
    expect(p.x).toBe(470)
  })

  test("on the preferred side when it fits, else another one", () => {
    const rect = { x: 600, y: 300, width: 80, height: 40 }
    const above = placeBubble(
      { rect, kind: "ui", prefer: ["above"] },
      size,
      screen,
    )
    expect(above.side).toBe("above")
    expect(above.y + size.height).toBeLessThanOrEqual(rect.y)
    // a target at the top: no room above, the bubble goes below
    const top = { ...rect, y: 20 }
    const below = placeBubble(
      { rect: top, kind: "ui", prefer: ["above"] },
      size,
      screen,
    )
    expect(below.side).toBe("below")
    expect(below.y).toBeGreaterThanOrEqual(top.y + top.height)
  })

  test("slides aside rather than cover what it must not", () => {
    const rect = { x: 600, y: 600, width: 80, height: 40 }
    const target = { x: 620, y: 350, width: 50, height: 70 }
    const p = placeBubble(
      { rect, kind: "ui", prefer: ["above"], avoid: [target] },
      size,
      screen,
    )
    expect(p.side).toBe("above")
    const overlaps =
      p.x < target.x + target.width &&
      p.x + size.width > target.x &&
      p.y < target.y + target.height &&
      p.y + size.height > target.y
    expect(overlaps).toBe(false)
  })

  test("always inside the screen", () => {
    const rect = { x: 1250, y: 700, width: 20, height: 10 }
    const p = placeBubble(
      { rect, kind: "cell", prefer: ["right"] },
      size,
      screen,
    )
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.x + size.width).toBeLessThanOrEqual(screen.width)
    expect(p.y + size.height).toBeLessThanOrEqual(screen.height)
  })
})

describe("Tutorial", () => {
  test("a scripted walkthrough: no waiting, a foe in reach of the combo", () => {
    const t = mount(new Tutorial(4))
    const combat = t.scene.combat
    const hud = (t.scene as any)._hud
    const board = (t.scene as any)._board
    const find = (id: string) => combat.fighters.find((f) => f.presetId === id)!
    const [eva, merlin, gorr, squalor] = [
      "eva",
      "merlin",
      "gorr",
      "squalor",
    ].map(find)
    const playerPasses = () =>
      combat.log.filter((c) => c.type === "pass").length

    // the enemies wait in the Clair: off the island and the timeline
    expect(t.step?.id).toBe("welcome")
    expect(combat.aliveFighters).toEqual([eva, merlin])
    expect(combat.timelineOrder().map((f) => f.presetId)).toEqual([
      "eva",
      "merlin",
    ])
    tick(t, 100)
    expect(t.bubble.visible).toBe(true)
    while (t.step?.id !== "move") t.next()
    tick(t, 100)
    expect(combat.activeFighter).toBe(eva)

    // only the cell shown: elsewhere, nothing
    board.emit("cellDown", { x: 1, y: 7 }, 0)
    expect(eva.path).toEqual([])
    board.emit("cellDown", TUTORIAL_CELLS.walk, 0)
    tick(t, 100)
    expect(t.step?.id).toBe("walk")

    // Avancer: Eva walks, Merlin plays once she is there
    hud.emit("pass")
    tick(t, 4000)
    expect(t.step?.id).toBe("water")
    expect(combat.activeFighter).toBe(merlin)
    expect(eva.position).toEqual(TUTORIAL_CELLS.walk)
    t.next()
    t.next()
    expect(t.step?.id).toBe("sprint")

    // the Course takes Merlin to Eva
    hud.emit("action", "sprint")
    board.emit("cellDown", eva.position, 0)
    tick(t, 4000)
    expect(merlin.position).toEqual(eva.position)

    // the camera, before aiming: a quarter turn
    expect(t.step?.id).toBe("camera")
    expect(combat.offstage.has(gorr.id)).toBe(true)
    const quarter = camera.quarter
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }))
    // the quarter turn is animated
    tick(t, 2000)
    expect(camera.quarter).not.toBe(quarter)

    // they meet, and Gorr enters in reach
    expect(combat.offstage.has(gorr.id)).toBe(false)
    expect(combat.offstage.has(squalor.id)).toBe(true)
    expect(t.step?.id).toBe("join")
    expect(combat.activeFighter).toBe(eva)
    const combo = combat.actionsOf(eva).find((a) => a.combo)!
    expect(combat.getValidTargets(eva, combo)).toContainEqual(gorr.position)
    t.next()
    expect(t.step?.id).toBe("combo")

    // the combo on Gorr, who stays in sight: the bubble does not cover him
    tick(t, 100)
    const body = t.scene.cellOnScreen(gorr.position)
    const b = t.bubble.getBounds()
    const inside = (x: number, y: number) =>
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height
    expect(inside(body.x, body.y)).toBe(false)
    expect(inside(body.x, body.y - 30 * t.scene.zoom)).toBe(false)
    const hp = gorr.hp
    hud.emit("action", combo.id)
    board.emit("cellDown", gorr.position, 0)
    tick(t, 4000)
    expect(gorr.hp).toBeLessThan(hp)
    expect(t.step?.id).toBe("divine")
    // one Avancer in all: nobody waited for anyone
    expect(playerPasses()).toBe(1)

    t.next()
    expect(t.step?.id).toBe("fight")

    // the fight: Squalor enters in the lake, the enemies play soon
    t.next()
    expect(t.step).toBeNull()
    expect(combat.holding.size).toBe(0)
    expect(squalor.position).toEqual(TUTORIAL_CELLS.lake)
    expect(combat.aliveFighters).toContain(squalor)
    expect(gorr.nextActionAt).toBeLessThanOrEqual(combat.time + 4)
  }, 30_000)

  test("a lesson lets through only what it asks: the bubble covers the rest", () => {
    const t = mount(new Tutorial(4))
    const combat = t.scene.combat
    const hud = (t.scene as any)._hud
    const board = (t.scene as any)._board
    const key = (k: string) =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k }))
    t.next()
    tick(t, 3000)
    expect(t.step?.id).toBe("timeline")
    const me = combat.activeFighter!
    const commands = combat.log.length

    // reading: no walk, no action, no pass (the camera still turns)
    board.emit("cellDown", combat.getReachableCells(me)[0], 0)
    expect(me.path).toEqual([])
    const first = combat.actionsOf(me)[0]
    hud.emit("action", first.id)
    key("1")
    expect((t.scene as any)._mode.type).toBe("move")
    hud.emit("pass")
    expect(combat.log.length).toBe(commands)
    const quarter = camera.quarter
    key("e")
    tick(t, 2000)
    expect(camera.quarter).not.toBe(quarter)
    // but the timeline it shows can be clicked, and Entrée reads on
    expect(t.allows({ type: "timeline" })).toBe(true)
    key("Enter")
    expect(t.step?.id).toBe("card")
    expect(combat.log.length).toBe(commands)

    // the walk lesson: the cell shown and Avancer, no attack
    while (t.step && t.step.id !== "move") t.next()
    tick(t, 100)
    board.emit("cellDown", TUTORIAL_CELLS.walk, 0)
    tick(t, 100)
    expect(t.step?.id).toBe("walk")
    expect(t.allows({ type: "cell", at: TUTORIAL_CELLS.walk })).toBe(true)
    expect(t.allows({ type: "cell", at: { x: 1, y: 7 } })).toBe(false)
    expect(t.allows({ type: "action", id: first.id })).toBe(false)
    expect(t.allows({ type: "cancel" })).toBe(true)
    expect(t.allows({ type: "pass" })).toBe(true)
    expect(t.allows({ type: "camera" })).toBe(true)
    // the course lesson: the Course, to the ally's cell only
    while (t.step && t.step.id !== "sprint") t.next()
    expect(t.allows({ type: "action", id: "sprint" })).toBe(true)
    expect(t.allows({ type: "action", id: first.id })).toBe(
      first.id === "sprint",
    )
    expect(t.allows({ type: "cell", at: { x: 8, y: 0 } })).toBe(false)

    // once the lessons are over, everything goes
    while (t.step) t.next()
    expect(t.allows({ type: "camera" })).toBe(true)
    expect(t.allows({ type: "action", id: first.id })).toBe(true)
  }, 30_000)

  test("every lesson has a title and a text", () => {
    const t = mount(new Tutorial(4))
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.text(t).length).toBeGreaterThan(20)
    }
  })
})

import { describe, expect, test } from "bun:test"
import { mount, tick } from "../test/harness"
import Tutorial, { placeBubble, TUTORIAL_STEPS } from "./Tutorial"
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
  test("the lessons go on one by one, the enemies wait until the end", () => {
    const t = mount(new Tutorial(4))
    const combat = t.scene.combat
    expect(t.step?.id).toBe("welcome")
    expect(combat.holding.has(1)).toBe(true)
    tick(t, 100)
    expect(t.bubble.visible).toBe(true)

    // reading lessons: the button goes on
    t.next()
    tick(t, 3000)
    expect(t.step?.id).toBe("timeline")
    expect(t.bubble.visible).toBe(true)
    expect(t.scene.hud.partBounds("timeline")).not.toBeNull()
    t.next()
    t.next()
    t.next()
    expect(t.step?.id).toBe("move")

    // a walk planned: the lesson is done
    tick(t, 100)
    const me = combat.activeFighter!
    expect(me.team).toBe(0)
    const cell = combat.getReachableCells(me)[0]
    ;(t.scene as any)._board.emit("cellDown", cell, 0)
    tick(t, 100)
    expect(t.step?.id).toBe("walk")

    // walking on ends the turn
    ;(t.scene as any)._hud.emit("pass")
    tick(t, 3000)
    expect(t.step?.id).toBe("water")

    // the enemies only passed so far
    const foes = combat.log.filter(
      (c) =>
        c.type !== "pass" && "fighterId" in c && c.fighterId.includes("-1-"),
    )
    expect(foes).toEqual([])

    while (t.step && t.step.id !== "camera") t.next()
    const quarter = camera.quarter
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }))
    // the quarter turn is animated
    tick(t, 2000)
    expect(camera.quarter).not.toBe(quarter)
    expect(t.step?.id).toBe("fight")
    t.next()
    expect(t.step).toBeNull()
    expect(combat.holding.size).toBe(0)
  }, 30_000)

  test("every lesson has a title and a text", () => {
    const t = mount(new Tutorial(4))
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.text(t).length).toBeGreaterThan(20)
    }
  })
})

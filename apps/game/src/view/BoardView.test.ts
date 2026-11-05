import { describe, expect, test } from "bun:test"
import { Board, Combat, createRng, keyOf } from "@realms/engine"
import { Container, type Graphics } from "pixi.js"
import { mount, runToEnd, tick } from "../test/harness"
import BoardView, {
  COLUMN_BOTTOM,
  DEPTH,
  depthOf,
  waveOffset,
  withSides,
} from "./BoardView"
import FighterView, { WATER_DEPTH } from "./FighterView"
import { stackOffset, waterState } from "./FightScene"
import { ELEVATION_HEIGHT, toScreen } from "./theme"

function setup(rows: string[], seed = 1) {
  const board = Board.fromAscii(rows)
  const entities = new Container()
  const top = new Container()
  const view = mount(new BoardView(board, entities, top, seed))
  return { board, view, entities, top }
}

describe("waveOffset", () => {
  test("zero before and after, sinks first, settles", () => {
    expect(waveOffset(10, -0.1)).toBe(0)
    expect(waveOffset(10, 1)).toBe(0)
    expect(waveOffset(10, 0.15)).toBeGreaterThan(0)
    expect(Math.abs(waveOffset(10, 0.95))).toBeLessThan(1)
  })

  test("depth order: columns before fighters, front diagonals last", () => {
    expect(depthOf({ x: 1, y: 1 }, DEPTH.column)).toBeLessThan(
      depthOf({ x: 1, y: 1 }, DEPTH.fighter),
    )
    expect(depthOf({ x: 1, y: 1 }, DEPTH.fighter)).toBeLessThan(
      depthOf({ x: 2, y: 1 }, DEPTH.column),
    )
  })
})

describe("BoardView", () => {
  test("one terrain column per cell in the entities layer, one hit area on top", () => {
    const { board, entities, top } = setup(["...", ".2.", "~a."])
    expect(entities.children).toHaveLength(board.cells.length)
    const hits = top.children[0] as Container
    expect(hits.children).toHaveLength(board.cells.length)
    expect(COLUMN_BOTTOM).toBeGreaterThan(0)
  })

  test("characters stand on the ground, or at the water surface", () => {
    const { view } = setup([".2W"])
    expect(view.cellTop({ x: 1, y: 0 })).toEqual(toScreen({ x: 1, y: 0 }, 2))
    expect(view.cellTop({ x: 2, y: 0 })).toEqual(toScreen({ x: 2, y: 0 }, 0))
  })

  test("pointer events are forwarded as cell events", () => {
    const { view, top } = setup(["..", ".."])
    const events: string[] = []
    view.on("cellOver", (p) => events.push(`over ${keyOf(p)}`))
    view.on("cellOut", (p) => events.push(`out ${keyOf(p)}`))
    view.on("cellDown", (p, button) =>
      events.push(`down ${keyOf(p)} ${button}`),
    )
    const hit = (top.children[0] as Container).children[3]
    hit.emit("pointerover", {} as any)
    hit.emit("pointerdown", { button: 2 } as any)
    hit.emit("pointerout", {} as any)
    expect(events).toEqual(["over 1,1", "down 1,1 2", "out 1,1"])
  })

  test("a shockwave sinks the center first, then the zone, and settles", () => {
    const { view } = setup([".....", ".....", "....."])
    const zone = [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]
    view.shockwave({ x: 2, y: 1 }, zone, 10, { duration: 400, step: 100 })
    tick(view, 50)
    expect(view.cellOffset({ x: 2, y: 1 })).toBeGreaterThan(0)
    expect(view.cellOffset({ x: 4, y: 1 })).toBe(0)
    tick(view, 200)
    expect(view.cellOffset({ x: 4, y: 1 })).toBeGreaterThan(0)
    // the ring around the zone moves less
    expect(Math.abs(view.cellOffset({ x: 2, y: 0 }))).toBeLessThan(10 * 0.4)
    tick(view, 1000)
    for (const p of zone) expect(view.cellOffset(p)).toBe(0)
  })

  test("highlights are drawn on the cells and cleared", () => {
    const { view, entities } = setup(["...", "..."])
    const overlays = () =>
      entities.children.map((c) => (c as Container).children.at(-1) as Graphics)
    view.setHighlights([
      { cells: [{ x: 1, y: 0 }], color: 0xff0000, alpha: 0.5, outline: true },
    ])
    const drawn = overlays().filter((g) => g.bounds.width > 0)
    expect(drawn).toHaveLength(1)
    view.setHighlights([])
    expect(overlays().every((g) => g.bounds.width === 0)).toBe(true)
  })

  test("a walk down a step joins along the side of the higher cell", () => {
    const { view, entities } = setup(["2.", ".."])
    const overlay = (i: number) =>
      (entities.children[i] as Container).children.at(-1) as Graphics
    view.setHighlights([
      {
        cells: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        color: 0xffff00,
        alpha: 1,
        trail: true,
      },
    ])
    // the higher half drops two levels down to meet the lower half
    expect(overlay(0).bounds.height).toBeGreaterThan(2 * ELEVATION_HEIGHT)
    expect(overlay(1).bounds.height).toBeLessThan(2 * ELEVATION_HEIGHT)
  })

  test("terrain changes are redrawn", () => {
    const { board, view, entities } = setup([".....", "....."])
    board.get({ x: 2, y: 0 })!.elevation = 3
    view.refreshCell({ x: 2, y: 0 })
    expect(view.cellTop({ x: 2, y: 0 }).y).toBe(
      toScreen({ x: 2, y: 0 }).y - 3 * ELEVATION_HEIGHT,
    )
    expect(entities.children).toHaveLength(10)
  })

  test("generated maps draw water, pits, hills, crystals and animate", () => {
    for (let seed = 0; seed < 8; seed++) {
      const board = Board.generate(createRng(seed))
      const view = mount(
        new BoardView(board, new Container(), new Container(), seed),
      )
      tick(view, 200)
      view.terminate()
    }
  })

  test("terminating removes the columns and hit areas", () => {
    const { view, entities, top } = setup(["..", ".."])
    view.terminate()
    expect(entities.children).toHaveLength(0)
    expect((top.children[0] as Container | undefined)?.destroyed ?? true).toBe(
      true,
    )
  })
})

describe("fighters on the board", () => {
  test("stack offsets: centered alone, spread for 2 and 3", () => {
    expect(stackOffset(0, 1)).toEqual({ x: 0, y: 0 })
    const two = [stackOffset(0, 2), stackOffset(1, 2)]
    expect(two[0].x).toBeLessThan(two[1].x)
    const three = [0, 1, 2].map((i) => stackOffset(i, 3))
    expect(new Set(three.map((o) => `${o.x},${o.y}`)).size).toBe(3)
    // the one at the back is drawn higher on screen
    expect(three[0].y).toBeLessThan(three[1].y)
  })

  function fighterView(preset = "eva") {
    const combat = new Combat({
      seed: 1,
      board: new Board(5, 5),
      teams: [
        { controller: "human", fighters: [preset] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 4, y: 4 }]],
    })
    const fighter = combat.fighters[0]
    return {
      view: mount(new FighterView(fighter, combat.baseMaxHp(fighter))),
      fighter,
      combat,
    }
  }

  test("hp is clamped and statuses are shown", () => {
    const { view, combat, fighter } = fighterView()
    view.hp = -10
    expect(view.hp).toBe(0)
    view.hp = 9999
    expect(view.hp).toBe(combat.maxHp(fighter))
    view.addStatus("poisoned")
    view.addStatus("slowed")
    view.removeStatus("poisoned")
    view.clearStatuses()
  })

  test("swimmers and aquatics change shape in deep water", () => {
    for (const preset of ["eva", "nyx", "squalor", "nerea"]) {
      const { view } = fighterView(preset)
      const puppet = view.puppet
      expect(puppet.hasSwimForm).toBe(true)
      view.setWater("swimming")
      // they handle their own waterline
      expect(puppet.y).toBe(0)
      expect(puppet.mask).toBeFalsy()
      puppet.update(50)
      const form = puppet.swimForm!
      expect(form.root.visible).toBe(true)
      if (form.upright) {
        // Néréa floats upright, sunk to the chest, her tail at the surface
        expect(puppet.rig.root.visible).toBe(true)
        expect(puppet.rig.root.mask).toBeTruthy()
      } else {
        // a fin, or a crawl stroke: the body is hidden...
        expect(puppet.rig.root.visible).toBe(false)
        // ...except while acting: the swimmer rises to strike
        puppet.act("melee", 100)
        expect(puppet.rig.root.visible).toBe(true)
        puppet.update(120)
        expect(puppet.rig.root.visible).toBe(false)
      }
      puppet.walk(300)
      for (let t = 0; t < 300; t += 16) puppet.update(16)
      view.setWater("dry")
      expect(form.root.visible).toBe(false)
      expect(puppet.rig.root.visible).toBe(true)
      expect(puppet.rig.root.y).toBe(0)
    }
    expect(fighterView("brutus").view.puppet.hasSwimForm).toBe(false)
  })

  test("water: wading sinks the feet, swimming hides the body up to the chest", () => {
    // a walker (no swim form): sunk and cut at the surface
    const { view } = fighterView("brutus")
    view.setWater("wading")
    expect(view.water).toBe("wading")
    expect(view.puppet.y).toBe(WATER_DEPTH.wading)
    expect(view.puppet.mask).toBeTruthy()
    expect(view.puppet.isSwimming).toBe(false)
    const barY = (view.container.children[0] as any).children[3].y
    view.setWater("swimming")
    expect(view.puppet.y).toBe(WATER_DEPTH.swimming)
    // the HP bar follows the head down
    expect((view.container.children[0] as any).children[3].y).toBe(
      barY + WATER_DEPTH.swimming - WATER_DEPTH.wading,
    )
    expect(view.puppet.isSwimming).toBe(true)
    view.setWater("dry")
    expect(view.puppet.y).toBe(0)
    expect(view.puppet.mask).toBeFalsy()
    expect(view.puppet.isSwimming).toBe(false)
  })

  test("water state of a cell: dry, shallow (wading), deep (swimming)", () => {
    const board = Board.fromAscii([".~w"])
    expect(waterState(board, { x: 0, y: 0 })).toBe("dry")
    expect(waterState(board, { x: 1, y: 0 })).toBe("wading")
    expect(waterState(board, { x: 2, y: 0 })).toBe("swimming")
  })

  test("the board can push the fighter down (shockwave)", () => {
    const { view } = fighterView()
    view.setGroundOffset(5)
    expect(view.container.children[0].y).toBe(5)
  })

  test("characters are small enough to read the board", () => {
    const { view } = fighterView("gorr")
    expect(view.headHeight).toBeLessThan(view.puppet.headHeight)
    expect(view.headHeight).toBeLessThan(48)
  })

  test("animations run to completion", () => {
    const { view } = fighterView()
    view.setActive(true)
    view.setFacing("NW")
    view.act("cast", 200)
    expect(view.puppet.facing).toBe("NW")
    for (const chip of [
      view.moveChip({ x: 50, y: 20 }, 200),
      view.lungeChip({ x: 80, y: 0 }, 200),
      view.hitChip(200),
    ]) {
      runToEnd(chip)
      tick(view, 32)
    }
    expect(view.container.position.x).toBe(50)
    view.setActive(false)
    runToEnd(view.dieChip(300))
    tick(view, 32)
    expect(view.container.alpha).toBeLessThan(0.05)
  })
})

describe("withSides", () => {
  test("the top face and one block of sides under it, no more", () => {
    // a diamond: top, right, bottom, left
    const face = [0, -10, 20, 0, 0, 10, -20, 0]
    const hull = withSides(face, 12)
    expect(hull).toHaveLength(12)
    const ys = hull.filter((_, i) => i % 2 === 1)
    expect(Math.min(...ys)).toBe(-10)
    expect(Math.max(...ys)).toBe(22)
    const xs = hull.filter((_, i) => i % 2 === 0)
    expect(Math.min(...xs)).toBe(-20)
    expect(Math.max(...xs)).toBe(20)
  })
})

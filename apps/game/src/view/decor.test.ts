import { describe, expect, test } from "bun:test"
import { Board } from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { mount, tick } from "../test/harness"
import Backdrop, { skyPoint } from "./Backdrop"
import BoardView from "./BoardView"
import FightScene, { classicFight } from "./FightScene"
import { drawFloatingIsland, undersideDepths } from "./islands"
import { camera, depthAlong, resetCamera } from "./theme"

describe("island underside (inverted pyramid of blocks)", () => {
  test("deterministic for a seed, deeper in the middle, irregular", () => {
    const a = undersideDepths(9, 9, 42)
    expect(undersideDepths(9, 9, 42)).toEqual(a)
    expect(undersideDepths(9, 9, 43)).not.toEqual(a)
    const center = a[4][4]
    const edges = [a[0][0], a[0][8], a[8][0], a[8][8], a[0][4], a[4][8]]
    for (const edge of edges) expect(edge).toBeLessThan(center)
    // irregular: the same ring does not have the same depth everywhere
    const ring = [a[2][2], a[2][6], a[6][2], a[6][6], a[2][4], a[4][2]]
    expect(new Set(ring).size).toBeGreaterThan(1)
    // every cell keeps at least one block, and the stack narrows to a
    // single tip in the middle (pointed, not flat)
    for (const row of a)
      for (const d of row) expect(d).toBeGreaterThanOrEqual(1)
    const all = a.flat()
    expect(all.filter((d) => d === center)).toHaveLength(1)
    expect(center).toBeGreaterThanOrEqual(12)
    expect(Math.max(...[a[4][3], a[3][4], a[4][5], a[5][4]])).toBeLessThan(
      center,
    )
  })

  test("a floating island can be drawn at any size", () => {
    for (const size of [3, 4, 5]) {
      const g = new Graphics()
      drawFloatingIsland(g, size, 7)
      expect(g.bounds.width).toBeGreaterThan(0)
    }
  })
})

describe("waterfalls", () => {
  const view = (rows: string[]) =>
    mount(
      new BoardView(Board.fromAscii(rows), new Container(), new Container(), 1),
    )

  test("one per water side on the front edges, none elsewhere", () => {
    // front edges: last row (left faces) and last column (right faces)
    const board = view([
      "W..W", // the last column's water pours to the right
      "....",
      "W...", // water in the first column, not on a front edge
      "~.ww", // the last row: 3 water cells, the corner pours both ways
    ])
    const sides = board.cascades.map((c) => `${c.dir.x},${c.dir.y}`).sort()
    // last row: (0,3) ~, (2,3) w, (3,3) w → 3 left falls (towards +y)
    // last column: (3,0) W, (3,3) w → 2 right falls (towards +x)
    expect(sides).toEqual(["0,1", "0,1", "0,1", "1,0", "1,0"])
    for (const c of board.cascades) expect(c.length).toBeGreaterThan(0)
    tick(board, 500) // they animate
    expect(view(["...", "...", "..."]).cascades).toHaveLength(0)
  })

  test("turned a quarter, the falls pour over the sides now in front", () => {
    try {
      camera.quarter = 1
      const board = view(["W..W", "....", "W...", "~.ww"])
      const sides = board.cascades.map((c) => `${c.dir.x},${c.dir.y}`).sort()
      // seen from the next corner: the last column (+x) and the first row (-y)
      // (3,0) W both ways, (0,0) W, (3,3) w
      expect(sides).toEqual(["0,-1", "0,-1", "1,0", "1,0"])
    } finally {
      resetCamera()
    }
  })

  test("a redrawn cell keeps its waterfalls up to date", () => {
    const board = view(["..", ".w"])
    expect(board.cascades).toHaveLength(2)
    board.refreshCell({ x: 1, y: 1 })
    expect(board.cascades).toHaveLength(2)
  })
})

describe("everything floats, each at its own pace", () => {
  test("distant islands: distinct periods, and they move", () => {
    const backdrop = mount(new Backdrop())
    const islands = backdrop.islands
    expect(islands.length).toBeGreaterThanOrEqual(4)
    const periods = islands.map((i) => i.period)
    expect(new Set(periods).size).toBe(periods.length)
    const before = islands.map((i) => i.node.y)
    tick(backdrop, 1500)
    const after = islands.map((i) => i.node.y)
    expect(after).not.toEqual(before)
  })

  test("stars are on a celestial vault: they go round along curves, with a trail", () => {
    const backdrop = mount(new Backdrop())
    ;(backdrop as any)._onResize(1200, 800)
    try {
      tick(backdrop, 16)
      const visible = () =>
        backdrop.stars.filter(
          (s) => s.x >= 0 && s.x <= 1200 && s.y >= 0 && s.y <= 800,
        )
      expect(visible().length).toBeGreaterThan(60)
      expect(backdrop.stars.every((s) => s.trail === 0)).toBe(true)
      const before = new Map(visible().map((s) => [s, { x: s.x, y: s.y }]))
      camera.yaw = 4
      tick(backdrop, 16)
      // every visible star moved, and left a trail as long as its way
      for (const [star, p] of before) {
        const way = Math.hypot(star.x - p.x, star.y - p.y)
        expect(way).toBeGreaterThan(1)
        expect(star.trail).toBeGreaterThanOrEqual(way - 1e-6)
      }
      // still again: no more trail
      tick(backdrop, 16)
      expect(backdrop.stars.every((s) => s.trail === 0)).toBe(true)
    } finally {
      resetCamera()
    }
  })

  test("seen from above, turning moves the stars along arcs, not straight lines", () => {
    const star = { azimuth: -135 + 10, elevation: -40 }
    const at = (turn: number, pitch: number) =>
      skyPoint(star, { turn, pitch }, 1200, 800)!
    // seen from the side (no tilt), a star on the horizon stays on it
    const flat = { azimuth: -135 + 10, elevation: 0 }
    const f0 = skyPoint(flat, { turn: 45, pitch: 0 }, 1200, 800)!
    const f1 = skyPoint(flat, { turn: 25, pitch: 0 }, 1200, 800)!
    expect(f1.y).toBeCloseTo(f0.y)
    // tilted down: the middle of the way is off the straight line
    const a = at(45, 45)
    const m = at(35, 45)
    const b = at(25, 45)
    const chord = { x: b.x - a.x, y: b.y - a.y }
    const off =
      Math.abs(chord.x * (m.y - a.y) - chord.y * (m.x - a.x)) /
      Math.hypot(chord.x, chord.y)
    expect(off).toBeGreaterThan(2)
    // tilting further down: the sky goes up
    expect(at(45, 50).y).toBeLessThan(a.y)
  })

  test("motes rise around the board and stretch along the camera's motion", () => {
    const backdrop = mount(new Backdrop())
    ;(backdrop as any)._onResize(1200, 800)
    try {
      tick(backdrop, 16)
      tick(backdrop, 16)
      const mote = backdrop.motes[0]
      // rising slowly: barely stretched
      expect(mote.sprite.scale.x / mote.sprite.scale.y).toBeLessThan(1.5)
      const before = { x: mote.sprite.x, y: mote.sprite.y }
      camera.yaw = 15
      tick(backdrop, 16)
      const dx = mote.sprite.x - before.x
      const dy = mote.sprite.y - before.y
      expect(Math.hypot(dx, dy)).toBeGreaterThan(5)
      // stretched along the way it went
      expect(mote.sprite.scale.x).toBeGreaterThan(mote.sprite.scale.y * 1.5)
      const angle = Math.atan2(dy, dx)
      const diff = Math.abs(Math.sin(mote.sprite.rotation - angle))
      expect(diff).toBeLessThan(0.2)
    } finally {
      resetCamera()
    }
  })

  test("distant islands nearer than the board are solid and in front of it", () => {
    const backdrop = mount(new Backdrop())
    ;(backdrop as any)._onResize(1280, 720)
    try {
      for (let quarter = 0; quarter < 4; quarter++) {
        camera.quarter = quarter
        tick(backdrop, 16)
        for (const island of backdrop.islands) {
          const a = (island.angle * Math.PI) / 180
          const near = depthAlong({ x: Math.cos(a), y: Math.sin(a) }) > 0
          if (near) {
            expect(island.node.parent).toBe(backdrop.front)
            expect(island.node.alpha).toBe(1)
            expect(island.graphics.tint).toBe(0xffffff)
          } else {
            expect(island.node.parent).not.toBe(backdrop.front)
            expect(island.node.alpha).toBeLessThan(1)
          }
        }
        // turning puts some in front and others behind
        const front = backdrop.islands.filter(
          (i) => i.node.parent === backdrop.front,
        )
        expect(front.length).toBeGreaterThan(0)
        expect(front.length).toBeLessThan(backdrop.islands.length)
      }
    } finally {
      resetCamera()
    }
  })

  test("distant islands are seen by the board's camera: they turn and tilt with it", () => {
    const backdrop = mount(new Backdrop())
    ;(backdrop as any)._onResize(1280, 720)
    const place = () =>
      backdrop.islands.map((i) => ({
        x: i.node.x,
        y: i.node.y,
        b: i.graphics.bounds.height,
      }))
    try {
      tick(backdrop, 16)
      const before = place()
      camera.quarter = 1
      tick(backdrop, 16)
      const turned = place()
      // a quarter turn moves each island around the board, by a lot
      for (const [i, p] of turned.entries())
        expect(
          Math.hypot(p.x - before[i].x, p.y - before[i].y),
        ).toBeGreaterThan(40)
      resetCamera()
      camera.pitch = 60
      tick(backdrop, 16)
      // seen from above: the ring flattens less, the heights shrink
      const above = place()
      expect(above.map((p) => p.y)).not.toEqual(before.map((p) => p.y))
      // and each island is drawn from that angle too
      expect(above.map((p) => p.b)).not.toEqual(before.map((p) => p.b))
    } finally {
      resetCamera()
    }
  })

  test("the island of the fight stays still (only the distant ones float)", () => {
    const scene = mount(
      new FightScene(
        classicFight({
          seed: 3,
          speed: 4,
          spectate: true,
          playerTeam: ["eva"],
          enemyTeam: ["gorr"],
        }),
      ),
    )
    const internals = scene as any
    const world = internals._world as Container
    for (let i = 0; i < 20; i++) {
      tick(scene, 400)
      // no screen shake playing: the island is exactly at its place
      if (internals._shake.remaining === 0) {
        expect(world.y).toBe(internals._fit.y + internals._pan.y)
      }
    }
  })
})

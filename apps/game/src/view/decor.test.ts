import { describe, expect, test } from "bun:test"
import { Board } from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { mount, tick } from "../test/harness"
import Backdrop from "./Backdrop"
import BoardView from "./BoardView"
import FightScene, {
  classicFight,
  ISLAND_FLOAT_AMPLITUDE,
  ISLAND_FLOAT_PERIOD,
} from "./FightScene"
import { drawFloatingIsland, undersideDepths } from "./islands"

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
    for (const row of a)
      for (const d of row) expect(d).toBeGreaterThanOrEqual(0)
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
    const sides = board.cascades.map((c) => c.side).sort()
    // last row: (0,3) ~, (2,3) w, (3,3) w → 3 left falls
    // last column: (3,0) W, (3,3) w → 2 right falls
    expect(sides).toEqual([-1, -1, -1, 1, 1])
    for (const c of board.cascades) expect(c.length).toBeGreaterThan(0)
    tick(board, 500) // they animate
    expect(view(["...", "...", "..."]).cascades).toHaveLength(0)
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
    expect(periods).not.toContain(ISLAND_FLOAT_PERIOD)
    const before = islands.map((i) => i.node.y)
    tick(backdrop, 1500)
    const after = islands.map((i) => i.node.y)
    expect(after).not.toEqual(before)
  })

  test("the island of the fight floats too", () => {
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
    const world = (scene as any)._world as Container
    const ys = new Set<number>()
    for (let i = 0; i < 20; i++) {
      tick(scene, ISLAND_FLOAT_PERIOD / 20)
      ys.add(Math.round(world.y * 10))
    }
    expect(ys.size).toBeGreaterThan(3)
    const base = (scene as any)._worldBase.y
    expect(Math.abs(world.y - base)).toBeLessThanOrEqual(
      ISLAND_FLOAT_AMPLITUDE + 12,
    )
  })
})

import { describe, expect, test } from "bun:test"
import { Board } from "./board"
import { Combat } from "./combat"
import { keyOf } from "./geometry"

const fight = (seed: number, sizes = [3, 3]) =>
  new Combat({
    seed,
    teams: sizes.map((n, i) => ({
      controller: i === 0 ? ("human" as const) : ("ai" as const),
      fighters: ["eva", "brutus", "nyx", "gorr", "lyra"].slice(0, n),
    })),
  })

describe("line-up", () => {
  test("the foes at the back, the first team on their mirror cells", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const c = fight(seed)
      const { width, height } = c.board
      const depth = width + height - 2
      const [mine, foes] = c.positions
      const region = c.walkableRegion
      for (const [i, p] of foes.entries()) {
        expect(p.x + p.y).toBeLessThan(depth / 2)
        expect(mine[i]).toEqual({ x: width - 1 - p.x, y: height - 1 - p.y })
        // any fighter can stand there, on both sides
        expect(region.has(keyOf(p))).toBe(true)
        expect(c.board.isDeepWater(p)).toBe(false)
        expect(c.board.get(p)!.elevation).toBe(c.board.get(mine[i])!.elevation)
      }
      expect(new Set(foes.map(keyOf)).size).toBe(3)
      expect(c.slotsOf(0).map(keyOf).sort()).toEqual(mine.map(keyOf).sort())
    }
  })

  test("the foes' cells change with the seed", () => {
    const keys = new Set(
      [1, 2, 3, 4].map((s) => fight(s).positions[1].map(keyOf).join()),
    )
    expect(keys.size).toBeGreaterThan(1)
  })

  test("more foes: as many slots as foes, to choose from", () => {
    const c = fight(5, [2, 4])
    expect(c.slotsOf(0)).toHaveLength(4)
    expect(c.slotsOf(1)).toHaveLength(4)
  })

  test("arranging: any order on the slots, before the fight only", () => {
    const c = fight(6)
    const slots = [...c.slotsOf(0)]
    const time = c.fighters.map((f) => f.nextActionAt)
    const reversed = [...slots].reverse()
    expect(c.arrange(0, reversed)).toBeNull()
    expect(c.positions[0]).toEqual(reversed)
    // the line-up never changes the fight's draws
    expect(c.fighters.map((f) => f.nextActionAt)).toEqual(time)
    expect(c.arrange(0, [slots[0], slots[0], slots[1]])).not.toBeNull()
    expect(c.arrange(0, [slots[0], slots[1]])).not.toBeNull()
    expect(c.arrange(0, [{ x: 0, y: 0 }, slots[1], slots[2]])).not.toBeNull()
    c.advance()
    expect(c.arrange(0, slots)).not.toBeNull()
  })

  test("an arranged fight replays from its positions", () => {
    const options = {
      seed: 9,
      teams: [
        { controller: "ai" as const, fighters: ["eva", "brutus"] },
        { controller: "ai" as const, fighters: ["gorr", "nyx"] },
      ],
    }
    const c = new Combat(options)
    c.arrange(0, [...c.slotsOf(0)].reverse())
    const positions = c.positions
    c.run(100_000)
    const replay = new Combat({ ...options, positions })
    replay.run(100_000)
    expect(replay.winnerTeam).toBe(c.winnerTeam)
    expect(replay.time).toBe(c.time)
  })

  test("explicit positions and other team counts keep their own rules", () => {
    const c = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "ai", fighters: ["eva"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    })
    expect(c.positions).toEqual([[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]])
    expect(fight(2, [1, 1, 1]).slotsOf(0)).toEqual([])
  })
})

import { describe, expect, test } from "bun:test"
import { dominantDirection, lineBetween, manhattan } from "./geometry"
import { createRng } from "./random"
import { zoneCells } from "./zones"

describe("geometry", () => {
  test("manhattan distance", () => {
    expect(manhattan({ x: 0, y: 0 }, { x: 3, y: -2 })).toBe(5)
  })

  test("dominant direction follows the largest axis", () => {
    expect(dominantDirection({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual({
      x: 1,
      y: 0,
    })
    expect(dominantDirection({ x: 0, y: 0 }, { x: -1, y: -4 })).toEqual({
      x: 0,
      y: -1,
    })
    expect(dominantDirection({ x: 2, y: 2 }, { x: 2, y: 2 })).toBeNull()
  })

  test("line between includes both ends and is contiguous", () => {
    const line = lineBetween({ x: 0, y: 0 }, { x: 4, y: 2 })
    expect(line[0]).toEqual({ x: 0, y: 0 })
    expect(line.at(-1)).toEqual({ x: 4, y: 2 })
    for (let i = 1; i < line.length; i++) {
      const step = Math.max(
        Math.abs(line[i].x - line[i - 1].x),
        Math.abs(line[i].y - line[i - 1].y),
      )
      expect(step).toBe(1)
    }
  })

  test("straight lines", () => {
    expect(lineBetween({ x: 0, y: 0 }, { x: 0, y: 3 })).toHaveLength(4)
    expect(lineBetween({ x: 0, y: 0 }, { x: 3, y: 3 })).toHaveLength(4)
  })
})

describe("zones", () => {
  const center = { x: 5, y: 5 }

  test.each([
    ["point", 0, 0, 1],
    ["square", 0, 1, 9],
    ["diamond", 0, 2, 13],
    ["line", 1, 2, 8],
    ["diagonal", 0, 1, 5],
    ["diamond", 2, 2, 8],
  ] as const)("%s min=%d max=%d has %d cells", (shape, min, max, count) => {
    expect(zoneCells(center, { shape, min, max })).toHaveLength(count)
  })

  test("min distance excludes the center", () => {
    const cells = zoneCells(center, { shape: "diamond", min: 1, max: 1 })
    expect(cells).not.toContainEqual(center)
  })
})

describe("random", () => {
  test("same seed gives the same sequence", () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 10; i++) expect(a.next()).toBe(b.next())
  })

  test("int stays within bounds", () => {
    const rng = createRng(1)
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(2, 5)
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(5)
    }
  })
})

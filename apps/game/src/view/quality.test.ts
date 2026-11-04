import { describe, expect, test } from "bun:test"
import { MIN_RESOLUTION, QUALITY_WINDOW, Quality } from "./quality"

describe("adaptive quality", () => {
  /** A quality past its warmup. */
  const warm = (resolution: number) => {
    const q = new Quality(resolution)
    for (let i = 0; i < QUALITY_WINDOW * 2; i++) q.frame(100)
    return q
  }
  const run = (q: Quality, ms: number, frames = QUALITY_WINDOW) => {
    let last: number | null = null
    for (let i = 0; i < frames; i++) last = q.frame(ms) ?? last
    return last
  }

  test("fast frames keep the resolution", () => {
    const q = warm(2)
    expect(run(q, 16, QUALITY_WINDOW * 5)).toBeNull()
    expect(q.resolution).toBe(2)
  })

  test("slow frames step it down, to 1 then by quarters, never below the floor", () => {
    const q = warm(2)
    expect(run(q, 40)).toBe(1)
    expect(run(q, 40)).toBe(0.75)
    expect(run(q, 40)).toBeNull()
    expect(q.resolution).toBe(MIN_RESOLUTION)
  })

  test("the first frames (loading) are not counted", () => {
    const q = new Quality(2)
    expect(run(q, 100, QUALITY_WINDOW * 2)).toBeNull()
    expect(q.resolution).toBe(2)
  })

  test("pauses (a hidden tab) are not slowness", () => {
    const q = warm(1.5)
    expect(run(q, 1000, QUALITY_WINDOW * 3)).toBeNull()
    expect(q.resolution).toBe(1.5)
  })
})

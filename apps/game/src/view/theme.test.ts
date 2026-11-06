import { describe, expect, test } from "bun:test"
import {
  DEFAULT_ENEMY_TEAM,
  DEFAULT_PLAYER_TEAM,
  MAX_ROSTER,
  parseParams,
} from "../params"
import {
  camera,
  cellNoise,
  diamond,
  ELEVATION_HEIGHT,
  ISO_PITCH,
  mix,
  project,
  resetCamera,
  shade,
  TILE_HEIGHT,
  TILE_WIDTH,
  toScreen,
  unproject,
} from "./theme"

describe("isometric projection", () => {
  test("x goes down-right, y goes down-left", () => {
    expect(toScreen({ x: 1, y: 0 })).toEqual({
      x: TILE_WIDTH / 2,
      y: TILE_HEIGHT / 2,
    })
    expect(toScreen({ x: 0, y: 1 })).toEqual({
      x: -TILE_WIDTH / 2,
      y: TILE_HEIGHT / 2,
    })
  })

  test("elevation raises the point", () => {
    expect(toScreen({ x: 0, y: 0 }, 2).y).toBe(-2 * ELEVATION_HEIGHT)
    expect(toScreen({ x: 0, y: 0 }, -1).y).toBe(ELEVATION_HEIGHT)
  })

  test("diamond is centered and inset shrinks it", () => {
    expect(diamond()).toEqual([0, -16, 32, 0, 0, 16, -32, 0])
    const inset = diamond(8)
    expect(inset[2]).toBe(24)
    expect(inset[1]).toBe(-12)
  })
})

describe("colors", () => {
  test("mix blends channels", () => {
    expect(mix(0x000000, 0xffffff, 0)).toBe(0x000000)
    expect(mix(0x000000, 0xffffff, 1)).toBe(0xffffff)
    expect(mix(0xff0000, 0x0000ff, 0.5)).toBe(0x800080)
  })

  test("shade darkens and clamps", () => {
    expect(shade(0x804020, 0.5)).toBe(0x402010)
    expect(shade(0xffffff, 2)).toBe(0xffffff)
  })

  test("cell noise is deterministic, in [0, 1) and varies", () => {
    const a = cellNoise({ x: 3, y: 4 }, 42, 1)
    expect(cellNoise({ x: 3, y: 4 }, 42, 1)).toBe(a)
    const values = new Set<number>()
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        const v = cellNoise({ x, y }, 1)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
        values.add(Math.floor(v * 10))
      }
    }
    expect(values.size).toBeGreaterThan(6)
  })
})

describe("URL parameters", () => {
  const parse = (query: string) => parseParams(new URLSearchParams(query))

  test("defaults", () => {
    expect(parse("")).toEqual({
      mode: "title",
      seed: null,
      spectate: false,
      debug: false,
      gallery: false,
      anim: null,
      speed: 1,
      playerTeam: DEFAULT_PLAYER_TEAM,
      enemyTeam: DEFAULT_ENEMY_TEAM,
      grant: [],
    })
  })

  test("grant keeps only forbidden actions that exist", () => {
    expect(parse("?grant=vacuumDecay,kick,nope").grant).toEqual(["vacuumDecay"])
  })

  test("flags and values", () => {
    const p = parse("?seed=42&spectate&debug&gallery&speed=0.25")
    expect(p).toMatchObject({
      seed: 42,
      spectate: true,
      debug: true,
      gallery: true,
      speed: 0.25,
    })
  })

  test("start screen: mode parameter, or a direct fight with fight parameters", () => {
    expect(parse("?mode=arcade").mode).toBe("arcade")
    expect(parse("?mode=nope").mode).toBe("title")
    expect(parse("?gallery").mode).toBe("gallery")
    expect(parse("?seed=4").mode).toBe("fight")
    expect(parse("?spectate").mode).toBe("fight")
    expect(parse("?team=eva").mode).toBe("fight")
    expect(parse("?seed=4&mode=local").mode).toBe("local")
  })

  test("invalid seed and speed fall back", () => {
    expect(parse("?seed=abc&speed=3")).toMatchObject({ seed: null, speed: 1 })
    expect(parse("?seed=")).toMatchObject({ seed: null })
  })

  test("rosters ignore unknown characters, are case-insensitive and capped", () => {
    expect(parse("?team=Eva, nobody ,GORR").playerTeam).toEqual(["eva", "gorr"])
    expect(parse("?enemies=zzz").enemyTeam).toEqual(DEFAULT_ENEMY_TEAM)
    const long = parse(`?team=${Array(10).fill("eva").join(",")}`)
    expect(long.playerTeam).toHaveLength(MAX_ROSTER)
  })
})

describe("unproject", () => {
  test("is project's inverse, from any view", () => {
    try {
      for (const view of [
        { quarter: 0, pitch: ISO_PITCH, yaw: 0 },
        { quarter: 1, pitch: 60, yaw: 12 },
        { quarter: 3, pitch: 75, yaw: -20 },
      ]) {
        Object.assign(camera, view)
        const o = project(2.5, -1.25)
        const g = unproject(o.x, o.y)
        expect(g.x).toBeCloseTo(2.5, 4)
        expect(g.y).toBeCloseTo(-1.25, 4)
      }
    } finally {
      resetCamera()
    }
  })
})

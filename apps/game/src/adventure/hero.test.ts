import { describe, expect, test } from "bun:test"
import { storyItems } from "@realms/adventure"
import { LOOK_PARTS } from "@realms/engine"
import { BASE_STATS, GROWTH } from "./hero"

describe("the hero's growth covers the whole story", () => {
  test("every item the story gives has an entry in GROWTH", () => {
    const missing = storyItems().filter((k) => !(k in GROWTH))
    expect(missing).toEqual([])
  })
  test("every entry is something the story gives (no dead rows)", () => {
    const given = new Set(storyItems())
    const dead = Object.keys(GROWTH).filter(
      (k) => !given.has(k) && !k.startsWith("action:"),
    )
    expect(dead).toEqual([])
  })
  test("every look piece is inside the puppet's parts, every stat a real one", () => {
    for (const [id, g] of Object.entries(GROWTH)) {
      for (const [part, n] of Object.entries(g.look ?? {})) {
        expect(part in LOOK_PARTS).toBe(true)
        const max = LOOK_PARTS[part as keyof typeof LOOK_PARTS]
        expect([id, part, n >= 0 && n < max]).toEqual([id, part, true])
      }
      for (const k of Object.keys(g.stats ?? {}))
        expect(k in BASE_STATS).toBe(true)
    }
  })
})

import { describe, expect, test } from "bun:test"
import { storyItems } from "@realms/adventure"
import { GROWTH } from "./hero"

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
})

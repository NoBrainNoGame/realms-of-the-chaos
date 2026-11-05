import { describe, expect, test } from "bun:test"
import { ACTIONS } from "./content"
import { isSupport } from "./support"

describe("isSupport", () => {
  test("heals and shields help, attacks do not", () => {
    const all = Object.values(ACTIONS)
    const support = all.filter(isSupport)
    expect(support.length).toBeGreaterThan(0)
    for (const action of support) {
      expect(action.effects.some((e) => e.type === "damage")).toBe(false)
      expect(action.target).not.toBe("enemy")
    }
    for (const action of all.filter((a) =>
      a.effects.some((e) => e.type === "damage"),
    ))
      expect(isSupport(action)).toBe(false)
  })
})

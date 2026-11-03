import { describe, expect, test } from "bun:test"
import { CHARACTER_ART, ICON_ART, type PixelArt } from "./pixelArt"
import { ACTIONS, CHARACTERS, DIVINE_ACTIONS } from "@realms/engine"

function validate(name: string, art: PixelArt, size: number) {
  expect(art.rows, name).toHaveLength(size)
  art.rows.forEach((row, y) => {
    expect(row.length, `${name} row ${y}: "${row}"`).toBe(size)
    for (const char of row) {
      if (char === ".") continue
      expect(
        art.palette[char],
        `${name} row ${y}: unknown color "${char}"`,
      ).toBeDefined()
    }
  })
}

describe("pixel art", () => {
  test("every character has a valid 16×16 sprite", () => {
    for (const id of Object.keys(CHARACTERS)) {
      expect(CHARACTER_ART[id], id).toBeDefined()
      validate(id, CHARACTER_ART[id], 16)
    }
  })

  test("every action and divine action has a valid 8×8 icon", () => {
    for (const id of [
      ...Object.keys(ACTIONS),
      ...Object.keys(DIVINE_ACTIONS),
    ]) {
      expect(ICON_ART[id], id).toBeDefined()
      validate(id, ICON_ART[id], 8)
    }
  })

  test("palette colors are valid hex", () => {
    for (const art of [
      ...Object.values(CHARACTER_ART),
      ...Object.values(ICON_ART),
    ]) {
      for (const color of Object.values(art.palette)) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      }
    }
  })
})

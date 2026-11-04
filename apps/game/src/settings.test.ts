import { afterEach, describe, expect, test } from "bun:test"
import {
  DEFAULT_SETTINGS,
  resetSettings,
  settings,
  stepChoice,
  TEXT_SIZES,
  UI_SIZES,
  updateSettings,
} from "./settings"
import { style } from "./view/ui"

afterEach(() => resetSettings())

describe("settings", () => {
  test("default to normal sizes, saved in the storage", () => {
    expect(settings()).toEqual(DEFAULT_SETTINGS)
    updateSettings({ textSize: 1.3 })
    expect(settings().textSize).toBe(1.3)
    expect(
      JSON.parse(globalThis.localStorage.getItem("realms.settings") ?? "{}"),
    ).toEqual({ textSize: 1.3, uiSize: 1 })
  })

  test("only known values are kept", () => {
    updateSettings({ textSize: 7, uiSize: 0.8 })
    expect(settings()).toEqual({ textSize: 1, uiSize: 0.8 })
  })

  test("‹ › move to the neighbour value, clamped at both ends", () => {
    expect(stepChoice(TEXT_SIZES, 1, 1)).toBe(1.15)
    expect(stepChoice(TEXT_SIZES, 1, -1)).toBe(0.85)
    expect(stepChoice(TEXT_SIZES, 0.85, -1)).toBe(0.85)
    expect(stepChoice(UI_SIZES, 1.3, 1)).toBe(1.3)
  })

  test("the text size scales every font and its line height", () => {
    expect(style(20).fontSize).toBe(20)
    updateSettings({ textSize: 1.3 })
    expect(style(20).fontSize).toBe(26)
    expect(style(10, 0, { lineHeight: 20 }).lineHeight).toBe(26)
  })
})

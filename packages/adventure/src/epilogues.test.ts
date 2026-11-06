import { describe, expect, test } from "bun:test"
import type { Ending, EndingWorld } from "./chapters/era5"
import {
  DISPERSION_WORLDS,
  ENDING_NAMES,
  EPILOGUES,
  epilogueOf,
} from "./epilogues"

const ENDINGS = Object.keys(EPILOGUES) as Ending[]

describe("epilogues", () => {
  test("every ending has pages with titles and sane lines", () => {
    expect(ENDINGS).toHaveLength(7)
    for (const fin of ENDINGS) {
      expect(ENDING_NAMES[fin].length).toBeGreaterThan(0)
      const pages = EPILOGUES[fin]
      expect(pages.length).toBeGreaterThanOrEqual(2)
      const all = [
        ...pages,
        ...(fin === "dispersion" ? Object.values(DISPERSION_WORLDS) : []),
      ]
      for (const p of all) {
        expect(p.title.trim().length).toBeGreaterThan(0)
        expect(p.lines.length).toBeGreaterThan(0)
        for (const l of p.lines) {
          expect(l.text.trim().length).toBeGreaterThan(0)
          expect(l.text.length).toBeLessThanOrEqual(320)
          expect(l.text).not.toContain("TODO")
        }
      }
    }
  })

  test("dispersion worlds give different last pages", () => {
    const worlds: EndingWorld[] = ["cristal", "equilibre", "ouvert"]
    const titles = worlds.map((monde) => {
      const pages = epilogueOf({ fin: "dispersion", monde })
      return pages[pages.length - 1]?.title
    })
    expect(new Set(titles).size).toBe(3)
    expect(epilogueOf({ fin: "dispersion" }).at(-1)).toBe(
      DISPERSION_WORLDS.cristal,
    )
  })

  test("other endings are returned as is", () => {
    expect(epilogueOf({ fin: "bascule" })).toBe(EPILOGUES.bascule)
  })
})

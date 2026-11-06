import { describe, expect, test } from "bun:test"
import { CHARACTERS } from "./content"
import {
  type CustomCharacter,
  checkCustom,
  customDefaults,
  customPreset,
} from "./custom"
import {
  checkLook,
  defaultLook,
  LOOK_KEYS,
  LOOK_PARTS,
  randomColors,
  randomLook,
} from "./look"

const kit = Object.keys(CHARACTERS)[0]
const sample = (): CustomCharacter => ({
  name: "Zaren",
  kit,
  stats: customDefaults(kit),
})

describe("look", () => {
  test("part counts meet the minimums", () => {
    expect(LOOK_PARTS.body).toBeGreaterThanOrEqual(3)
    expect(LOOK_PARTS.head).toBeGreaterThanOrEqual(3)
    expect(LOOK_PARTS.hair).toBeGreaterThanOrEqual(6)
    expect(LOOK_PARTS.face).toBeGreaterThanOrEqual(3)
    expect(LOOK_PARTS.top).toBeGreaterThanOrEqual(5)
    expect(LOOK_PARTS.legs).toBeGreaterThanOrEqual(4)
    expect(LOOK_PARTS.cape).toBeGreaterThanOrEqual(4)
    expect(LOOK_PARTS.accessory).toBeGreaterThanOrEqual(5)
    expect(LOOK_PARTS.mark).toBeGreaterThanOrEqual(4)
    expect(LOOK_PARTS.skin).toBeGreaterThanOrEqual(6)
    expect(LOOK_PARTS.cloth).toBeGreaterThanOrEqual(10)
    expect(LOOK_PARTS.metal).toBeGreaterThanOrEqual(4)
  })

  test("random looks are deterministic and valid", () => {
    for (let seed = 0; seed < 200; seed++) {
      const look = randomLook(seed)
      expect(checkLook(look).ok).toBe(true)
      expect(randomLook(seed)).toEqual(look)
      expect(look.cloth2).not.toBe(look.cloth)
    }
    expect(randomLook("a")).toEqual(randomLook("a"))
    expect(randomLook(1)).not.toEqual(randomLook(2))
    expect(checkLook(defaultLook(kit)).ok).toBe(true)
    const recolored = randomColors(randomLook(3), 9)
    expect(recolored.hair).toBe(randomLook(3).hair)
    expect(checkLook(recolored).ok).toBe(true)
  })

  test("checkLook refuses bad shapes and ranges", () => {
    const good = randomLook(5)
    expect(checkLook(null).ok).toBe(false)
    expect(checkLook([]).ok).toBe(false)
    expect(checkLook({ ...good, hair: -1 }).ok).toBe(false)
    expect(checkLook({ ...good, hair: LOOK_PARTS.hair }).ok).toBe(false)
    expect(checkLook({ ...good, skin: 1.5 }).ok).toBe(false)
    expect(checkLook({ ...good, metal: "1" }).ok).toBe(false)
    const missing: Record<string, number> = { ...good }
    delete missing[LOOK_KEYS[0]]
    expect(checkLook(missing).ok).toBe(false)
  })

  test("checkCustom validates a look when present, and ignores it for balance", () => {
    const plain = checkCustom(sample())
    const looked = checkCustom({ ...sample(), look: randomLook(1) })
    expect(plain.ok && looked.ok).toBe(true)
    if (plain.ok && looked.ok)
      expect(looked.preset.stats).toEqual(plain.preset.stats)
    const bad = checkCustom({
      ...sample(),
      look: { ...randomLook(1), top: 99 },
    })
    expect(bad.ok).toBe(false)
    expect(() =>
      customPreset({ ...sample(), look: { ...randomLook(1), top: 99 } }),
    ).toThrow()
  })
})

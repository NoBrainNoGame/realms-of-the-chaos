import { describe, expect, test } from "bun:test"
import {
  CHARACTERS,
  type CustomLook,
  LOOK_KEYS,
  LOOK_PARTS,
  randomLook,
} from "@realms/engine"
import { type Facing, Puppet, type PuppetAction } from "../view/Puppet"
import { palettesCover, resolveLook } from "./lookPalettes"
import { lookPortrait } from "./lookPortrait"

const FACINGS: Facing[] = ["SE", "SW", "NE", "NW"]
const ACTIONS: PuppetAction[] = ["melee", "shoot", "cast", "roar", "hit"]
const kit = Object.keys(CHARACTERS)[0]

const baseLook = (): CustomLook => randomLook(7)

/** Every option of every part, one at a time, plus the extremes together. */
function looks(): CustomLook[] {
  const out: CustomLook[] = []
  for (const key of LOOK_KEYS)
    for (let i = 0; i < LOOK_PARTS[key]; i++)
      out.push({ ...baseLook(), [key]: i })
  const lows = Object.fromEntries(LOOK_KEYS.map((k) => [k, 0])) as CustomLook
  const highs = Object.fromEntries(
    LOOK_KEYS.map((k) => [k, LOOK_PARTS[k] - 1]),
  ) as CustomLook
  out.push(lows, highs)
  return out
}

function animate(puppet: Puppet) {
  for (const facing of FACINGS) {
    puppet.setFacing(facing)
    puppet.update(16)
    puppet.walk(500)
    for (let i = 0; i < 6; i++) puppet.update(40)
    for (const action of ACTIONS) {
      puppet.act(action, 400)
      for (let i = 0; i < 12; i++) puppet.update(40)
    }
    puppet.setSwimming(true)
    for (let i = 0; i < 6; i++) puppet.update(40)
    puppet.act("melee", 400)
    puppet.update(100)
    puppet.setSwimming(false)
    puppet.flash(0xff0000)
  }
}

describe("modular puppet", () => {
  test("palettes cover every index the engine allows", () => {
    expect(palettesCover()).toBe(true)
    for (const look of looks()) expect(resolveLook(look).skin).toBeNumber()
  })

  test("every option of every part builds, in every orientation and animation", () => {
    for (const look of looks()) {
      const puppet = new Puppet(kit, look)
      animate(puppet)
      puppet.destroy({ children: true })
    }
  })

  test("every kit (weapon, golem) wears a look", () => {
    for (const id of Object.keys(CHARACTERS)) {
      const puppet = new Puppet(id, baseLook())
      animate(puppet)
      expect(puppet.headHeight).toBeGreaterThan(40)
    }
  })

  test("the cape is behind the body facing the camera, over it from behind", () => {
    const look = { ...baseLook(), cape: 2 }
    const puppet = new Puppet(kit, look) as any
    const front = puppet._front.root.children[0].children as any[]
    const back = puppet._back.root.children[0].children as any[]
    // front: the first thing drawn, before the torso and the legs
    expect(front.indexOf(puppet._front.torso)).toBeGreaterThan(0)
    expect(front.indexOf(puppet._front.legNear)).toBeGreaterThan(0)
    expect(front[0]).not.toBe(puppet._front.legFar)
    // back: right after the torso, over the legs and the torso
    const torso = back.indexOf(puppet._back.torso)
    expect(back.indexOf(puppet._back.legNear)).toBeLessThan(torso)
    expect(back[torso + 1]).not.toBe(puppet._back.head)
    expect(back.indexOf(puppet._back.head)).toBe(torso + 2)
    const bare = new Puppet(kit, { ...look, cape: 0 }) as any
    expect(bare._front.root.children[0].children.length).toBe(front.length - 1)
    expect(bare._back.root.children[0].children.length).toBe(back.length - 1)
  })

  test("portraits are 16x16 and built from the same palettes", () => {
    for (const look of looks()) {
      const art = lookPortrait(look)
      expect(art.rows).toHaveLength(16)
      for (const row of art.rows) {
        expect(row).toHaveLength(16)
        for (const ch of row)
          if (ch !== ".") expect(art.palette[ch]).toBeDefined()
      }
    }
    expect(lookPortrait(baseLook()).rows).not.toEqual(
      lookPortrait({ ...baseLook(), skin: 5, hair: 3 }).rows,
    )
  })
})

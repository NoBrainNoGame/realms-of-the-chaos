import { describe, expect, test } from "bun:test"
import { Board, Combat } from "@realms/engine"
import { Container } from "pixi.js"
import { mount } from "../test/harness"
import FighterView from "./FighterView"
import { Puppet } from "./Puppet"
import { applyWaterPose, makeRipple, makeWaterMask, waterState } from "./water"

describe("water, in a fight and on the island alike", () => {
  const board = Board.fromAscii(["...", "~~~", "WWW"])
  test("a hero on a deep water cell has the same offset and pose in both", () => {
    const deep = [0, 1, 2]
      .flatMap((x) => [0, 1, 2].map((y) => ({ x, y })))
      .find((p) => board.isDeepWater(p))
    if (!deep) throw new Error("no deep cell")
    expect(waterState(board, deep)).toBe("swimming")

    const combat = new Combat({
      seed: 1,
      board: new Board(3, 3),
      teams: [
        { controller: "ai", fighters: ["brutus"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 2, y: 2 }]],
    })
    const view = mount(
      new FighterView(combat.fighters[0], combat.baseMaxHp(combat.fighters[0])),
      new Container(),
    )
    view.setWater(waterState(board, deep))
    const fightPuppet = (view as unknown as { _puppet: Puppet })._puppet

    const walker = new Puppet(combat.fighters[0].presetId)
    const mask = makeWaterMask()
    const ripple = makeRipple()
    applyWaterPose(walker, waterState(board, deep), mask, ripple)

    expect(walker.y).toBe(fightPuppet.y)
    expect(walker.y).toBeGreaterThan(0)
    expect(walker.isSwimming).toBe(fightPuppet.isSwimming)
    expect(walker.isSwimming).toBe(true)
    expect(Boolean(walker.mask)).toBe(Boolean(fightPuppet.mask))
    expect(ripple.visible).toBe(true)
  })

  test("dry cells leave the puppet alone", () => {
    const p = new Puppet("brutus")
    applyWaterPose(
      p,
      waterState(board, { x: 0, y: 0 }),
      makeWaterMask(),
      makeRipple(),
    )
    expect(p.y).toBe(0)
    expect(p.mask).toBeFalsy()
  })
})

import { describe, expect, test } from "bun:test"
import { Graphics } from "pixi.js"
import { CHARACTERS } from "@realms/engine"
import {
  Puppet,
  STYLES,
  computePose,
  facingBetween,
  isBackFacing,
  isMirrored,
  type Facing,
  type PuppetAction,
} from "./Puppet"

const FACINGS: Facing[] = ["SE", "SW", "NE", "NW"]
const ACTIONS: PuppetAction[] = ["melee", "shoot", "cast", "roar", "hit"]

describe("facing", () => {
  // grid +x is screen down-right, +y is screen down-left
  test.each([
    [{ x: 1, y: 0 }, "SE"],
    [{ x: 0, y: 1 }, "SW"],
    [{ x: 0, y: -1 }, "NE"],
    [{ x: -1, y: 0 }, "NW"],
    [{ x: 3, y: 1 }, "SE"],
    [{ x: -1, y: 4 }, "SW"],
  ] as const)("towards %p is %s", (to, facing) => {
    expect(facingBetween({ x: 0, y: 0 }, to)).toBe(facing)
  })

  test("same cell keeps the fallback", () => {
    expect(facingBetween({ x: 2, y: 2 }, { x: 2, y: 2 }, "NW")).toBe("NW")
    expect(facingBetween({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe("SE")
  })

  test("front views look down, back views look up, west is mirrored", () => {
    expect(FACINGS.map(isBackFacing)).toEqual([false, false, true, true])
    expect(FACINGS.map(isMirrored)).toEqual([false, true, false, true])
  })
})

describe("poses", () => {
  test("idle: limbs nearly still, legs straight", () => {
    const pose = computePose(1234, false, null)
    expect(pose.legFar).toBe(0)
    expect(pose.legNear).toBe(0)
    expect(Math.abs(pose.armNear)).toBeLessThan(0.2)
    expect(pose.glowBoost).toBe(1)
  })

  test("walking: legs swing in opposition and the body bounces", () => {
    const pose = computePose(85 * 1.2, true, null)
    expect(pose.legFar).toBeCloseTo(-pose.legNear)
    expect(Math.abs(pose.legFar)).toBeGreaterThan(0.3)
    expect(pose.bodyY).toBeLessThan(0)
  })

  test("golems swing their long arms less", () => {
    const human = computePose(85 * 1.2, true, null, 1)
    const golem = computePose(85 * 1.2, true, null, 0.6)
    expect(Math.abs(golem.armNear)).toBeLessThan(Math.abs(human.armNear))
  })

  test("melee: the weapon arm winds up then strikes forward", () => {
    expect(
      computePose(0, false, { kind: "melee", progress: 0.35 }).armNear,
    ).toBeCloseTo(1.3)
    expect(
      computePose(0, false, { kind: "melee", progress: 1 }).armNear,
    ).toBeCloseTo(-1.7)
  })

  test("cast and roar raise both arms and boost glows", () => {
    for (const kind of ["cast", "roar"] as const) {
      const pose = computePose(0, false, { kind, progress: 0.5 })
      expect(pose.armNear).toBeLessThan(-2)
      expect(pose.armFar).toBeLessThan(-2)
      expect(pose.glowBoost).toBeGreaterThan(1)
    }
  })

  test("shoot keeps the bow arm up, hit leans back", () => {
    expect(
      computePose(0, false, { kind: "shoot", progress: 0.5 }).armNear,
    ).toBeCloseTo(-1.45)
    expect(
      computePose(0, false, { kind: "hit", progress: 0.5 }).bodyRot,
    ).toBeCloseTo(-0.3)
  })

  test("swimming: arms sweep forward, faster when moving", () => {
    const still = [0, 100, 200, 300].map((t) =>
      computePose(t, false, null, 1, true),
    )
    for (const pose of still) expect(pose.armNear).toBeLessThan(0)
    expect(
      new Set(still.map((p) => p.armNear.toFixed(2))).size,
    ).toBeGreaterThan(1)
    // a stroke cycle is shorter while moving
    const a = computePose(140 * Math.PI, true, null, 1, true).armNear
    const b = computePose(320 * Math.PI, false, null, 1, true).armNear
    expect(a).toBeCloseTo(b)
  })

  test("progress is clamped", () => {
    expect(computePose(0, false, { kind: "cast", progress: 2 })).toEqual(
      computePose(0, false, { kind: "cast", progress: 1 }),
    )
  })
})

describe("Puppet", () => {
  test("every character has a style", () => {
    for (const id of Object.keys(CHARACTERS)) expect(STYLES[id]).toBeDefined()
    expect(() => new Puppet("nobody")).toThrow()
  })

  for (const id of Object.keys(STYLES)) {
    test(`${id}: 4 facings show the right view, mirrored when needed`, () => {
      const puppet = new Puppet(id)
      const [front, back] = puppet.children
      for (const facing of FACINGS) {
        puppet.setFacing(facing)
        expect(puppet.facing).toBe(facing)
        expect(front.visible).toBe(!isBackFacing(facing))
        expect(back.visible).toBe(isBackFacing(facing))
        expect(Math.sign(puppet.rig.root.scale.x)).toBe(
          isMirrored(facing) ? -1 : 1,
        )
        expect(puppet.rig.root).toBe(isBackFacing(facing) ? back : front)
      }
    })

    test(`${id}: animates every action and walk without errors`, () => {
      const puppet = new Puppet(id)
      for (const facing of FACINGS) {
        puppet.setFacing(facing)
        puppet.walk(200)
        expect(puppet.isWalking).toBe(true)
        for (let t = 0; t < 250; t += 16) puppet.update(16)
        expect(puppet.isWalking).toBe(false)
        for (const action of ACTIONS) {
          puppet.act(action, 100)
          expect(puppet.currentAction).toBe(action)
          puppet.update(50)
          puppet.update(60)
          expect(puppet.currentAction).toBeNull()
        }
      }
      expect(puppet.headHeight).toBeGreaterThan(40)
    })
  }

  test("swim mode is applied on update", () => {
    const puppet = new Puppet("nerea")
    puppet.setSwimming(true)
    expect(puppet.isSwimming).toBe(true)
    puppet.update(100)
    expect(puppet.rig.armNear.rotation).toBeLessThan(0)
  })

  test("melee moves the weapon arm of the visible rig", () => {
    const puppet = new Puppet("brutus")
    puppet.update(16)
    const rest = puppet.rig.armNear.rotation
    puppet.act("melee", 200)
    puppet.update(70)
    expect(puppet.rig.armNear.rotation).not.toBeCloseTo(rest)
  })

  test("the golem is a different build: bigger, with its own joints", () => {
    const golem = new Puppet("gorr")
    const human = new Puppet("eva")
    expect(golem.rig.hip).not.toBe(human.rig.hip)
    expect(golem.headHeight).toBeGreaterThan(human.headHeight)
    expect(golem.rig.glows.length).toBe(2) // glowing eyes
  })

  test("flash tints every graphic", () => {
    const puppet = new Puppet("lyra")
    puppet.flash(0xff0000)
    const tints: number[] = []
    const visit = (node: any) => {
      for (const child of node.children) {
        if (child instanceof Graphics) tints.push(child.tint)
        visit(child)
      }
    }
    visit(puppet)
    expect(tints.length).toBeGreaterThan(5)
    expect(tints.every((t) => t === 0xff0000)).toBe(true)
  })
})

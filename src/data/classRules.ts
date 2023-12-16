/**
 * Contains all the class rules like class-based actions, class-based stat modifiers, etc.
 */
import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

// @ts-ignore
import arrowShot from "../../assets/images/action-icons/arrow-shot.png"

// @ts-ignore
import arrow from "../../assets/images/arrow.png"

import * as enums from "../enums"
import * as rangeZones from "./rangeZones"

import Rules from "../entities/Rules"

interface ClassRules extends Rules {
  class: enums.CharacterClass
}

const classRules = {
  [enums.CharacterClass.ARCHER]: {
    class: enums.CharacterClass.ARCHER,
    actions: [
      {
        name: "ArrowShot",
        icon: pixi.Texture.from(arrowShot),
        targetZone: rangeZones.target,
        targetType: "character",
        timeCost: ({ launcher }) => launcher.latence / 2,
        canBeUsed: () => true,
        behavior: ({ launcher, targetCells, fight }) => {
          let arrowSprite = new pixi.Sprite(pixi.Texture.from(arrow))

          const target = fight.characters.find((c) => c.cell === targetCells[0])

          if (!target) return new booyah.Transitory()

          return new booyah.Sequence([
            new booyah.Lambda(() => {
              arrowSprite.position.copyFrom(launcher.position)

              arrowSprite.rotation = Math.atan2(
                target.position.y - launcher.position.y,
                target.position.x - launcher.position.x,
              )

              fight.gridContainer.addChild(arrowSprite)
            }),
            new booyah.Parallel([
              new booyah.Tween({
                from: launcher.position.x,
                to: targetCells[0].position.x,
                duration: 250,
                easing: booyah.easeOutCubic,
                onTick: (x) => {
                  arrowSprite.position.x = x
                },
              }),
              new booyah.Tween({
                from: launcher.position.y,
                to: target.position.y,
                duration: 250,
                easing: booyah.easeOutQuart,
                onTick: (y) => {
                  arrowSprite.position.y = y
                },
              }),
            ]),
            new booyah.Lambda(() => {
              fight.gridContainer.removeChild(arrowSprite)

              arrowSprite.destroy()

              launcher.doPhysicalDamagesTo(target)
            }),
          ])
        },
      },
    ],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.BARD]: {
    class: enums.CharacterClass.BARD,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.HEALER]: {
    class: enums.CharacterClass.HEALER,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.MAGE]: {
    class: enums.CharacterClass.MAGE,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.TANK]: {
    class: enums.CharacterClass.TANK,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.WARRIOR]: {
    class: enums.CharacterClass.WARRIOR,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.ASSASSIN]: {
    class: enums.CharacterClass.ASSASSIN,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.ENGINEER]: {
    class: enums.CharacterClass.ENGINEER,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.HUNTER]: {
    class: enums.CharacterClass.HUNTER,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.PIRATE]: {
    class: enums.CharacterClass.PIRATE,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.SCIENTIST]: {
    class: enums.CharacterClass.SCIENTIST,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.SCOUT]: {
    class: enums.CharacterClass.SCOUT,
    actions: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterClass.THIEF]: {
    class: enums.CharacterClass.THIEF,
    actions: [],
    expCurve: booyah.linear,
  },
} satisfies Record<enums.CharacterClass, ClassRules>

export default classRules

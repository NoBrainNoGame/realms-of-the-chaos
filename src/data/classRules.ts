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
        range: 6,
        scope: "enemy",
        timeCost: ({ author }) => author.latence / 2,
        canBeUsed: () => true,
        behavior: ({ author, targets, container }) => {
          let arrowSprite = new pixi.Sprite(pixi.Texture.from(arrow))

          return new booyah.Sequence([
            new booyah.Lambda(() => {
              arrowSprite.position.copyFrom(author.position)

              arrowSprite.rotation = Math.atan2(
                targets[0].position.y - author.position.y,
                targets[0].position.x - author.position.x,
              )

              container.addChild(arrowSprite)
            }),
            new booyah.Parallel([
              new booyah.Tween({
                from: author.position.x,
                to: targets[0].position.x,
                duration: 250,
                easing: booyah.easeOutCubic,
                onTick: (x) => {
                  arrowSprite.position.x = x
                },
              }),
              new booyah.Tween({
                from: author.position.y,
                to: targets[0].position.y,
                duration: 250,
                easing: booyah.easeOutQuart,
                onTick: (y) => {
                  arrowSprite.position.y = y
                },
              }),
            ]),
            new booyah.Lambda(() => {
              container.removeChild(arrowSprite)

              arrowSprite.destroy()

              targets.forEach((target) =>
                author.doPhysicalDamagesTo(target, 0.5),
              )
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

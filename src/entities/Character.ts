import * as pixi from "pixi.js"
import * as enums from "../enums"
import * as booyah from "@ghom/booyah"

import ContainerChip from "../parents/ContainerChip"
import PlayerTurn from "./PlayerTurn"

interface CharacterEvents extends booyah.BaseCompositeEvents {
  playerAction: [booyah.ChipBase]
}

export interface CharacterProperties {
  name: string
  texture: pixi.Texture
  class: enums.CharacterClass
  race: enums.CharacterRace
  level: number
  distribution: Partial<Record<enums.CharacterSkill, number>>
  behavior?: () => { timeCost: number; chip: booyah.ChipResolvable }
}

export default class Character extends ContainerChip<CharacterEvents> {
  private _sprite!: pixi.Sprite
  private _timeBeforeAction!: number

  get latence() {
    return 200 - Math.min(this.getStat(enums.CharacterSkill.SPEED), 100)
  }

  get position() {
    return this._container.position
  }

  constructor(private _baseProperties: CharacterProperties) {
    super()
  }

  protected _onActivate() {
    this._timeBeforeAction = this.latence

    this._sprite = new pixi.Sprite(this._baseProperties.texture)

    this._sprite.anchor.set(0.5, 0.75)

    this._container.addChild(this._sprite)
  }

  getStat(name: enums.CharacterSkill) {
    return 1 + (this._baseProperties.distribution[name] ?? 0)
  }

  timelineTick(animations: booyah.Queue) {
    if (this.state !== "active") return

    this._timeBeforeAction -= this._lastTickInfo.timeSinceLastTick

    if (this._timeBeforeAction <= 0) {
      this._timeBeforeAction = 0

      if (this._baseProperties.behavior) {
        const { timeCost, chip } = this._baseProperties.behavior()

        this.addActionTime(timeCost)

        animations.add(chip, {})
      } else {
        animations.add(new PlayerTurn(this, animations), {})
      }
    }
  }

  addActionTime(time: number) {
    this._timeBeforeAction += time
  }
}

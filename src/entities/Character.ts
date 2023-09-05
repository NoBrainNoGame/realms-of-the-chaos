import * as pixi from "pixi.js"
import * as enums from "../enums"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"

import ContainerChip from "../extensions/ContainerChip"
import PlayerTurn from "./PlayerTurn"
import GridCell from "./GridCell"

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
  private _cell!: GridCell | null
  private _sprite!: pixi.Sprite
  private _timeBeforeAction!: number

  constructor(private _baseProperties: CharacterProperties) {
    super()
  }

  get cell() {
    return this._cell
  }

  set cell(cell: GridCell | null) {
    this._cell = cell
  }

  get latence() {
    return 200 - Math.min(this.getStat(enums.CharacterSkill.SPEED), 100)
  }

  get position() {
    return this._container.position
  }

  protected _onActivate() {
    this._cell = null
    this._timeBeforeAction = this.latence

    this._sprite = new pixi.Sprite(this._baseProperties.texture)

    this._sprite.anchor.set(0.5, 0.75)
    this._sprite.visible = false

    this._container.addChild(this._sprite)
  }

  protected _onTick() {
    if (this._cell) {
      this._container.position.copyFrom(this._cell.position)
      this._container.zIndex = this._cell.hex.row
      this._sprite.visible = true
    }
  }

  public getStat(name: enums.CharacterSkill) {
    return 1 + (this._baseProperties.distribution[name] ?? 0)
  }

  public timelineTick(animations: booyah.Queue) {
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

  public addActionTime(time: number) {
    this._timeBeforeAction += time
  }
}

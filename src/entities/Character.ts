import * as pixi from "pixi.js"
import * as enums from "../enums"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"

import ContainerChip from "../extensions/ContainerChip"
import PlayerTurn from "./PlayerTurn"
import GridCell from "./GridCell"
import Grid from "./Grid"

import { GlowFilter } from "@pixi/filter-glow"

interface CharacterEvents extends booyah.BaseCompositeEvents {
  moved: [from: GridCell, to: GridCell]
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
  private _teamIndex!: number
  private _sprite!: pixi.Sprite
  private _timeBeforeAction!: number
  private _zAdjustment!: number

  constructor(private _baseProperties: CharacterProperties) {
    super()
  }

  get texture() {
    return this._baseProperties.texture
  }

  get cell() {
    return this._cell
  }

  set cell(cell: GridCell | null) {
    if (this._cell) {
      this._cell.removeTeamIndicator(this._teamIndex)
    }

    this._cell = null

    if (cell) {
      this._cell = cell

      cell?.addTeamIndicator(this._teamIndex)
    }
  }

  get teamIndex() {
    return this._teamIndex
  }

  set teamIndex(teamIndex: number) {
    this._teamIndex = teamIndex

    if (this.cell) this.cell.addTeamIndicator(teamIndex)
  }

  get latence() {
    return 200 - Math.min(this.getStat(enums.CharacterSkill.SPEED), 100)
  }

  get position() {
    return this._sprite.position
  }

  get zAdjustment() {
    return this._zAdjustment
  }

  set zAdjustment(z: number) {
    this._zAdjustment = z
  }

  protected _onActivate() {
    this._cell = null
    this._teamIndex = 0
    this._zAdjustment = 0
    this._timeBeforeAction = this.latence

    this._sprite = new pixi.Sprite(this._baseProperties.texture)

    this._sprite.anchor.set(0.5, 0.75)
    this._sprite.visible = false

    this._container.addChild(this._sprite)
  }

  protected _onTick() {
    if (this._cell) {
      this._container.position.copyFrom(this._cell.position)
      this._container.zIndex = this._cell.hex.row + this._zAdjustment
      this._sprite.visible = true
    }
  }

  public getStat(name: enums.CharacterSkill) {
    return 1 + (this._baseProperties.distribution[name] ?? 0)
  }

  public timelineTick(
    animations: booyah.Queue,
    grid: Grid,
    characters: Character[],
  ): boolean {
    if (this.state !== "active") return false

    if (this._timeBeforeAction > 0)
      this._timeBeforeAction -= this._lastTickInfo.timeSinceLastTick
    else {
      this._timeBeforeAction = 0

      if (this._baseProperties.behavior) {
        const { timeCost, chip } = this._baseProperties.behavior()

        this.addActionTime(timeCost)

        animations.add(chip)
      } else {
        animations.add(new PlayerTurn(this), {
          grid,
          animations,
          characters,
        })
      }

      return true
    }

    return false
  }

  public highlight() {
    this._sprite.filters = [new GlowFilter({ outerStrength: 10 })]
  }

  public unHighlight() {
    this._sprite.filters = []
  }

  public addActionTime(time: number) {
    this._timeBeforeAction += time
  }

  /**
   * @param target
   * @param distance (temporary)
   */
  public moveAction(target: GridCell, distance: number) {
    let basePosition: pixi.Point
    let lastCell: GridCell

    // todo: use the walk sprite animation
    // todo: make possible to move with a path instead of a linear interpolation

    return new booyah.Sequence([
      new booyah.Lambda(() => {
        this._cell!.removeTeamIndicator(this._teamIndex)

        lastCell = this._cell!
        this._cell = null

        basePosition = this._container.position.clone()
        this.addActionTime(this.latence * distance)
      }),
      // todo: use utils.times for move cell by cell, then:
      //  this._character.addActionTime(this._character.latence) for each time
      //  use https://blog.theknightsofunity.com/pathfinding-on-a-hexagonal-grid-a-algorithm/ for path finding
      new booyah.Tween({
        from: 0,
        to: 1,
        duration: 200,
        onTick: (fraction) => {
          this._container.position.set(
            booyah.lerp(basePosition.x, target.position.x, fraction),
            booyah.lerp(basePosition.y, target.position.y, fraction),
          )
        },
      }),
      new booyah.Lambda(() => {
        this._cell = target

        this._cell.addTeamIndicator(this._teamIndex)

        this.emit("moved", lastCell, target)
      }),
    ])
  }
}

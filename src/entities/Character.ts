import * as pixi from "pixi.js"
import * as enums from "../enums"
import * as booyah from "@ghom/booyah"

import { GlowFilter } from "@pixi/filter-glow"

// @ts-ignore
import gaugeBackground from "../../assets/images/gauge-background-white.png"

// @ts-ignore
import gaugeBar from "../../assets/images/gauge-bar-red.png"

import ContainerChip from "../extensions/ContainerChip"
import CharacterAction from "./CharacterAction"
import PlayerTurn from "./PlayerTurn"
import GridCell from "./GridCell"
import Gauge from "./Gauge"
import Grid from "./Grid"

interface CharacterEvents extends booyah.BaseCompositeEvents {
  moved: [from: GridCell, to: GridCell]
  dead: []
}

export interface CharacterProperties {
  name: string
  texture: pixi.Texture
  class: enums.CharacterClass
  race: enums.CharacterRace
  level: number
  distribution: Partial<Record<enums.CharacterSkill, number>>
  behavior?: () => { timeCost: number; chip: booyah.ChipResolvable }
  actions?: CharacterAction[]
}

export default class Character extends ContainerChip<CharacterEvents> {
  private _cell!: GridCell | null
  private _teamIndex!: number
  private _sprite!: pixi.Sprite
  private _timeBeforeAction!: number
  private _zAdjustment!: number
  private _hpGauge!: Gauge
  private _remainingHp!: number

  constructor(private _baseProperties: CharacterProperties) {
    super()
  }

  get timeBeforeAction() {
    return this._timeBeforeAction
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
    return 100 / (this.getStat(enums.CharacterSkill.SPEED) * 0.7)
  }

  get maxHp() {
    return this.getStat(enums.CharacterSkill.HEALTH) * 10
  }

  get hp() {
    return this._remainingHp
  }

  set hp(hp: number) {
    this._remainingHp = hp

    this._hpGauge.value = this._remainingHp / this.maxHp

    if (this._remainingHp <= 0) {
      this.emit("dead")
    }
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

  get actions() {
    return this._baseProperties.actions ?? []
  }

  protected _onActivate() {
    this._cell = null
    this._teamIndex = 0
    this._zAdjustment = 0
    this._remainingHp = this.maxHp
    this._timeBeforeAction = this.latence

    this._sprite = new pixi.Sprite(this._baseProperties.texture)

    this._sprite.anchor.set(0.5, 0.75)
    this._sprite.visible = false

    this._container.addChild(this._sprite)

    this._activateChildChip(
      (this._hpGauge = new Gauge({
        bar: pixi.Texture.from(gaugeBar),
        background: pixi.Texture.from(gaugeBackground),
        width: 75,
        height: 8,
        initialValue: 1,
        text: () => `${this._remainingHp} / ${this.maxHp}`,
        position: {
          x: 0,
          y: -75,
        },
      })),
    )
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

  public fightTick(
    animations: booyah.Queue,
    grid: Grid,
    characters: Character[],
  ): boolean {
    if (this.state !== "active") return false

    if (this._timeBeforeAction > 0) {
      this._timeBeforeAction--
    } else {
      this._timeBeforeAction = 0

      if (this._baseProperties.behavior) {
        // Use automatic behavior for NPC

        const { timeCost, chip } = this._baseProperties.behavior()

        this.addActionTime(timeCost)

        animations.add(chip)
      } else {
        // Or wait for player action

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

  public doPhysicalDamagesTo(this: this, target: Character) {
    const damages = Math.max(
      0,
      this.getStat(enums.CharacterSkill.PHYSICAL_DAMAGE) * 2 -
        target.getStat(enums.CharacterSkill.PHYSICAL_RESISTANCE) / 2,
    )

    target.hp -= damages
  }

  public doMagicalDamagesTo(target: Character) {
    const damages = Math.max(
      0,
      this.getStat(enums.CharacterSkill.MAGICAL_DAMAGE) * 2 -
        target.getStat(enums.CharacterSkill.MAGICAL_RESISTANCE) / 2,
    )

    target.hp -= damages
  }
}

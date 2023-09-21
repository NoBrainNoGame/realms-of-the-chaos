import * as pixi from "pixi.js"
import * as enums from "../enums"
import * as booyah from "@ghom/booyah"

import { GlowFilter } from "@pixi/filter-glow"

// @ts-ignore
import gaugeBackground from "../../assets/images/gauge-background-white.png"

// @ts-ignore
import gaugeBar from "../../assets/images/gauge-bar-red.png"

import CharacterAction, { CharacterActionOptions } from "./CharacterAction"
import ContainerChip from "../extensions/ContainerChip"
import PlayerTurn from "./PlayerTurn"
import GridCell from "./GridCell"
import Gauge from "./Gauge"
import Fight from "./Fight"
import Grid from "./Grid"

import globalActions from "../data/globalActions"
import classRules from "../data/classRules"

interface CharacterEvents extends booyah.BaseCompositeEvents {
  moved: [from: GridCell, to: GridCell]
  dead: []
}

export interface CharacterBehaviorContext {
  fight: Fight
  character: Character
}

export type CharacterBehavior = (ctx: CharacterBehaviorContext) => {
  timeCost: number
  chip: booyah.ChipResolvable
}

export interface CharacterProperties {
  name: string
  texture: pixi.Texture
  class: enums.CharacterClass
  race: enums.CharacterRace
  level: number
  distribution: Partial<Record<enums.CharacterSkill, number>>
  moveBehavior?: CharacterBehavior
  actionBehavior?: CharacterBehavior
  actions?: CharacterActionOptions[]
}

export default class Character extends ContainerChip<CharacterEvents> {
  private _cell!: GridCell | null
  private _teamIndex!: number | null
  private _sprite!: pixi.Sprite
  private _timeBeforeAction!: number
  private _timeBeforeMove!: number
  private _zAdjustment!: number
  private _hpGauge!: Gauge
  private _remainingHp!: number
  private _actions!: CharacterAction[]

  constructor(
    private _baseProperties: CharacterProperties,
    private _fight: Fight,
  ) {
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
    if (this._cell && this._teamIndex !== null) {
      this._cell.removeTeamIndicator(this._teamIndex)
    }

    this._cell = null

    if (cell && this._teamIndex !== null) {
      this._cell = cell

      cell?.addTeamIndicator(this._teamIndex)
    }
  }

  get teamIndex() {
    return this._teamIndex
  }

  set teamIndex(teamIndex: number | null) {
    this._teamIndex = teamIndex

    if (this._cell && teamIndex !== null) this._cell.addTeamIndicator(teamIndex)
  }

  get latence() {
    return 100 / (this.getStat(enums.CharacterSkill.SPEED) * 0.7)
  }

  get level() {
    return this._baseProperties.level
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
    return this._container.position
  }

  get internalPosition() {
    return this._sprite.position
  }

  get zAdjustment() {
    return this._zAdjustment
  }

  set zAdjustment(z: number) {
    this._zAdjustment = z
  }

  get actions() {
    return this._actions
  }

  protected _onActivate() {
    this._cell = null
    this._teamIndex = 0
    this._zAdjustment = 0
    this._remainingHp = this.maxHp
    this._timeBeforeAction = this.latence
    this._timeBeforeMove = this.latence / 2

    this._actions = [
      ...(this._baseProperties.actions ?? []),
      ...Object.values(globalActions),
      ...Object.values(classRules[this._baseProperties.class].actions),
    ].map((options) => new CharacterAction(options, this, this._fight))

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

  public fightTick(fight: Fight): boolean {
    if (this.state !== "active") return false

    if (this._timeBeforeMove > 0) {
      this._timeBeforeMove--
    } else {
      this._timeBeforeMove = 0

      if (this._baseProperties.moveBehavior) {
        const { timeCost, chip } = this._baseProperties.moveBehavior({
          fight,
          character: this,
        })

        this.addActionTime(timeCost)

        fight.animations.add(chip)
      } else {
        fight.animations.add(new PlayerTurn(this, fight, "move"))
      }

      return true
    }

    if (this._timeBeforeAction > 0) {
      this._timeBeforeAction--
    } else {
      this._timeBeforeAction = 0

      if (this._baseProperties.actionBehavior) {
        // Use automatic behavior for NPC

        const { timeCost, chip } = this._baseProperties.actionBehavior({
          fight,
          character: this,
        })

        this.addActionTime(timeCost)

        fight.animations.add(chip)
      } else {
        // Or wait for player action

        fight.animations.add(new PlayerTurn(this, fight, "action"))
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
        if (this._cell && this._teamIndex !== null)
          this._cell.removeTeamIndicator(this._teamIndex)

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

        if (this._teamIndex !== null)
          this._cell.addTeamIndicator(this._teamIndex)

        this.emit("moved", lastCell, target)
      }),
    ])
  }

  public doPhysicalDamagesTo(
    this: this,
    target: Character,
    multiplier = 1,
    armorPiercing = false,
  ) {
    const damages = Math.max(
      0,
      this.getStat(enums.CharacterSkill.PHYSICAL_DAMAGE) * 2 * multiplier -
        (armorPiercing
          ? 0
          : target.getStat(enums.CharacterSkill.PHYSICAL_RESISTANCE) / 2),
    )

    target.hp -= damages
  }

  public doMagicalDamagesTo(
    this: this,
    target: Character,
    multiplier = 1,
    armorPiercing = false,
  ) {
    const damages = Math.max(
      0,
      this.getStat(enums.CharacterSkill.MAGICAL_DAMAGE) * 2 * multiplier -
        (armorPiercing
          ? 0
          : target.getStat(enums.CharacterSkill.MAGICAL_RESISTANCE) / 2),
    )

    target.hp -= damages
  }

  /**
   * @todo add probability system for distribution about class and race stats
   */
  static generateRandomDistribution(level: number) {
    const distribution: Partial<Record<enums.CharacterSkill, number>> = {}

    for (let i = 0; i < level; i++) {
      const skill = Object.values(enums.CharacterSkill)[
        Math.floor(Math.random() * Object.values(enums.CharacterSkill).length)
      ]
      distribution[skill] = (distribution[skill] ?? 0) + 1
    }

    return distribution
  }
}

import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

import pointer from "../core/pointer"

import * as rangeZones from "../data/rangeZones"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Fight from "./Fight"
import Characters from "../data/characters"

type CharacterActionTargetType =
  | "self"
  | "ally"
  | "enemy"
  | "character"
  | "everywhere"

export interface CharacterActionBehaviorContext {
  launcher: Character
  targetCell: GridCell
}

export type CharacterActionBehavior = (
  context: CharacterActionBehaviorContext & {
    targetCells: GridCell[]
    fight: Fight
  },
) => booyah.ChipResolvable

export interface CharacterActionOptions {
  name: string
  icon: pixi.Texture
  timeCost: (context: CharacterActionBehaviorContext) => number
  canBeUsed: (context: CharacterActionBehaviorContext) => boolean
  behavior: CharacterActionBehavior
  launcher: Character
  launchZone?: rangeZones.RangeZone
  launchZoneRange?: number
  targetZone: rangeZones.RangeZone
  targetZoneRange?: number
  targetType: CharacterActionTargetType
}

export default class CharacterAction extends ContainerChip {
  private _sprite!: pixi.Sprite
  private _floatingSprite!: pixi.Sprite

  get name() {
    return this._options.name
  }

  get zone() {
    return this._options.targetZone
  }

  get scope() {
    return this._options.targetType
  }

  get timeCost() {
    return this._options.timeCost
  }

  constructor(
    private _options: CharacterActionOptions,
    private _fight: Fight,
  ) {
    super()
  }

  protected _onActivate() {
    // init sprite

    this._sprite = new pixi.Sprite(this._options.icon)

    this._sprite.anchor.set(0.5, 1)
    this._sprite.eventMode = "dynamic"

    this._container.addChild(this._sprite)

    // init floating sprite

    this._floatingSprite = new pixi.Sprite(this._options.icon)

    this._floatingSprite.anchor.set(0.5)
    this._floatingSprite.position.set(0, -25)
    this._floatingSprite.scale.set(0.5)
    this._floatingSprite.visible = false

    this._container.addChild(this._floatingSprite)

    // init "doing" listener

    this._subscribe(this._sprite, "pointerdown", () => {
      // animate the action drag and drop
      this._floatingSprite.visible = true

      this._highlightCells()
      this._highlightLaunchCells()

      this._subscribeOnce(this._sprite, "pointerup", () => {
        this._floatingSprite.visible = false

        this._unHighlightCells()

        const targetCell = this._fight.grid.getHoveredCell()

        if (targetCell) this._tryToUse(targetCell)
      })

      this._subscribeOnce(this._sprite, "pointerupoutside", () => {
        if (this._state !== "active") return

        this._unHighlightCells()

        const cell = this._fight.grid.getHoveredCell()

        if (cell) {
          this._tryToUse(cell)
        }

        // finish the drag and drop animation
        this._floatingSprite.visible = false
      })
    })
  }

  protected _onResize(width: number, height: number) {
    const { actions } = this._options.launcher

    this._sprite.position.set(
      width / 2 - actions.length * 50 + actions.indexOf(this) * 100,
      height - 25,
    )
  }

  protected _onTick() {
    this._floatingSprite.position.copyFrom(pointer)
  }

  protected _onTerminate() {
    this._unHighlightCells()
  }

  private _tryToUse(targetCell: GridCell) {
    if (this._canBeUsed(targetCell)) {
      this._options.launcher.addActionTime(
        this._options.timeCost({
          targetCell,
          launcher: this._options.launcher,
        }),
      )

      this._fight.animations.add(
        this._options.behavior({
          targetCell,
          targetCells: this._getTargetCells(targetCell),
          launcher: this._options.launcher,
          fight: this._fight,
        }),
      )

      // todo: juiciness for doing anything (sound, animation, etc.)
      this.terminate()
    }
  }

  private _canBeUsed(targetCell: GridCell) {
    return (
      this._options.canBeUsed({
        targetCell,
        launcher: this._options.launcher,
      }) && this._isReachable(targetCell)
    )
  }

  private _isReachable(targetCell: GridCell) {
    if (this._options.targetType === "self")
      return this._options.launcher.cell === targetCell

    if (this._options.targetType === "everywhere") return true

    if (this._options.targetType === "ally")
      return this._fight.characters.some(
        (c) =>
          c.cell === targetCell &&
          c.teamIndex === this._options.launcher.teamIndex,
      )

    if (this._options.targetType === "enemy")
      return this._fight.characters.some(
        (c) =>
          c.cell === targetCell &&
          c.teamIndex !== this._options.launcher.teamIndex,
      )

    if (this._options.targetType === "character")
      return this._fight.characters.some((c) => c.cell === targetCell)

    return false
  }

  private _getLaunchCells() {
    return this._options.launchZone
      ? this._options
          .launchZone(
            this._options.launcher.cell!.cellPosition,
            this._options.launchZoneRange ?? 0,
          )
          .map((cellPosition) => this._fight.grid.getCell(cellPosition))
          .filter((cell): cell is GridCell => cell !== undefined)
      : this._fight.grid.getCells()
  }

  private _getTargetCells(targetCell: GridCell) {
    return this._options
      .targetZone(targetCell.cellPosition, this._options.targetZoneRange ?? 0)
      .map((cellPosition) => this._fight.grid.getCell(cellPosition))
      .filter((cell): cell is GridCell => cell !== undefined)
  }

  private _highlightCells() {
    this._fight.grid.getCells().forEach((cell) => {
      if (this._canBeUsed(cell)) {
        cell.highlight()
      }
    })
  }

  private _highlightLaunchCells() {
    this._getLaunchCells().forEach((cell) => {
      cell.highlight()
    })
  }

  private _unHighlightCells() {
    this._fight.grid.getCells().forEach((cell) => {
      cell.unHighlight()
    })
  }
}

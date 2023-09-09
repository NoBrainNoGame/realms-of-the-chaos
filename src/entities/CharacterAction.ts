import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

import pointer from "../core/pointer"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Fight from "./Fight"
import Characters from "../data/characters"

type CharacterActionScope =
  | "self"
  | "ally"
  | "enemy"
  | "character"
  | "everywhere"

export interface CharacterActionBehaviorContext {
  author: Character
  target: GridCell
}

export type CharacterActionBehavior = (
  context: CharacterActionBehaviorContext & {
    targets: Character[]
    container: pixi.Container
  },
) => booyah.ChipResolvable

export interface CharacterActionOptions {
  name: string
  icon: pixi.Texture
  timeCost: (context: CharacterActionBehaviorContext) => number
  canBeUsed: (context: CharacterActionBehaviorContext) => boolean
  behavior: CharacterActionBehavior
  range: number
  scope: CharacterActionScope
}

export default class CharacterAction extends ContainerChip {
  private _sprite!: pixi.Sprite
  private _floatingSprite!: pixi.Sprite

  get name() {
    return this._options.name
  }

  get range() {
    return this._options.range
  }

  get scope() {
    return this._options.scope
  }

  get timeCost() {
    return this._options.timeCost
  }

  constructor(
    private _options: CharacterActionOptions,
    private _character: Character,
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

      this._subscribeOnce(this._sprite, "pointerup", () => {
        this._floatingSprite.visible = false
        this._fight.grid.getCells().forEach((cell) => cell.unHighlight())

        if (this._options.scope === "self") {
          this._use({
            author: this._character,
            target: this._character.cell!,
          })
        }
      })

      this._subscribeOnce(this._sprite, "pointerupoutside", () => {
        if (this._state !== "active") return

        this._unHighlightCells()

        const cell = this._fight.grid.getHoveredCell()

        if (cell) {
          const context = {
            author: this._character,
            target: cell,
          }

          this._use(context)
        }

        // finish the drag and drop animation
        this._floatingSprite.visible = false
      })
    })
  }

  protected _onResize(width: number, height: number) {
    const { actions } = this._character

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

  private _use(context: CharacterActionBehaviorContext) {
    if (this._canBeUsed(context)) {
      this._character.addActionTime(this._options.timeCost(context))

      this._fight.animations.add(
        this._options.behavior({
          ...context,
          container: this._fight.animationContainer,
          targets: this._fight.characters.filter((c) => {
            if (c.cell !== context.target) return false

            if (this._options.scope === "ally")
              return c.teamIndex === context.author.teamIndex
            if (this._options.scope === "enemy")
              return c.teamIndex !== context.author.teamIndex

            return true
          }),
        }),
      )

      // todo: juiciness for doing anything (sound, animation, etc.)
      this.terminate()
    }
  }

  private _canBeUsed(context: CharacterActionBehaviorContext) {
    return this._options.canBeUsed(context) && this._isInRange(context)
  }

  private _isInRange(context: CharacterActionBehaviorContext) {
    const { author, target } = context

    if (this._options.scope === "self") return context.author.cell === target

    const distance = this._fight.grid.getDistanceBetween(
      author.cell!.hex,
      target.hex,
    )

    if (distance > this._options.range) return false

    if (this._options.scope === "everywhere") return true

    if (this._options.scope === "ally")
      return this._fight.characters.some(
        (c) => c.cell === target && c.teamIndex === author.teamIndex,
      )

    if (this._options.scope === "enemy")
      return this._fight.characters.some(
        (c) => c.cell === target && c.teamIndex !== author.teamIndex,
      )

    if (this._options.scope === "character")
      return this._fight.characters.some((c) => c.cell === target)

    return false
  }

  private _highlightCells() {
    const cells = [
      this._character.cell!,
      ...this._fight.grid.getNeighborsByRange(
        this._character.cell!.hex,
        this._options.range,
      ),
    ]

    cells.forEach((cell) => {
      if (
        this._canBeUsed({
          author: this._character,
          target: cell,
        })
      ) {
        cell.highlight()
      }
    })
  }

  private _unHighlightCells() {
    this._fight.grid.getCells().forEach((cell) => {
      cell.unHighlight()
    })
  }
}

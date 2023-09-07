import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

import pointer from "../core/pointer"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Grid from "./Grid"

export interface CharacterActionBehaviorContext {
  author: Character
  target?: Character[] | GridCell
}

interface CharacterActionOptions {
  name: string
  icon: pixi.Texture
  timeCost: (context: CharacterActionBehaviorContext) => number
  canBeUsed: (context: CharacterActionBehaviorContext) => boolean
  behavior: (context: CharacterActionBehaviorContext) => booyah.ChipResolvable
}

export default class CharacterAction extends ContainerChip {
  private _sprite!: pixi.Sprite
  private _floatingSprite!: pixi.Sprite

  get chipContext(): {
    character: Character
    characters: Character[]
    container: pixi.Container
    animations: booyah.Queue
    grid: Grid
  } {
    // @ts-ignore
    return super.chipContext
  }

  constructor(private _options: CharacterActionOptions) {
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

      this._subscribeOnce(this._sprite, "pointerup", () => {
        this._floatingSprite.visible = false
      })

      this._subscribeOnce(this._sprite, "pointerupoutside", () => {
        if (this._state !== "active") return

        const cell = this.chipContext.grid.getHoveredCell()

        if (cell) {
          const targets = this.chipContext.characters.filter(
            (character) => character.cell === cell,
          )

          const context = {
            author: this.chipContext.character,
            target: targets || cell,
          }

          if (this._options.canBeUsed(context)) {
            this.chipContext.character.addActionTime(
              this._options.timeCost(context),
            )

            this.chipContext.animations.add(this._options.behavior(context))

            // todo: juiciness for doing anything (sound, animation, etc.)
            this.terminate()
          }
        }

        // finish the drag and drop animation
        this._floatingSprite.visible = false
      })
    })
  }

  protected _onResize(width: number, height: number) {
    const { actions } = this.chipContext.character

    this._sprite.position.set(
      width / 2 - actions.length * 50 + actions.indexOf(this) * 100,
      height - 25,
    )
  }

  protected _onTick() {
    this._floatingSprite.position.copyFrom(pointer)
  }
}

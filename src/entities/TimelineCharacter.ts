import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as params from "../params"

// @ts-ignore
import whiteCircle from "../../assets/images/circle-white-mask.png"

// @ts-ignore
import redCircle from "../../assets/images/circle-red.png"

// @ts-ignore
import blueCircle from "../../assets/images/circle-blue.png"

// @ts-ignore
import greenCircle from "../../assets/images/circle-green.png"

// @ts-ignore
import purpleCircle from "../../assets/images/circle-purple.png"

const circleColors: [string, string, string, string] = [
  blueCircle,
  redCircle,
  greenCircle,
  purpleCircle,
]

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"

export default class TimelineCharacter extends ContainerChip {
  private _debugText?: pixi.Text
  private _currentMove?: booyah.Tween

  public targetX!: number

  constructor(private _character: Character) {
    super()
  }

  get character() {
    return this._character
  }

  protected _onActivate() {
    this._container.position.y = 25

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Functional({
          shouldTerminate: () => this._character.teamIndex !== undefined,
        }),
        new booyah.Lambda(() => {
          const mask = new pixi.Sprite(pixi.Texture.from(whiteCircle))
          const sprite = new pixi.Sprite(this._character.texture)
          const circle = new pixi.Sprite(
            pixi.Texture.from(circleColors[this._character.teamIndex]),
          )

          mask.anchor.set(0.5)
          sprite.anchor.set(0.5, 0.25)
          // sprite.scale.set(1.5)
          circle.anchor.set(0.5)

          sprite.mask = mask

          this._container.addChild(circle, mask, sprite)

          // debug
          if (params.debug) {
            this._debugText = new pixi.Text("", {
              fontSize: 12,
              fill: 0xffffff,
              align: "center",
            })

            this._debugText.anchor.set(0.5)
            this._debugText.position.set(0, 50)

            this._container.addChild(this._debugText)
          }
        }),
      ]),
    )
  }

  protected _onTick() {
    if (!this._currentMove && this._container.position.x !== this.targetX) {
      this._activateChildChip(
        (this._currentMove = new booyah.Tween({
          from: this._container.position.x,
          to: this.targetX,
          duration: 250,
          easing: booyah.easeInOutCubic,
          onTick: (x) => {
            this._container.position.x = x
          },
          onTerminate: () => {
            delete this._currentMove
          },
        })),
      )
    }

    if (this._debugText) {
      this._debugText.text = Math.floor(this._character.timeBeforeAction)
    }
  }
}

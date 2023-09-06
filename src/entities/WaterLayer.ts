import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as colors from "color-engine"
import * as utils from "../utils"
import * as constants from "../constants"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"

export default class WaterLayer extends ContainerChip {
  private _sprite!: pixi.Sprite
  private _tint!: number

  constructor(
    private _z: number,
    private _texture: pixi.Texture,
    private _cell: GridCell,
    private _is: "full" | "filling" | "emptying",
  ) {
    super()
  }

  get tint() {
    return this._tint
  }

  protected _onActivate() {
    this._sprite = new pixi.Sprite(this._texture)

    this._sprite.anchor.set(0.5, 0.75)

    this._tint = new colors.Color([
      150 + Math.abs(booyah.lerp(0, 105, this._z / this._cell.z)),
      150 + Math.abs(booyah.lerp(0, 105, this._z / this._cell.z)),
      255,
    ]).toNumber()

    this._sprite.tint = this._tint

    this._container.zIndex = this._cell.hex.row
    this._container.addChild(this._sprite)
    this._container.position.copyFrom(this._cell.position)

    if (this._is === "full") {
      this._container.alpha = 1
    } else if (this._is === "filling") {
      this._container.alpha = 0
    } else if (this._is === "emptying") {
      this._container.alpha = 1
    }

    const shift = 1000
    const duration = 400
    const surfaceY =
      -Math.abs(this._z) * constants.cellYSpacing + constants.cellYSpacing * 1.5

    if (this._is !== "full")
      this._preparation = new booyah.Sequence([
        // todo: fix the sens of animation (start from the bottom layer)
        new booyah.Wait((this._z + Math.abs(this._z)) * shift),
        new booyah.Parallel([
          // animate alpha
          () =>
            this._is === "filling"
              ? new booyah.Tween({
                  from: 0,
                  to: 1,
                  duration,
                  easing: booyah.easeInOutCubic,
                  onTick: (alpha) => {
                    this._container.alpha = alpha
                  },
                })
              : new booyah.Tween({
                  from: 1,
                  to: 0,
                  duration,
                  easing: booyah.easeInOutCubic,
                  onTick: (alpha) => {
                    this._container.alpha = alpha
                  },
                }),
          // animate position
          () =>
            this._is === "filling"
              ? new booyah.Tween({
                  from: 0,
                  to: surfaceY,
                  duration,
                  easing: booyah.easeInOutCubic,
                  onTick: (y) => {
                    this._sprite.position.y = y
                  },
                })
              : new booyah.Tween({
                  from: surfaceY,
                  to: 0,
                  duration,
                  easing: booyah.easeInOutCubic,
                  onTick: (y) => {
                    this._sprite.position.y = y
                  },
                }),
          new booyah.Lambda(() => {
            this._cell.tint = this._tint
          }),
        ]),
      ])
  }
}

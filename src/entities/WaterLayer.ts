import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as colors from "color-engine"
import * as utils from "../utils"
import * as constants from "../constants"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"

export default class WaterLayer extends ContainerChip {
  constructor(
    private _z: number,
    private _texture: pixi.Texture,
    private _cell: GridCell,
    private _is: "full" | "filling" | "emptying",
  ) {
    super()
  }

  protected _onActivate() {
    const sprite = new pixi.Sprite(this._texture)

    sprite.anchor.set(0.5, 0.75)
    sprite.position.y =
      -Math.abs(this._z) * constants.cellYSpacing + constants.cellYSpacing * 1.5
    sprite.tint = new colors.Color([
      150 + Math.abs(booyah.lerp(0, 105, this._z / this._cell.z)),
      150 + Math.abs(booyah.lerp(0, 105, this._z / this._cell.z)),
      255,
    ]).hex

    this._container.zIndex = this._cell.hex.row
    this._container.addChild(sprite)
    this._container.position.copyFrom(this._cell.position)

    if (
      this._cell.hex.equals({
        col: 4,
        row: 13,
      })
    )
      console.log(this)

    // if (this._is === "full") {
    //   this._container.alpha = 1
    // } else if (this._is === "filling") {
    //   this._container.alpha = 0
    // } else if (this._is === "emptying") {
    //   this._container.alpha = 1
    // }
  }
}

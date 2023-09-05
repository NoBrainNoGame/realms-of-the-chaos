import * as pixi from "pixi.js"

// @ts-ignore
import noise from "../../assets/images/displacement_map_repeat.jpg"

// @ts-ignore
import waterLayer from "../../assets/images/water-layer.png"

import { DisplacementFilter } from "@pixi/filter-displacement"

import ContainerChip from "../extensions/ContainerChip"
import WaterCell from "./WaterCell"
import Grid from "./Grid"

export default class Water extends ContainerChip {
  private _waterNoiseSprite?: pixi.Sprite
  private _cells!: WaterCell[]

  constructor(private _grid: Grid) {
    super()
  }

  protected _onActivate() {
    this._container.sortableChildren = true

    this._cells = []

    for (const cell of this._grid.getCells()) {
      if (cell.isUnderWater) {
        const waterCell = new WaterCell(cell, pixi.Texture.from(waterLayer))

        this._cells.push(waterCell)

        this._activateChildChip(waterCell)
      }
    }

    // if (this._cells.length > 0) {
    //   this._waterNoiseSprite = new pixi.Sprite(pixi.Texture.from(noise))
    //   this._waterNoiseSprite.texture.baseTexture.wrapMode =
    //     pixi.WRAP_MODES.REPEAT
    //
    //   const filter = new DisplacementFilter(this._waterNoiseSprite)
    //
    //   filter.scale.x = 50
    //   filter.scale.y = 20
    //   filter.padding = 10
    //
    //   this._container.filters = [filter]
    //   this._container.addChild(this._waterNoiseSprite)
    // }
  }

  protected _onTick() {
    if (this._waterNoiseSprite) {
      this._waterNoiseSprite.x += 0.5
      this._waterNoiseSprite.y += 2
    }
  }
}

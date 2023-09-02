import * as pixi from "pixi.js"
import * as utils from "../utils"
import * as hex from "honeycomb-grid"

import ContainerChip from "../parents/ContainerChip"

export default class GridCell extends ContainerChip {
  constructor(private _hex: hex.Hex) {
    super()
  }

  protected _onActivate() {
    const graphics = new pixi.Graphics()
      .beginFill(0x333333)
      .drawPolygon(utils.hexToPolygon(this._hex))
      .endFill()

    graphics.eventMode = "dynamic"

    this._subscribe(graphics, "pointerover", () => {
      graphics.alpha = 0.5
    })

    this._subscribe(graphics, "pointerout", () => {
      graphics.alpha = 1
    })

    this._container.addChild(graphics)
  }
}

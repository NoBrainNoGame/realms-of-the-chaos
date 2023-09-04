import * as pixi from "pixi.js"
import * as hex from "honeycomb-grid"
import * as booyah from "@ghom/booyah"

import ContainerChip from "../extensions/ContainerChip"
import * as constants from "../constants"

export default abstract class GridElement<
  CompositeEvents extends
    booyah.BaseCompositeEvents = booyah.BaseCompositeEvents,
> extends ContainerChip<CompositeEvents> {
  get hex() {
    return this._hex
  }

  get isUnderWater() {
    return this._z < 0
  }

  get position() {
    return {
      x: this._hex.x,
      y: this._hex.y + -this._z * constants.cellYSpacing,
    }
  }

  protected constructor(
    protected readonly _hex: hex.Hex,
    protected _z: number,
  ) {
    super()
  }
}

import * as colors from "color-engine"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as utils from "../utils"
import * as pixi from "pixi.js"
import * as constants from "../constants"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"
import WaterLayer from "./WaterLayer"

interface WaterCellEvents extends booyah.BaseCompositeEvents {
  full: []
}

export default class WaterCell extends ContainerChip<WaterCellEvents> {
  private _waterState!: booyah.StateMachine
  private _lastWaterLayer?: WaterLayer

  constructor(
    private readonly _cell: GridCell,
    private readonly _texture: pixi.Texture,
  ) {
    super()
  }

  protected _onActivate() {
    this._container.alpha = 0.7
    this._container.zIndex = this._cell.hex.row

    this._activateChildChip(
      (this._waterState = new booyah.StateMachine(
        {
          empty: new booyah.Forever(),
          full: () =>
            new booyah.Parallel(
              utils.times(Math.abs(this._cell.z), (i) => {
                const z = this._cell.z + i
                return new WaterLayer(z, this._texture, this._cell, "full")
              }),
            ),
          filling: () =>
            new booyah.Parallel(
              utils.times(Math.abs(this._cell.z), (i) => {
                const z = this._cell.z + i
                return new WaterLayer(z, this._texture, this._cell, "filling")
              }),
            ),
          emptying: () =>
            new booyah.Parallel(
              utils.times(Math.abs(this._cell.z), (i) => {
                const z = this._cell.z + i
                return new WaterLayer(z, this._texture, this._cell, "emptying")
              }),
            ),
        },
        {
          startingState: "empty",
          endingStates: [],
          signals: {
            filling: "full",
            emptying: "empty",
          },
        },
      )),
    )

    if (this._cell.isUnderWater)
      this._preparation = new booyah.Sequence([
        new booyah.Functional({
          shouldTerminate: () => this._cell.isReady,
        }),
        new booyah.Lambda(() => {
          this._waterState.changeState("filling")
        }),
        // todo: just animate the color change of depth
      ])
  }
}

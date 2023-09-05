import * as colors from "color-engine"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as utils from "../utils"
import * as pixi from "pixi.js"
import * as constants from "../constants"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"
import WaterLayer from "./WaterLayer"

export default class WaterCell extends ContainerChip {
  private _level!: number
  private _zState!: booyah.StateMachine

  constructor(
    private readonly _cell: GridCell,
    private readonly _texture: pixi.Texture,
  ) {
    super()
  }

  protected _onActivate() {
    this._level = this._cell.z
    this._container.alpha = 0.7
    this._container.zIndex = this._cell.hex.row

    this._activateChildChip(
      (this._zState = new booyah.StateMachine(
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
          this._zState.changeState("filling")
        }),
      ])
  }

  // private _changeWaterLevel(level: number): booyah.ChipBase {
  //
  // return new booyah.Sequence([
  //   ...this._layers.slice(this._level, Math.abs(level)).map((layer, i) => {
  //     const duration = 200
  //
  //     const color = new colors.Color("#ffffff")
  //
  //     layer.visible = true
  //
  //     return new booyah.Parallel([
  //       new booyah.Tween({
  //         from: 255,
  //         to: 255 - i * 20,
  //         duration,
  //         easing: booyah.easeOutQuart,
  //         onTick: (redGreen) => {
  //           color.red = redGreen
  //           color.green = redGreen
  //
  //           layer.tint = color.hex
  //         },
  //       }),
  //       new booyah.Tween({
  //         from: 0,
  //         to: i * constants.cellYSpacing + constants.cellYSpacing / 2,
  //         duration,
  //         easing: booyah.easeOutQuart,
  //         onTick: (y) => {
  //           layer.position.y = this._cell.globalPosition.y + y
  //         },
  //       }),
  //       new booyah.Tween({
  //         from: 0,
  //         to: 0.7,
  //         duration,
  //         easing: booyah.easeOutQuart,
  //         onTick: (alpha) => {
  //           layer.alpha = alpha
  //         },
  //       }),
  //     ])
  //   }),
  //   new booyah.Lambda(() => {
  //     this._level = level
  //   }),
  // ])
  // }
}

import * as colors from "color-engine"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as utils from "../utils"
import * as pixi from "pixi.js"
import * as constants from "../constants"

import GridElement from "./GridElement"

export default class GridWater extends GridElement {
  constructor(
    hex: hex.Hex,
    private readonly _texture: pixi.Texture,
    z: number,
    /**
     * The delay in milliseconds before the cell appears.
     * @private
     */
    private readonly _arrivalDelayAnimation: false | number = false,
  ) {
    super(hex, z)
  }

  protected _onActivate() {
    if (this._z >= 0) this.terminate()
    else {
      let color: colors.Color

      const sequence: booyah.ChipResolvable[] = [
        new booyah.Lambda(() => {
          this._container.zIndex = this._hex.row

          color = new colors.Color("#ffffff")
        }),
      ]

      if (this._arrivalDelayAnimation !== false) {
        sequence.push(
          ...utils.times(Math.abs(this._z), (i) => {
            const duration = 200

            const z = this._z + i

            const waterLayerSprite = new pixi.Sprite(this._texture)

            waterLayerSprite.alpha = 0
            waterLayerSprite.anchor.set(0.5)
            waterLayerSprite.position.copyFrom(this.position)

            this._container.addChild(waterLayerSprite)

            return () =>
              new booyah.Sequence([
                new booyah.Parallel([
                  new booyah.Tween({
                    from: 255,
                    to: 255 - i * 20,
                    duration,
                    easing: booyah.easeOutQuart,
                    onTick: (redGreen) => {
                      color.red = redGreen
                      color.green = redGreen

                      waterLayerSprite.tint = color.hex
                    },
                  }),
                  new booyah.Tween({
                    from: 0,
                    to: z * constants.cellYSpacing + constants.cellYSpacing / 2,
                    duration,
                    easing: booyah.easeOutQuart,
                    onTick: (y) => {
                      waterLayerSprite.position.y = this.position.y + y
                    },
                  }),
                  new booyah.Tween({
                    from: 0,
                    to: 0.7,
                    duration,
                    easing: booyah.easeOutQuart,
                    onTick: (alpha) => {
                      waterLayerSprite.alpha = alpha
                    },
                  }),
                ]),
              ])
          }),
        )
      } else {
        sequence.push(
          new booyah.Lambda(() => {
            for (let i = this._z; i < 0; i++) {
              const waterLayerSprite = new pixi.Sprite(this._texture)

              waterLayerSprite.alpha = 0.7
              waterLayerSprite.anchor.set(0.5)
              waterLayerSprite.position.copyFrom(this.position)
              waterLayerSprite.tint = color.hex
              waterLayerSprite.y +=
                i * constants.cellYSpacing + constants.cellYSpacing / 2

              this._container.addChild(waterLayerSprite)

              color.red -= 25
              color.green -= 25
            }
          }),
        )
      }

      this._preparation = new booyah.Sequence(sequence)
    }
  }
}

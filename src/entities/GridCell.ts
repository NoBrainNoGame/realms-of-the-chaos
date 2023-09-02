import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as params from "../params"
import * as constants from "../constants"
import * as colors from "color-engine"

import ContainerChip from "../parents/ContainerChip"

// @ts-ignore
import waterLayer from "../../assets/images/water-layer.png"

interface GridCellEvents extends booyah.BaseCompositeEvents {
  leftClick: []
  rightClick: []
  dragStart: []
  dragEnd: []
}

export default class GridCell extends ContainerChip<GridCellEvents> {
  private _sprite!: pixi.Sprite

  constructor(
    private _hex: hex.Hex,
    private _texture: pixi.Texture,
    private _z: number,
    private _waterContainer: pixi.Container,
  ) {
    super()
  }

  get position() {
    return {
      x: this._hex.x,
      y: this._hex.y + -this._z * constants.cellYSpacing,
    }
  }

  protected _onActivate() {
    this._container.zIndex = this._hex.row

    // cell

    this._sprite = new pixi.Sprite(this._texture)

    this._sprite.anchor.set(0.5, 0.25)
    this._sprite.position.copyFrom(this.position)
    this._sprite.eventMode = "dynamic"

    this._sprite.hitArea = new pixi.Polygon(
      this._hex.corners.map((corner) => {
        return {
          x: corner.x - this._hex.x,
          y: corner.y - this._hex.y,
        }
      }),
    )

    this._subscribe(this._sprite, "pointerover", () => {
      this._sprite.position.y = this.position.y - constants.cellYSpacing / 2
    })

    this._subscribe(this._sprite, "pointerout", () => {
      this._sprite.position.y = this.position.y
    })

    this._container.addChild(this._sprite)

    // water layer

    if (this._z < 0) {
      const waterContainer = new pixi.Container()

      const color = new colors.Color("#ffffff")

      for (let i = this._z; i < 0; i++) {
        const waterLayerSprite = new pixi.Sprite(pixi.Texture.from(waterLayer))

        waterLayerSprite.alpha = 0.7
        waterLayerSprite.anchor.set(0.5)
        waterLayerSprite.position.copyFrom(this.position)
        waterLayerSprite.tint = color.hex
        waterLayerSprite.y +=
          i * constants.cellYSpacing + constants.cellYSpacing / 2

        waterContainer.addChild(waterLayerSprite)

        color.red -= 20
        color.green -= 25
      }

      this._waterContainer.addChild(waterContainer)

      this._sprite.tint = color.hex
    }

    // debug

    if (params.debug) {
      const coordinates = new pixi.Text(`${this._hex.col}, ${this._hex.row}`, {
        fill: "white",
      })

      coordinates.anchor.set(0.5)
      coordinates.position.set(
        this._sprite.width / 2,
        this._sprite.height * 0.25,
      )

      this._sprite.addChild(coordinates)
    }
  }
}

import * as pixi from "pixi.js"
import * as events from "@pixi/events"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as params from "../params"
import * as constants from "../constants"
import * as colors from "color-engine"

import pointer from "../core/pointer"

import ContainerChip from "../parents/ContainerChip"

// @ts-ignore
import waterLayer from "../../assets/images/water-layer.png"

interface GridCellEvents extends booyah.BaseCompositeEvents {
  leftClick: []
  rightClick: []
  dragStart: []
  dragEnd: [outside?: boolean]
  hovered: []
  notHovered: []
  pulse: [force: number]
}

export default class GridCell extends ContainerChip<GridCellEvents> {
  private _sprite!: pixi.Sprite
  private _yState!: booyah.StateMachine

  get hex() {
    return this._hex
  }

  constructor(
    private readonly _hex: hex.Hex,
    private readonly _texture: pixi.Texture,
    private _z: number,
    private readonly _waterContainer: pixi.Container,
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

    // Y state

    this._activateChildChip(
      (this._yState = new booyah.StateMachine(
        {
          initial: () => new booyah.WaitForEvent(this, "hovered"),
          hovered: () =>
            new booyah.Alternative([
              new booyah.WaitForEvent(this, "notHovered"),
              new booyah.Sequence([
                new booyah.Tween({
                  from: 0,
                  to: -constants.cellYSpacing / 2,
                  duration: 500,
                  easing: booyah.easeInOutCubic,
                  onTick: (value) => {
                    this._sprite.position.y = this.position.y + value
                  },
                }),
                new booyah.Forever(),
              ]),
            ]),
          reset: () =>
            new booyah.Tween({
              from: this._sprite.position.y - this.position.y,
              to: 0,
              duration: 250,
              easing: booyah.easeInOutCubic,
              onTick: (value) => {
                this._sprite.position.y = this.position.y + value
              },
            }),
          outOfControl: () => new booyah.Forever(),
        },
        {
          startingState: "initial",
          endingStates: [],
          signals: {
            initial: "hovered",
            hovered: "reset",
            reset: "initial",
            outOfControl: "initial",
          },
        },
      )),
    )

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

    this._subscribe(
      this._sprite,
      "pointertap",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("leftClick")
        } else if (event.button === 2) {
          this.emit("rightClick")
        }
      },
    )

    this._subscribe(
      this._sprite,
      "pointerdown",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("dragStart")
        }
      },
    )

    this._subscribe(
      this._sprite,
      "pointerup",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("dragEnd")
        }
      },
    )

    this._subscribe(
      this._sprite,
      "pointerupoutside",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("dragEnd", true)
        }
      },
    )

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

    // pulse

    this._subscribe(this, "pulse", (force: number) => {
      this._yState.changeState("outOfControl")

      this._activateChildChip(
        new booyah.Sequence([
          new booyah.Tween({
            from: 0,
            to: force * constants.cellYSpacing,
            duration: 100,
            easing: booyah.easeOutSine,
            onTick: (value) => {
              this._sprite.position.y = this.position.y + value
            },
          }),
          new booyah.Tween({
            from: force * constants.cellYSpacing,
            to: 0,
            duration: 200,
            easing: booyah.easeInSine,
            onTick: (value) => {
              this._sprite.position.y = this.position.y + value
            },
          }),
          new booyah.Lambda(() => {
            this._yState.changeState("initial")
          }),
        ]),
      )
    })

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

      this._subscribe(this._sprite, "pointertap", () => {
        console.log(this._hex, this._yState.visitedStates)
      })
    }
  }

  protected _onTick() {
    const hitArea = this._sprite.hitArea
    const global = this._sprite.getGlobalPosition()

    if (!hitArea) return

    if (hitArea.contains(pointer.x - global.x, pointer.y - global.y)) {
      this.emit("hovered")
    } else {
      this.emit("notHovered")
    }
  }
}

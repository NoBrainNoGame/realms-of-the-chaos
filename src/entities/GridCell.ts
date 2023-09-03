import * as pixi from "pixi.js"
import * as events from "@pixi/events"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as params from "../params"
import * as constants from "../constants"
import * as colors from "color-engine"
import * as utils from "../utils"

import pointer from "../core/pointer"

import ContainerChip from "../parents/ContainerChip"

// @ts-ignore
import waterLayer from "../../assets/images/water-layer.png"
import Character from "./Character"

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
  private _characterContainer = new pixi.Container()
  private _sprite!: pixi.Sprite
  private _yState!: booyah.StateMachine
  private _arrived!: boolean

  private _pulseForce = 0

  get hex() {
    return this._hex
  }

  constructor(
    private readonly _hex: hex.Hex,
    private readonly _texture: pixi.Texture,
    private _z: number,
    private readonly _waterContainer: pixi.Container,
    /**
     * The delay in milliseconds before the cell appears.
     * @private
     */
    private readonly _arrivalDelayAnimation: false | number = false,
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
    this._arrived = this._arrivalDelayAnimation === false
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
                    this._container.position.y = this.position.y + value
                  },
                }),
                new booyah.Forever(),
              ]),
            ]),
          reset: () =>
            new booyah.Tween({
              from: this._container.position.y - this.position.y,
              to: 0,
              duration: 250,
              easing: booyah.easeInOutCubic,
              onTick: (value) => {
                this._container.position.y = this.position.y + value
              },
            }),
          pulse: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: 0,
                to: this._pulseForce * constants.cellYSpacing,
                duration: 100,
                easing: booyah.easeOutSine,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
              new booyah.Tween({
                from: this._pulseForce * constants.cellYSpacing,
                to: 0,
                duration: 200,
                easing: booyah.easeInSine,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
            ]),
        },
        {
          startingState: "initial",
          endingStates: [],
          signals: {
            initial: "hovered",
            hovered: "reset",
            reset: "initial",
            pulse: "initial",
          },
        },
      )),
    )

    // cell

    this._sprite = new pixi.Sprite(this._texture)

    this._sprite.anchor.set(0.5, 0.25)
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

    // character container

    this._characterContainer = new pixi.Container()

    this._container.addChild(this._characterContainer)

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

    // animate arrival or not

    this._arrivalAnimation()
  }

  protected _onTick() {
    if (!this._arrived) return

    const hitArea = this._sprite.hitArea
    const global = this._sprite.getGlobalPosition()

    if (!hitArea) return

    if (hitArea.contains(pointer.x - global.x, pointer.y - global.y)) {
      this.emit("hovered")
    } else {
      this.emit("notHovered")
    }
  }

  private _arrivalAnimation() {
    if (this._arrivalDelayAnimation !== false) {
      this._container.alpha = 0
      this._container.position.y = this.position.y + 100
      this._container.position.x = this.position.x

      this._activateChildChip(
        new booyah.Sequence([
          new booyah.Wait(this._arrivalDelayAnimation),
          new booyah.Alternative([
            new booyah.Wait(500),
            new booyah.Tween({
              from: 0,
              to: 1,
              duration: 500,
              easing: booyah.easeOutQuart,
              onTick: (alpha) => {
                this._container.alpha = alpha
              },
            }),
            new booyah.Tween({
              from: 100,
              to: 0,
              duration: 500,
              easing: booyah.easeOutBack,
              onTick: (y) => {
                this._container.position.y = this.position.y + y
              },
            }),
          ]),
          new booyah.Lambda(() => {
            this._container.position.copyFrom(this.position)
          }),
          // water layer
          // () => {
          //   if (this._z >= 0) return new booyah.Lambda(() => null)
          //
          //   const waterContainer = new pixi.Container()
          //
          //   const color = new colors.Color("#ffffff")
          //
          //   return new booyah.Sequence([
          //     ...utils.times(Math.abs(this._z), (index) => {
          //       const waterLayerSprite = new pixi.Sprite(
          //         pixi.Texture.from(waterLayer),
          //       )
          //
          //       waterLayerSprite.alpha = 0.7
          //       waterLayerSprite.anchor.set(0.5)
          //       waterLayerSprite.position.copyFrom(this.position)
          //       waterLayerSprite.y +=
          //         -index * constants.cellYSpacing + constants.cellYSpacing / 2
          //
          //       return new booyah.Sequence([
          //         new booyah.Lambda(() => {
          //           waterContainer.addChild(waterLayerSprite)
          //         }),
          //         new booyah.Alternative([
          //           new booyah.Wait(500),
          //           new booyah.Tween({
          //             from: 0,
          //             to: 1,
          //             duration: 500,
          //             easing: booyah.easeOutQuart,
          //             onTick: (factor) => {
          //               waterLayerSprite.alpha = 0.7 * factor
          //               color.red = 255 - 20 * factor
          //               color.green = 255 - 25 * factor
          //             },
          //           }),
          //         ]),
          //       ])
          //     }),
          //     new booyah.Lambda(() => {
          //       this._waterContainer.addChild(waterContainer)
          //
          //       this._sprite.tint = color.hex
          //     }),
          //   ])
          // },
          new booyah.Lambda(() => {
            this._arrived = true

            this._initWaterLayer()
          }),
        ]),
      )
    } else {
      this._container.position.copyFrom(this.position)

      // water layer

      this._initWaterLayer()
    }
  }

  private _initWaterLayer() {
    if (this._z < 0) {
      const waterContainer = new pixi.Container()

      waterContainer.zIndex = this._hex.row

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
  }

  public addCharacter(character: Character) {
    this._activateChildChip(character, {
      context: {
        container: this._characterContainer,
      },
    })
  }

  public pulse(force: number) {
    this._pulseForce = force
    this._yState.changeState("pulse")
  }
}

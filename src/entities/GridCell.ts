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
import { cellHeight } from "../constants"

interface GridCellEvents extends booyah.BaseCompositeEvents {
  leftClick: []
  rightClick: []
  dragStart: []
  dragEnd: [outside?: boolean]
  hovered: []
  notHovered: []
  pulse: [force: number]
  ready: []
}

export default class GridCell extends ContainerChip<GridCellEvents> {
  private _characterContainer!: pixi.Container
  private _waterContainer!: pixi.Container
  private _sprite!: pixi.Sprite
  private _yState!: booyah.StateMachine
  private _isReady!: boolean
  private _hovered!: boolean

  private _pulseForce = 0

  get hex() {
    return this._hex
  }

  get isReady() {
    return this._isReady
  }

  constructor(
    private readonly _hex: hex.Hex,
    private readonly _texture: pixi.Texture,
    private _z: number,
    private readonly _waterParentContainer: pixi.Container,
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
    this._isReady = false
    this._hovered = false

    this._container.zIndex = this._hex.row

    this._characterContainer = new pixi.Container()
    this._waterContainer = new pixi.Container()

    // Y state

    this._activateChildChip(
      (this._yState = new booyah.StateMachine(
        {
          initial: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.position.y,
                to: 0,
                duration: 150,
                easing: booyah.easeInOutCubic,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
              new booyah.WaitForEvent(this, "hovered"),
            ]),
          hovered: () =>
            new booyah.Alternative([
              new booyah.WaitForEvent(this, "notHovered"),
              new booyah.Sequence([
                new booyah.Tween({
                  from: this._container.position.y - this.position.y,
                  to: -constants.cellYSpacing / 2,
                  duration: 150,
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
              to: this._hovered ? -constants.cellYSpacing / 2 : 0,
              duration: 150,
              easing: booyah.easeInOutCubic,
              onTick: (value) => {
                this._container.position.y = this.position.y + value
              },
            }),
          pulse: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.position.y,
                to: this._pulseForce * constants.cellYSpacing,
                duration: 100,
                easing: booyah.easeOutSine,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
              new booyah.Tween({
                from: this._pulseForce * constants.cellYSpacing,
                to: this._hovered ? -constants.cellYSpacing / 2 : 0,
                duration: 200,
                easing: booyah.easeInSine,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
            ]),
          sink: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.position.y,
                to: constants.cellHeight * 2,
                duration: 250,
                easing: booyah.easeInCubic,
                onTick: (value) => {
                  this._container.position.y = this.position.y + value
                },
              }),
              new booyah.Lambda(() => {
                this.emit("hidden")
              }),
              new booyah.Tween({
                from: constants.cellHeight * 2,
                to: this._hovered ? -constants.cellYSpacing / 2 : 0,
                duration: 250,
                easing: booyah.easeOutCubic,
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
            sink: "initial",
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
    if (!this._isReady) return

    const hitArea = this._sprite.hitArea
    const global = this._sprite.getGlobalPosition()

    if (!hitArea) return

    if (hitArea.contains(pointer.x - global.x, pointer.y - global.y)) {
      this.emit("hovered")
      this._hovered = true
    } else {
      this.emit("notHovered")
      this._hovered = false
    }
  }

  private _arrivalAnimation() {
    const sequence: booyah.ChipResolvable[] = []

    if (this._arrivalDelayAnimation !== false) {
      this._container.alpha = 0
      this._container.position.y = this.position.y + 100
      this._container.position.x = this.position.x

      sequence.push(
        new booyah.Sequence([
          new booyah.Wait(this._arrivalDelayAnimation),
          new booyah.Parallel([
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
          this._initWaterLayer(),
        ]),
      )
    } else {
      this._container.position.copyFrom(this.position)

      // water layer

      sequence.push(this._initWaterLayer())
    }

    sequence.push(
      new booyah.Lambda(() => {
        this._isReady = true

        this.emit("ready")
      }),
    )

    this._activateChildChip(new booyah.Sequence(sequence))
  }

  private _initWaterLayer() {
    if (this._z < 0) {
      let color: colors.Color

      const sequence: booyah.ChipResolvable[] = [
        new booyah.Lambda(() => {
          this._waterContainer.zIndex = this._hex.row
          this._waterParentContainer.addChild(this._waterContainer)

          color = new colors.Color("#ffffff")
        }),
      ]

      if (this._arrivalDelayAnimation !== false) {
        sequence.push(
          ...utils.times(Math.abs(this._z), (i) => {
            const duration = 200

            const z = this._z + i

            const waterLayerSprite = new pixi.Sprite(
              pixi.Texture.from(waterLayer),
            )

            waterLayerSprite.alpha = 0
            waterLayerSprite.anchor.set(0.5)
            waterLayerSprite.position.copyFrom(this.position)

            this._waterContainer.addChild(waterLayerSprite)

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
              const waterLayerSprite = new pixi.Sprite(
                pixi.Texture.from(waterLayer),
              )

              waterLayerSprite.alpha = 0.7
              waterLayerSprite.anchor.set(0.5)
              waterLayerSprite.position.copyFrom(this.position)
              waterLayerSprite.tint = color.hex
              waterLayerSprite.y +=
                i * constants.cellYSpacing + constants.cellYSpacing / 2

              this._waterContainer.addChild(waterLayerSprite)

              color.red -= 25
              color.green -= 25
            }
          }),
        )
      }

      return new booyah.Parallel([
        new booyah.Sequence(sequence),
        () =>
          new booyah.Tween({
            from: 255,
            to: 255 + this._z * 25,
            duration: 1000,
            easing: booyah.linear,
            onTick: (value) => {
              this._sprite.tint = new colors.Color([value, value, 255]).hex
            },
          }),
      ])
    } else {
      return new booyah.Lambda(() => null)
    }
  }

  private _refreshCharacterPositions() {
    const characters = this.characters

    if (characters.length === 1) {
      characters[0].position.set(0)
    } else if (characters.length === 2) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(constants.cellWidth / 4, 0)
    } else if (characters.length === 3) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(0, -cellHeight / 4)
      characters[2].position.set(constants.cellWidth / 4, 0)
    }
  }

  get characters() {
    return Object.values(this.children).filter(
      (child): child is Character => child instanceof Character,
    )
  }

  public hasCharacter(character?: Character): boolean {
    return character
      ? this.characters.includes(character)
      : this.characters.length > 0
  }

  public addCharacter(character: Character) {
    this.sink(() => {
      this._activateChildChip(character, {
        context: {
          container: this._characterContainer,
        },
      })

      this._refreshCharacterPositions()
    })
  }

  public removeCharacter(character: Character) {
    this.sink(() => {
      this._terminateChildChip(character)
    })
  }

  public removeCharacters() {
    this.sink(() => {
      this.characters.forEach((character) => {
        this._terminateChildChip(character)
      })
    })
  }

  public pulse(force: number) {
    this._pulseForce = force
    this._yState.changeState("pulse")
  }

  public sink(cb: () => void) {
    this._subscribeOnce(this, "hidden", cb)
    this._yState.changeState("sink")
  }
}

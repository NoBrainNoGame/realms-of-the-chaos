import * as pixi from "pixi.js"
import * as events from "@pixi/events"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as params from "../params"
import * as constants from "../constants"
import * as colors from "color-engine"
import * as utils from "../utils"

import pointer from "../core/pointer"

import Character from "./Character"
import GridElement from "./GridElement"

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
  ready: []
}

export default class GridCell extends GridElement<GridCellEvents> {
  private _characterContainer!: pixi.Container
  private _waterContainer!: pixi.Container
  private _sprite!: pixi.Sprite
  private _yState!: booyah.StateMachine
  private _hovered!: boolean

  private _pulseForce = 0

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

    this._preparation = this._arrivalAnimation()
  }

  protected _onTick() {
    if (!this.isReady) return

    this._characterContainer.position.copyFrom(this._container.position)

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
        ]),
      )
    } else {
      sequence.push(
        new booyah.Lambda(() => {
          this._container.position.copyFrom(this.position)
        }),
      )
    }

    sequence.push(
      new booyah.Lambda(() => {
        this.emit("ready")
      }),
    )

    return new booyah.Parallel([
      new booyah.Sequence(sequence),
      () =>
        this.isUnderWater
          ? new booyah.Tween({
              from: 255,
              to: 255 + this._z * 25,
              duration: 1000,
              easing: booyah.linear,
              onTick: (value) => {
                this._sprite.tint = new colors.Color([value, value, 255]).hex
              },
            })
          : new booyah.Transitory(),
    ])
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

import * as pixi from "pixi.js"
import * as events from "@pixi/events"
import * as booyah from "@ghom/booyah"
import * as utils from "../utils"
import * as params from "../params"
import * as constants from "../constants"

import pointer from "../core/pointer"

import ContainerChip from "../extensions/ContainerChip"
import Grid from "./Grid"

interface GridCellEvents extends booyah.BaseCompositeEvents {
  leftClick: []
  rightClick: []
  drag: []
  drop: [outside?: boolean]
  hovered: []
  notHovered: []
  hidden: []
  comeBack: []
  reachable: [value: boolean]
}

export default class GridCell extends ContainerChip<GridCellEvents> {
  private _sprite!: pixi.Sprite
  private _yState!: booyah.StateMachine
  private _tint!: number | string
  private _hovered!: boolean
  private _pulseForce!: number
  private _isReachable!: boolean

  constructor(
    public readonly col: number,
    public readonly row: number,
    public readonly z: number,
    private readonly _texture: pixi.Texture,
    /**
     * The delay in milliseconds before the cell appears.
     * @private
     */
    private readonly _arrivalDelayAnimation: false | number = false,
  ) {
    super()
  }

  get tint() {
    return this._tint
  }

  set tint(value: number | string) {
    this._tint = value
    this._sprite.tint = value
  }

  get isUnderWater() {
    return this.z < 0
  }

  get isElevated() {
    return this.z > 0
  }

  get isReachable() {
    return this._isReachable
  }

  set isReachable(value: boolean) {
    this._isReachable = value
    this.emit("reachable", value)
  }

  get position() {
    return this._container.position
  }

  get cellPosition(): pixi.IPointData {
    return {
      x: this.col,
      y: this.row,
    }
  }

  get basePosition() {
    const isometric = utils.isometricToScreen({
      x: this.col,
      y: this.row,
    })

    isometric.x += -this.z * constants.cellYSpacing

    return isometric
  }

  get globalPosition() {
    return this._container.getGlobalPosition()
  }

  get isHovered() {
    return this._hovered
  }

  get container() {
    return this._container
  }

  protected _onActivate() {
    super._onActivate()

    this._container.zIndex = this.row + this.col

    this._hovered = false
    this._pulseForce = 0

    this._tint = 0xffffff

    // Y state

    this._activateChildChip(
      (this._yState = new booyah.StateMachine(
        {
          initial: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.basePosition.y,
                to: 0,
                duration: 150,
                easing: booyah.easeInOutCubic,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
              new booyah.WaitForEvent(this, "hovered"),
            ]),
          hovered: () =>
            new booyah.Alternative([
              new booyah.WaitForEvent(this, "notHovered"),
              new booyah.Sequence([
                new booyah.Tween({
                  from: this._container.position.y - this.basePosition.y,
                  to: -constants.cellYSpacing / 2,
                  duration: 150,
                  easing: booyah.easeInOutCubic,
                  onTick: (value) => {
                    this._container.position.y = this.basePosition.y + value
                  },
                }),
                new booyah.Forever(),
              ]),
            ]),
          highlighted: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.basePosition.y,
                to: -constants.cellYSpacing / 2,
                duration: 150,
                easing: booyah.easeInOutCubic,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
              new booyah.Forever(),
            ]),
          reset: () =>
            new booyah.Tween({
              from: this._container.position.y - this.basePosition.y,
              to: this._hovered ? -constants.cellYSpacing / 2 : 0,
              duration: 150,
              easing: booyah.easeInOutCubic,
              onTick: (value) => {
                this._container.position.y = this.basePosition.y + value
              },
            }),
          pulse: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.basePosition.y,
                to: this._pulseForce * constants.cellYSpacing,
                duration: 100,
                easing: booyah.easeOutSine,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
              new booyah.Tween({
                from: this._pulseForce * constants.cellYSpacing,
                to: this._hovered ? -constants.cellYSpacing / 2 : 0,
                duration: 200,
                easing: booyah.easeInSine,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
            ]),
          sink: () =>
            new booyah.Sequence([
              new booyah.Tween({
                from: this._container.position.y - this.basePosition.y,
                to: constants.cellHeight * 2,
                duration: 250,
                easing: booyah.easeInBack,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
              new booyah.Lambda(() => {
                this.emit("hidden")
              }),
              new booyah.Tween({
                from: constants.cellHeight * 2,
                to: this._hovered ? -constants.cellYSpacing / 2 : 0,
                duration: 1000,
                easing: booyah.easeOutBounce,
                onTick: (value) => {
                  this._container.position.y = this.basePosition.y + value
                },
              }),
              new booyah.Lambda(() => {
                this.emit("comeBack")
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

    this._sprite.hitArea = new pixi.Polygon([
      utils.isometricToScreen({ x: 0 - 0.5, y: 0 - 0.5 }),
      utils.isometricToScreen({ x: 1 - 0.5, y: 0 - 0.5 }),
      utils.isometricToScreen({ x: 1 - 0.5, y: 1 - 0.5 }),
      utils.isometricToScreen({ x: 0 - 0.5, y: 1 - 0.5 }),
    ])

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
          this.emit("drag")
        }
      },
    )

    this._subscribe(
      this._sprite,
      "pointerup",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("drop")
        }
      },
    )

    this._subscribe(
      this._sprite,
      "pointerupoutside",
      (event: events.FederatedPointerEvent) => {
        if (event.button === 0) {
          this.emit("drop", true)
        }
      },
    )

    this._container.addChild(this._sprite)

    // debug

    if (params.debug) {
      const coordinates = new pixi.Text(`${this.col}:${this.row}:${this.z}`, {
        fill: "grey",
        fontSize: 15,
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

    this._container.position.copyFrom(this._container.position)

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
      this._container.position.y = this.basePosition.y + 100
      this._container.position.x = this.basePosition.x

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
                this._container.position.y = this.basePosition.y + y
              },
            }),
          ]),
          new booyah.Lambda(() => {
            this._container.position.copyFrom(this.basePosition)
          }),
        ]),
      )
    } else {
      sequence.push(
        new booyah.Lambda(() => {
          this._container.position.copyFrom(this.basePosition)
        }),
      )
    }

    return new booyah.Sequence(sequence)
  }

  public pulse(force: number) {
    this._pulseForce = force
    this._yState.changeState("pulse")
  }

  public sink(onHidden: () => void, onComeBack: () => void) {
    this._subscribeOnce(this, "hidden", onHidden)
    this._subscribeOnce(this, "comeBack", onComeBack)
    this._yState.changeState("sink")
  }

  public highlight() {
    this._yState.changeState("highlighted")
  }

  public unHighlight() {
    this._yState.changeState("reset")
  }
}

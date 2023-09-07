import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

import { OutlineFilter } from "@pixi/filter-outline"

import ContainerChip from "../extensions/ContainerChip"

interface GaugeOptions {
  width: number
  height: number
  background: pixi.Texture
  bar: pixi.Texture
  text: (value: number) => string
  initialValue: number
  position: pixi.IPointData
}

export default class Gauge extends ContainerChip {
  private _background!: pixi.NineSlicePlane
  private _bar!: pixi.NineSlicePlane
  private _text!: pixi.Text
  private _value!: number

  constructor(private _options: GaugeOptions) {
    super()
  }

  /**
   * Value between 0 and 1
   */
  get value() {
    return this._value
  }

  /**
   * Value between 0 and 1
   */
  set value(value: number) {
    this._value = Math.min(1, Math.max(0, value))

    this._updateBar()
    this._updateText()
  }

  protected _onActivate() {
    this._background = new pixi.NineSlicePlane(
      this._options.background,
      4,
      4,
      4,
      4,
    )

    this._bar = new pixi.NineSlicePlane(this._options.bar, 3, 3, 3, 3)

    this._text = new pixi.Text("", {
      fontSize: 12,
      fill: "white",
    })

    this._text.anchor.set(0.5)

    this._background.width = this._options.width
    this._background.height = this._options.height

    this._background.position.set(
      -this._options.width / 2,
      -this._options.height / 2,
    )

    this._bar.width = this._options.width
    this._bar.height = this._options.height

    this._bar.position.set(-this._options.width / 2, -this._options.height / 2)

    this._container.position.copyFrom(this._options.position)
    this._container.addChild(this._background, this._bar, this._text)
    this._container.filters = [new OutlineFilter(1, 0x000000, 1)]

    this.value = this._options.initialValue
  }

  private _updateBar() {
    this._bar.width = this._options.width * this._value
  }

  private _updateText() {
    this._text.text = this._options.text(this._value)
  }
}

import * as pixi from "pixi.js"
import * as enums from "../enums"

import ContainerChip from "../parents/ContainerChip"

interface CharacterProperties {
  name: string
  texture: pixi.Texture
  class: enums.CharacterClass
  race: enums.CharacterRace
  level: number
  distribution: Partial<Record<enums.CharacterSkill, number>>
}

export default class Character extends ContainerChip {
  private _sprite!: pixi.Sprite

  constructor(private _baseProperties: CharacterProperties) {
    super()
  }

  protected _onActivate() {
    this._sprite = new pixi.Sprite(this._baseProperties.texture)

    this._sprite.anchor.set(0.5, 0.75)

    this._container.addChild(this._sprite)
  }
}

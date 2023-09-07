import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as constants from "../constants"

import { OutlineFilter } from "@pixi/filter-outline"

// @ts-ignore
import timelineArrow from "../../assets/images/timeline-arrow.png"

import ContainerChip from "../extensions/ContainerChip"
import TimelineCharacter from "./TimelineCharacter"
import Character from "./Character"
import Fight from "./Fight"

export default class Timeline extends ContainerChip {
  private _arrow!: pixi.NineSlicePlane
  private _characters!: TimelineCharacter[]

  constructor(
    private _fight: Fight,
    private _teams: Character[][],
  ) {
    super()
  }

  protected _onActivate() {
    const texture = pixi.Texture.from(timelineArrow)

    // init arrow

    this._arrow = new pixi.NineSlicePlane(texture, 25, 25, 41, 25)

    this._arrow.width = constants.timelineArrowWidth
    this._arrow.height = 50

    this._container.addChild(this._arrow)
    this._container.filters = [new OutlineFilter(5, 0x000000, 1)]

    // init characters

    this._characters = []

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Functional({
          shouldTerminate: () => this._fight.isReady,
        }),
        new booyah.Lambda(() => {
          this._teams.forEach((team) => {
            team.forEach((character) => {
              const timelineCharacter = new TimelineCharacter(character)

              this._characters.push(timelineCharacter)

              this._activateChildChip(timelineCharacter, {
                context: {
                  container: this._arrow,
                },
              })

              this._subscribeOnce(character, "dead", () => {
                this._characters.splice(
                  this._characters.indexOf(timelineCharacter),
                  1,
                )

                this._terminateChildChip(timelineCharacter)
              })
            })
          })
        }),
      ]),
    )
  }

  protected _onResize(width: number) {
    this._container.position.set(
      width / 2 - constants.timelineArrowWidth / 2,
      25,
    )
  }

  protected _onTick() {
    const sortedCharacters = this._characters.sort((a, b) => {
      // sort characters by their time before action
      return b.character.timeBeforeAction - a.character.timeBeforeAction
    })

    for (const character of sortedCharacters) {
      character.targetX =
        (sortedCharacters.indexOf(character) / sortedCharacters.length) *
        constants.timelineArrowWidth
    }
  }
}

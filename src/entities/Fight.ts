import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as utils from "../utils"
import * as constants from "../constants"

import ContainerChip from "../extensions/ContainerChip"
import Character, { CharacterProperties } from "./Character"
import Timeline from "./Timeline"
import Grid from "./Grid"

/**
 * Represent a fight between two or more entities. <br>
 * Contains a timeline of actions, clones of fighter characters and a grid.
 */
export default class Fight extends ContainerChip {
  private _centerContainer!: pixi.Container
  private _anchorContainer!: pixi.Container
  private _gridContainer!: pixi.Container
  private _hudContainer!: pixi.Container

  private _grid!: Grid
  private _timeline!: Timeline
  private _characters!: Character[]
  private _animations!: booyah.Queue
  private _teams: Character[][]

  constructor(teams: CharacterProperties[][]) {
    super()

    if (teams.length > 4) throw new Error("Too many teams")

    this._teams = teams.map((team) =>
      team.map((character) => new Character(character, this)),
    )
  }

  get grid() {
    return this._grid
  }

  get animations() {
    return this._animations
  }

  get characters() {
    return this._characters
  }

  get gridContainer() {
    return this._gridContainer
  }

  protected _onActivate() {
    // init containers

    this._centerContainer = new pixi.Container()
    this._anchorContainer = new pixi.Container()

    this._gridContainer = new pixi.Container()
    this._hudContainer = new pixi.Container()

    this._centerContainer.addChild(this._anchorContainer)
    this._anchorContainer.addChild(this._gridContainer)

    this._container.addChild(this._centerContainer, this._hudContainer)

    // init queue animation

    this._activateChildChip((this._animations = new booyah.Queue()))

    // init grid

    this._activateChildChip((this._grid = new Grid()), {
      context: {
        container: this._gridContainer,
      },
    })

    const center = this._grid.getCell({
      x: Math.floor(constants.gridWidth / 2),
      y: Math.floor(constants.gridHeight / 2),
    })!

    this._anchorContainer.position.set(
      -center.basePosition.x,
      -center.basePosition.y,
    )

    // init timeline

    this._activateChildChip(
      (this._timeline = new Timeline(this, this._teams)),
      {
        context: {
          container: this._hudContainer,
        },
      },
    )

    // init characters

    this._characters = []

    this._preparation = new booyah.Sequence([
      new booyah.Functional({
        shouldTerminate: () => this._grid.isReady,
      }),
      new booyah.Lambda(() => {
        this._teams.forEach((team, teamIndex) => {
          team.forEach((character, characterIndex) => {
            this.addCharacter(
              character,
              teamIndex,
              this._grid.getPlacement(teamIndex, characterIndex),
            )
          })
        })
      }),
    ])
  }

  protected _onResize(width: number, height: number) {
    this._centerContainer.position.set(width / 2 + 25, height / 2)
  }

  protected _onTick() {
    if (!this.isReady) return

    const activeCharacters = this._characters.filter(
      (character) => character.state === "active",
    )

    while (this._animations.isEmpty && activeCharacters.length > 0) {
      for (let i = 0; i < activeCharacters.length; i++) {
        // For each character, we check if they can do an action. (based on their own timeline)
        if (this._characters[i].fightTick(this)) {
          // If the character do an action, we stop the timeline and let the action/animation run.
          break
        }
      }
    }
  }

  /**
   * Add a character to the grid and activate it in GridCell.
   */
  public addCharacter(
    character: Character,
    teamIndex: number,
    position: pixi.IPointData,
  ) {
    let cell = this._grid.getCell(position)

    if (!cell) throw new Error("Cell not found")

    this._characters.push(character)

    this._subscribeOnce(character, "dead", () => {
      this.removeCharacter(character)
    })

    cell.sink(
      () => {
        this._activateChildChip(character)
        cell!.addToContainer(character)
      },
      () => {
        character.teamIndex = teamIndex
      },
    )
  }

  public removeCharacter(character: Character) {
    if (!character.cell) {
      this._terminateChildChip(character)

      this._characters.splice(this._characters.indexOf(character), 1)

      return
    }

    const { cell } = character

    this._characters.splice(this._characters.indexOf(character), 1)

    cell.sink(
      () => {
        cell!.removeFromContainer(character)

        this._terminateChildChip(character)
      },
      () => {},
    )
  }
}

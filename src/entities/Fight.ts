import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"
import * as enums from "../enums"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import Grid from "./Grid"
import * as constants from "../constants"
import Water from "./Water"
import GridCell from "./GridCell"

/**
 * Represent a fight between two or more entities. <br>
 * Contains a timeline of actions, clones of fighter characters and a grid.
 */
export default class Fight extends ContainerChip {
  private _centerContainer!: pixi.Container
  private _gridContainer!: pixi.Container
  private _waterContainer!: pixi.Container
  private _characterContainer!: pixi.Container
  private _hudContainer!: pixi.Container

  private _grid!: Grid
  private _water!: Water
  private _characters!: Character[]
  private _animations!: booyah.Queue

  constructor(private _teams: Character[][]) {
    super()

    if (this._teams.length > 4) throw new Error("Too many teams")
  }

  protected _onActivate() {
    // init containers

    this._centerContainer = new pixi.Container()

    this._container.addChild(this._centerContainer)

    this._gridContainer = new pixi.Container()
    this._waterContainer = new pixi.Container()
    this._characterContainer = new pixi.Container()
    this._hudContainer = new pixi.Container()

    this._characterContainer.sortableChildren = true

    this._centerContainer.addChild(
      this._gridContainer,
      this._waterContainer,
      this._characterContainer,
      this._hudContainer,
    )

    // init queue animation

    this._activateChildChip((this._animations = new booyah.Queue()))

    // init grid

    this._activateChildChip((this._grid = new Grid()), {
      context: {
        container: this._gridContainer,
      },
    })

    const center = this._grid.getCell({
      col: Math.floor(constants.gridWidth / 2),
      row: Math.floor(constants.gridHeight / 2),
    })!

    this._centerContainer.position.set(-center.hex.x, -center.hex.y)

    // init water

    this._activateChildChip((this._water = new Water(this._grid, false)), {
      context: {
        container: this._waterContainer,
      },
    })

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
    this._container.position.set(width / 2 + 25, height / 2)
  }

  protected _onTick() {
    if (!this._grid.isReady) return

    if (this._animations.isEmpty) {
      for (let i = 0; i < this._characters.length; i++) {
        // For each character, we check if they can do an action. (based on their own timeline)
        if (
          this._characters[i].timelineTick(
            this._animations,
            this._grid,
            this._characters,
          )
        ) {
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
    position: hex.OffsetCoordinates,
  ) {
    let cell = this._grid.getCell(position)

    cell.sink(() => {
      this._activateChildChip(character, {
        context: {
          container: this._characterContainer,
        },
      })

      character.teamIndex = teamIndex
      character.cell = cell

      this._refreshCharacterPositions(cell.hex)

      this._subscribe(character, "moved", (fromCell, toCell) => {
        this._refreshCharacterPositions(fromCell.hex)
        this._refreshCharacterPositions(toCell.hex)
      })

      this._characters.push(character)
    })
  }

  public removeCharacter(character: Character) {
    if (!character.cell) return

    character.cell.sink(() => {
      this._characters.splice(this._characters.indexOf(character), 1)

      character.cell = null
    })
  }

  private _refreshCharacterPositions(_hex: hex.OffsetCoordinates) {
    const characters = this._characters.filter(
      (character) => character.cell && character.cell.hex.equals(_hex),
    )

    characters.forEach((character) => {
      character.zAdjustment = 0
    })

    if (characters.length === 1) {
      characters[0].position.set(0)
    } else if (characters.length === 2) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(constants.cellWidth / 4, 0)
    } else if (characters.length === 3) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(0, -constants.cellHeight / 4)
      characters[2].position.set(constants.cellWidth / 4, 0)
      characters[1].zAdjustment = -0.5
    } else if (characters.length !== 0) {
      throw new Error("Too many characters on the same cell")
    }
  }
}

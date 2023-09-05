import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import Grid from "./Grid"
import * as constants from "../constants"
import Water from "./Water"

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

    this._activateChildChip((this._water = new Water(this._grid)), {
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

    // @ts-ignore
    if (this._animations._queue.length === 0) {
      this._teams.forEach((team) => {
        team.forEach((character) => character.timelineTick(this._animations))
      })
    }
  }

  /**
   * Add a character to the grid and activate it in GridCell.
   * @param character
   * @param position
   */
  public addCharacter(character: Character, position: hex.OffsetCoordinates) {
    let cell = this._grid.getCell(position)

    cell.sink(() => {
      this._activateChildChip(character, {
        context: {
          container: this._characterContainer,
        },
      })

      character.cell = cell

      this._refreshCharacterPositions(cell.hex)

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

    if (characters.length === 1) {
      characters[0].position.set(0)
    } else if (characters.length === 2) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(constants.cellWidth / 4, 0)
    } else if (characters.length === 3) {
      characters[0].position.set(-constants.cellWidth / 4, 0)
      characters[1].position.set(0, -constants.cellHeight / 4)
      characters[2].position.set(constants.cellWidth / 4, 0)
    }
  }
}

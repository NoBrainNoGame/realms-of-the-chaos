import GridElement from "./GridElement"
import * as constants from "../constants"
import Character from "./Character"

/**
 * Represent a movable character in the grid.
 */
export default class GridCharacter extends GridElement {
  private _refreshCharacterPositions() {
    const characters = this.characters

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
}

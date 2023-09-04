import * as booyah from "@ghom/booyah"

import * as fixtures from "../fixtures"

import app from "./app"

import Fight from "../entities/Fight"
import GridEditor from "../entities/GridEditor"

class Game extends booyah.Composite {
  get defaultChildChipContext() {
    return {
      container: app.stage,
    }
  }

  protected _onActivate() {
    // this._activateChildChip(
    //   new Fight([fixtures.makeTeam(), fixtures.makeTeam()]),
    // )

    this._activateChildChip(new GridEditor())
  }

  protected _onTerminate() {}
}

const game = new Game()

export default game

import * as booyah from "@ghom/booyah"

import * as fixtures from "../fixtures"

import app from "./app"

import Fight from "../entities/Fight"

class Game extends booyah.Composite {
  get defaultChildChipContext() {
    return {
      container: app.stage,
    }
  }

  protected _onActivate() {
    this._activateChildChip(
      new Fight([fixtures.makeTeam(), fixtures.makeTeam()]),
    )
  }

  protected _onTerminate() {}
}

const game = new Game()

export default game

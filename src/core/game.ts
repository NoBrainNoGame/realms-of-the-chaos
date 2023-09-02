import * as booyah from "@ghom/booyah"

import app from "./app"

import Grid from "../entities/Grid"

class Game extends booyah.Composite {
  private _grid!: Grid

  get defaultChildChipContext() {
    return {
      container: app.stage,
    }
  }

  protected _onActivate() {
    this._activateChildChip((this._grid = new Grid()))
  }

  protected _onTerminate() {}
}

const game = new Game()

export default game

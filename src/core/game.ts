import * as booyah from "@ghom/booyah"

import * as fixtures from "../fixtures"
import * as params from "../params"

import app from "./app"

import Fight from "../entities/Fight"
import GridEditor from "../entities/GridEditor"
import DebugComposite from "../debug/DebugComposite"

class Game extends booyah.Composite {
  get defaultChildChipContext() {
    return {
      container: app.stage,
    }
  }

  protected _onActivate() {
    if (params.debug) {
      this._activateChildChip(
        new DebugComposite(
          this,
          console.log,
          [],
          (name) =>
            name === "Lambda" ||
            name === "Sequence" ||
            name === "Parallel" ||
            name === "StateMachine",
        ),
      )
    }

    if (params.version === "editor") {
      this._activateChildChip(new GridEditor())
    } else if (params.version === "fight") {
      this._activateChildChip(
        new Fight([fixtures.makeTeam(), fixtures.makeTeam()]),
      )
    }
    //
  }

  protected _onTerminate() {}
}

const game = new Game()

export default game

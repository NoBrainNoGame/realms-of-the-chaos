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
          (log) => {
            console.log(log)
          },
          [],
          (name) =>
            name === "Sequence" ||
            name === "Parallel" ||
            name === "StateMachine",
        ),
      )
    }

    // this._activateChildChip(
    //   new Fight([fixtures.makeTeam(), fixtures.makeTeam()]),
    // )

    requestAnimationFrame(() => {
      this._activateChildChip(new GridEditor())
    })
  }

  protected _onTerminate() {}
}

const game = new Game()

export default game

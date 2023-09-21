import * as booyah from "@ghom/booyah"

import * as params from "../params"

import app from "./app"
import behaviors from "../data/behaviors"
import characters from "../data/characters"

import Fight from "../entities/Fight"
import Character from "../entities/Character"
import GridEditor from "../entities/GridEditor"
import DebugComposite from "../debug/DebugComposite"
import { CharacterBehavior } from "../enums"

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
          (path) =>
            path.includes("Lambda") ||
            path.includes("Parallel") ||
            path.includes("StateMachine") ||
            path.includes("TimelineCharacter") ||
            (path.includes("Sequence") && !path.includes("PlayerTurn")),
        ),
      )
    }

    if (params.version === "editor") {
      this._activateChildChip(new GridEditor())
    } else if (params.version === "fight") {
      this._activateChildChip(
        new Fight([
          [
            {
              ...characters.Merlin,
              level: 10,
              distribution: Character.generateRandomDistribution(10),
            },
            {
              ...characters.Merlin,
              name: "Sorcerio",
              level: 10,
              distribution: Character.generateRandomDistribution(10),
            },
          ],
          [
            {
              ...characters.Eva,
              level: 10,
              distribution: Character.generateRandomDistribution(10),
              actionBehavior: behaviors[CharacterBehavior.STANDARD],
            },
            {
              ...characters.Eva,
              name: "Cléophée",
              level: 10,
              distribution: Character.generateRandomDistribution(10),
              actionBehavior: behaviors[CharacterBehavior.STANDARD],
            },
          ],
        ]),
      )
    }
  }
}

const game = new Game()

export default game

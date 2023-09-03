import * as booyah from "@ghom/booyah"
import ContainerChip from "../parents/ContainerChip"
import Character from "./Character"

export default class PlayerTurn extends ContainerChip {
  constructor(
    private _character: Character,
    private _animations: booyah.Queue,
  ) {
    super()
  }

  protected _onActivate() {
    // todo: En fonction de ce que le player fait on ajoute du temps d'action au character via addActionTime
    //  et on lance une animation via this._animations.add
  }
}

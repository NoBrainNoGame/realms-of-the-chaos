import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as utils from "../utils"
import ContextChip from "./ContextChip"

/**
 * A chip that contains a pixi container and can be a child of any container.
 */
export default abstract class MovableChip<
  CompositeEvents extends
    booyah.BaseCompositeEvents = booyah.BaseCompositeEvents,
> extends ContextChip<CompositeEvents> {
  protected _container!: pixi.Container

  get container() {
    return this._container
  }

  get floor() {
    return this._floor
  }

  get defaultChildChipContext() {
    return {
      container: this._container,
    }
  }

  constructor(protected _floor: utils.Floor) {
    super()
  }

  public activate(
    tickInfo: booyah.TickInfo,
    chipContext: Readonly<Record<string, any>>,
    inputSignal?: booyah.Signal,
    reloadMemento?: booyah.ReloadMemento,
  ) {
    this._container = new pixi.Container()

    super.activate(tickInfo, chipContext, inputSignal, reloadMemento)
  }

  public terminate() {
    super.terminate()

    this._container.destroy()
  }
}

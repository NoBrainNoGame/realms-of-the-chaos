import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

import ContextChip from "./ContextChip"

export default abstract class ContainerChip<
  CompositeEvents extends
    booyah.BaseCompositeEvents = booyah.BaseCompositeEvents,
> extends ContextChip<CompositeEvents> {
  protected _container!: pixi.Container

  get defaultChildChipContext() {
    return {
      container: this._container,
    }
  }

  constructor(private _zIndex: number = 0) {
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

    this.chipContext.container.addChildAt(this._container, this._zIndex)
  }

  public terminate() {
    super.terminate()

    this.chipContext.container.removeChild(this._container)

    this._container.destroy()
  }
}

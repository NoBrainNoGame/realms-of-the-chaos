import * as booyah from "@ghom/booyah"
import { Container } from "pixi.js"

/**
 * A booyah Composite owning a pixi Container, attached to the `container`
 * provided by its parent context and destroyed with the chip.
 */
export default abstract class ViewChip<
  Events extends booyah.BaseCompositeEvents = booyah.BaseCompositeEvents,
> extends booyah.Composite<Events> {
  protected _container!: Container

  get container() {
    return this._container
  }

  get defaultChildChipContext(): booyah.ChipContextResolvable {
    return { container: this._container }
  }

  protected get _parentContainer(): Container {
    return this.chipContext.container as Container
  }

  public activate(
    tickInfo: booyah.TickInfo,
    chipContext: booyah.ChipContext,
    inputSignal?: booyah.Signal,
    reloadMemento?: booyah.ReloadMemento,
  ) {
    this._container = new Container()
    super.activate(tickInfo, chipContext, inputSignal, reloadMemento)
    this._parentContainer.addChild(this._container)
  }

  public terminate(outputSignal?: booyah.Signal) {
    super.terminate(outputSignal)
    this._container.destroy({ children: true })
  }
}

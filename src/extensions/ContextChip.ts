import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

export default abstract class ContextChip<
  CompositeEvents extends
    booyah.BaseCompositeEvents = booyah.BaseCompositeEvents,
> extends booyah.Composite<CompositeEvents> {
  public get chipContext(): {
    readonly container: pixi.Container
  } & Readonly<Record<string, any>> {
    // @ts-expect-error
    return super.chipContext
  }
}

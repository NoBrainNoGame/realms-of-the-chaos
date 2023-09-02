import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

export default abstract class ContextChip extends booyah.Composite {
  public get chipContext(): {
    readonly container: pixi.Container
  } & Readonly<Record<string, any>> {
    // @ts-expect-error
    return super.chipContext
  }
}

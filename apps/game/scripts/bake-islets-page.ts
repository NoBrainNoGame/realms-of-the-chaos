import { Application, Graphics } from "pixi.js"
import { drawFloatingIsland } from "../src/view/islands"
import {
  ISLET_CANVAS,
  ISLET_CELLS,
  ISLET_RESOLUTION,
  ISLET_SEEDS,
} from "./islets"

/** Draws every islet, opaque, on a transparent canvas: one data URL each. */
async function bake() {
  const { width, height, ax, ay } = ISLET_CANVAS
  const app = new Application()
  await app.init({
    width,
    height,
    resolution: ISLET_RESOLUTION,
    backgroundAlpha: 0,
    // no antialiasing: every pixel is fully opaque or fully empty
    antialias: false,
    preserveDrawingBuffer: true,
  })
  const urls: string[] = []
  const bounds: number[][] = []
  for (let i = 0; i < ISLET_SEEDS.length; i++) {
    app.stage.removeChildren()
    const g = new Graphics()
    drawFloatingIsland(g, ISLET_CELLS[i], ISLET_SEEDS[i])
    g.position.set(width * ax, height * ay)
    app.stage.addChild(g)
    const b = g.getBounds()
    bounds.push([b.x, b.y, b.x + b.width, b.y + b.height])
    app.renderer.render(app.stage)
    urls.push(app.canvas.toDataURL("image/png"))
  }
  return { urls, bounds, width, height }
}

;(window as unknown as { bake: typeof bake }).bake = bake

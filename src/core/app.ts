import * as pixi from "pixi.js"

const app = new pixi.Application<HTMLCanvasElement>({
  resizeTo: window,
})

document.body.appendChild(app.view)

export default app

import * as booyah from "@ghom/booyah"
import { Application, TextureStyle } from "pixi.js"

import Game from "./view/Game"
import { COLORS, FONT } from "./view/theme"
import { params } from "./params"

// crisp pixel art everywhere
TextureStyle.defaultOptions.scaleMode = "nearest"

document.addEventListener("contextmenu", (e) => e.preventDefault())

const app = new Application()
await app.init({
  resizeTo: window,
  background: COLORS.background,
  antialias: false,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
})
document.body.appendChild(app.canvas)

// wait for the pixel font so texts are measured correctly
try {
  await document.fonts.load(`16px ${FONT.split(",")[0]}`)
} catch {
  // the monospace fallback is fine
}

const game = new Game(params)

const runner = new booyah.Runner(game, {
  rootContext: { container: app.stage },
})
if (params.debug) Object.assign(window, { game, runner })
runner.start()

import * as booyah from "@ghom/booyah"
import { Application, TextureStyle } from "pixi.js"
import { params } from "./params"
import { grantForbidden, scarCount } from "./storage"
import Game from "./view/Game"
import { Quality } from "./view/quality"
import { applyScars, COLORS, FONT } from "./view/theme"

// the scars of past vacuum decays drift the colours (before anything draws)
applyScars(scarCount())
for (const id of params.grant) grantForbidden(id)

// crisp pixel art everywhere
TextureStyle.defaultOptions.scaleMode = "nearest"

document.addEventListener("contextmenu", (e) => e.preventDefault())

const app = new Application()
await app.init({
  resizeTo: window,
  background: COLORS.background,
  antialias: false,
  autoDensity: true,
  // capped: past 2, the pixels cost more than they show
  resolution: Math.min(2, window.devicePixelRatio || 1),
})
document.body.appendChild(app.canvas)

// small configurations: fewer pixels when the frames stay slow
const quality = new Quality(app.renderer.resolution)
app.ticker.add((ticker) => {
  const resolution = quality.frame(ticker.deltaMS)
  if (resolution !== null) app.renderer.resolution = resolution
})

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
if (params.debug) Object.assign(window, { game, runner, app })
runner.start()
